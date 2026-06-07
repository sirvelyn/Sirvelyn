import { useEffect } from "react";
import { useStore, type AppStateSnapshot } from "../state/store";

/** Display rows for the in-app shortcut guide (kept next to the handler). */
export interface ShortcutDoc {
  keys: string;
  desc: string;
}

export const SHORTCUT_GUIDE: ShortcutDoc[] = [
  { keys: "Ctrl + Shift + T", desc: "Terminal baru" },
  { keys: "Ctrl + Shift + W", desc: "Tutup terminal aktif" },
  { keys: "Ctrl + Tab", desc: "Tab berikutnya" },
  { keys: "Ctrl + Shift + Tab", desc: "Tab sebelumnya" },
  { keys: "Ctrl + Shift + 1 … 6", desc: "Lompat ke tab 1–6" },
  { keys: "Ctrl + Shift + C", desc: "Salin seleksi" },
  { keys: "Ctrl + Shift + V", desc: "Tempel ke terminal" },
];

/** Workspace to spawn a new terminal in: the active terminal's, else the first. */
function activeWorkspaceId(s: AppStateSnapshot): string | undefined {
  const active = s.terminals.find((t) => t.id === s.activeTerminalId);
  return active?.workspaceId ?? s.workspaces[0]?.id;
}

function cycle(s: AppStateSnapshot, dir: 1 | -1): void {
  const n = s.terminals.length;
  if (n === 0) return;
  const i = s.terminals.findIndex((t) => t.id === s.activeTerminalId);
  const next = ((i < 0 ? 0 : i) + dir + n) % n;
  s.setActive(s.terminals[next].id);
}

/**
 * App-level keyboard shortcuts. Registered on `window` in the capture phase so
 * they run before xterm's own key handling; only the recognised combos are
 * consumed (preventDefault + stopPropagation), every other key falls through to
 * the focused terminal untouched — including xterm's own Ctrl+Shift+C/V.
 */
export function useShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only plain-Ctrl combos (optionally with Shift). Leave Alt/Meta alone.
      if (!e.ctrlKey || e.altKey || e.metaKey) return;
      const s = useStore.getState();

      const consume = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      if (e.shiftKey && e.code === "KeyT") {
        const wsId = activeWorkspaceId(s);
        if (wsId) s.addTerminal(wsId);
        consume();
      } else if (e.shiftKey && e.code === "KeyW") {
        if (s.activeTerminalId) s.removeTerminal(s.activeTerminalId);
        consume();
      } else if (e.code === "Tab") {
        cycle(s, e.shiftKey ? -1 : 1);
        consume();
      } else if (e.shiftKey && /^Digit[1-6]$/.test(e.code)) {
        const t = s.terminals[Number(e.code.slice(5)) - 1];
        if (t) s.setActive(t.id);
        consume();
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, []);
}
