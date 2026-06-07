use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use std::thread;

use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter, Manager, State};

/// Maximum number of concurrent terminals (MVP constraint).
pub const MAX_TERMINALS: usize = 6;

/// A single live PTY session.
/// - `master`: kept so we can resize the pty.
/// - `writer`: the pty input (keystrokes from xterm).
/// - `child`: the spawned shell process, killed on close.
struct TerminalSession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

#[derive(Default)]
pub struct PtyState {
    terminals: Mutex<HashMap<String, TerminalSession>>,
}

#[cfg(target_os = "windows")]
fn default_shell() -> String {
    "powershell.exe".to_string()
}

#[cfg(not(target_os = "windows"))]
fn default_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
}

/// Spawn a new shell in `cwd` attached to a fresh PTY and stream its output
/// to the frontend via `pty://output/{id}` events (base64-encoded bytes).
#[tauri::command]
pub fn create_terminal(
    app: AppHandle,
    state: State<'_, PtyState>,
    id: String,
    cwd: String,
    cols: u16,
    rows: u16,
    shell: Option<String>,
) -> Result<(), String> {
    // Hold the lock for the whole spawn so the duplicate check and the final
    // insert are atomic. Otherwise two concurrent calls with the same `id`
    // could both pass the check and spawn two shells, leaking the first child.
    // It also guarantees the reader thread (which removes the entry on exit)
    // can't run its cleanup before we've inserted the session.
    let mut map = state.terminals.lock().map_err(|e| e.to_string())?;
    if map.contains_key(&id) {
        return Ok(()); // already running, ignore duplicate spawn
    }
    if map.len() >= MAX_TERMINALS {
        return Err("Maksimal 6 terminal".into());
    }

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: rows.max(1),
            cols: cols.max(1),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = shell.filter(|s| !s.is_empty()).unwrap_or_else(default_shell);
    let mut cmd = CommandBuilder::new(&shell);
    cmd.cwd(&cwd);
    cmd.env("TERM", "xterm-256color");

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    // Drop the slave so the reader observes EOF once the child exits.
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Reader thread: pump pty output -> frontend.
    let app_handle = app.clone();
    let tid = id.clone();
    thread::spawn(move || {
        let out_event = format!("pty://output/{tid}");
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let payload = STANDARD.encode(&buf[..n]);
                    if app_handle.emit(&out_event, payload).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
        // Shell exited / pty closed: drop the session so it stops counting
        // toward MAX_TERMINALS and its resources are freed. `close_terminal`
        // may have already removed it (returns None) — that's fine.
        if let Some(state) = app_handle.try_state::<PtyState>() {
            if let Ok(mut map) = state.terminals.lock() {
                map.remove(&tid);
            }
        }
        let _ = app_handle.emit(&format!("pty://exit/{tid}"), ());
    });

    map.insert(
        id,
        TerminalSession {
            master: pair.master,
            writer,
            child,
        },
    );
    Ok(())
}

/// Forward keystrokes / input from xterm into the pty.
#[tauri::command]
pub fn write_terminal(state: State<'_, PtyState>, id: String, data: String) -> Result<(), String> {
    let mut map = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(session) = map.get_mut(&id) {
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Resize the pty to match xterm's grid after a fit.
#[tauri::command]
pub fn resize_terminal(
    state: State<'_, PtyState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let map = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(session) = map.get(&id) {
        session
            .master
            .resize(PtySize {
                rows: rows.max(1),
                cols: cols.max(1),
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Kill the shell and drop the session.
#[tauri::command]
pub fn close_terminal(state: State<'_, PtyState>, id: String) -> Result<(), String> {
    let mut map = state.terminals.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = map.remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}
