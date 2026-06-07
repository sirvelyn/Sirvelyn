import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Thin wrappers around the Rust pty commands + output/exit event streams. */

export function createTerminal(id: string, cwd: string, cols: number, rows: number) {
  return invoke<void>("create_terminal", { id, cwd, cols, rows });
}

export function writeTerminal(id: string, data: string) {
  return invoke<void>("write_terminal", { id, data });
}

export function resizeTerminal(id: string, cols: number, rows: number) {
  return invoke<void>("resize_terminal", { id, cols, rows });
}

export function closeTerminal(id: string) {
  return invoke<void>("close_terminal", { id });
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function onTerminalOutput(
  id: string,
  cb: (data: Uint8Array) => void,
): Promise<UnlistenFn> {
  return listen<string>(`pty://output/${id}`, (e) => cb(base64ToBytes(e.payload)));
}

export function onTerminalExit(id: string, cb: () => void): Promise<UnlistenFn> {
  return listen(`pty://exit/${id}`, () => cb());
}
