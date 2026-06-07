import { Channel, invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Thin wrappers around the Rust pty commands + output/exit event streams. */

export interface ShellInfo {
  name: string;
  path: string;
}

/** Shells detected as installed on this machine, in preference order. */
export function listShells() {
  return invoke<ShellInfo[]>("list_shells");
}

export function createTerminal(
  id: string,
  cwd: string,
  cols: number,
  rows: number,
  onOutput: Channel<ArrayBuffer>,
  shell?: string,
) {
  return invoke<void>("create_terminal", { id, cwd, cols, rows, shell, onOutput });
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

export function onTerminalExit(id: string, cb: () => void): Promise<UnlistenFn> {
  return listen(`pty://exit/${id}`, () => cb());
}
