import { create } from "zustand";
import type { ShellInfo } from "../lib/pty";

export interface Workspace {
  id: string;
  name: string;
  path: string;
}

export interface TerminalTab {
  id: string;
  workspaceId: string;
  title: string;
  /** Absolute path of the shell this terminal was spawned with. */
  shell?: string;
  /** True once the shell process has exited (backend session already freed). */
  dead?: boolean;
}

export type ViewMode = "tabs" | "split";

export const MAX_TERMINALS = 6;

interface AppState {
  workspaces: Workspace[];
  terminals: TerminalTab[];
  activeTerminalId: string | null;
  viewMode: ViewMode;
  hydrated: boolean;
  shells: ShellInfo[];
  /** Shell path used for new terminals; null until shells are detected. */
  defaultShell: string | null;

  setWorkspaces: (w: Workspace[]) => void;
  addWorkspace: (w: Workspace) => void;
  removeWorkspace: (id: string) => void;
  addTerminal: (workspaceId: string) => string | null;
  removeTerminal: (id: string) => void;
  markTerminalDead: (id: string) => void;
  setActive: (id: string) => void;
  setViewMode: (m: ViewMode) => void;
  setHydrated: (v: boolean) => void;
  setShells: (s: ShellInfo[]) => void;
  setDefaultShell: (path: string) => void;
}

/** Full store value as returned by `useStore.getState()`. */
export type AppStateSnapshot = AppState;

export const useStore = create<AppState>((set, get) => ({
  workspaces: [],
  terminals: [],
  activeTerminalId: null,
  viewMode: "split",
  hydrated: false,
  shells: [],
  defaultShell: null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (w) =>
    set((s) =>
      s.workspaces.some((x) => x.path === w.path)
        ? s
        : { workspaces: [...s.workspaces, w] },
    ),

  removeWorkspace: (id) =>
    set((s) => {
      const terminals = s.terminals.filter((t) => t.workspaceId !== id);
      const activeStillThere = terminals.some((t) => t.id === s.activeTerminalId);
      return {
        workspaces: s.workspaces.filter((w) => w.id !== id),
        terminals,
        activeTerminalId: activeStillThere
          ? s.activeTerminalId
          : terminals[terminals.length - 1]?.id ?? null,
      };
    }),

  addTerminal: (workspaceId) => {
    const s = get();
    // Only live terminals count toward the limit — exited-but-open tabs have
    // already had their backend session freed, so they don't occupy a slot.
    if (s.terminals.filter((t) => !t.dead).length >= MAX_TERMINALS) return null;
    const ws = s.workspaces.find((w) => w.id === workspaceId);
    if (!ws) return null;
    const id = crypto.randomUUID();
    const n = s.terminals.filter((t) => t.workspaceId === workspaceId).length + 1;
    set({
      terminals: [
        ...s.terminals,
        { id, workspaceId, title: `${ws.name} #${n}`, shell: s.defaultShell ?? undefined },
      ],
      activeTerminalId: id,
    });
    return id;
  },

  removeTerminal: (id) =>
    set((s) => {
      const terminals = s.terminals.filter((t) => t.id !== id);
      const activeTerminalId =
        s.activeTerminalId === id
          ? terminals[terminals.length - 1]?.id ?? null
          : s.activeTerminalId;
      return { terminals, activeTerminalId };
    }),

  markTerminalDead: (id) =>
    set((s) => ({
      terminals: s.terminals.map((t) => (t.id === id ? { ...t, dead: true } : t)),
    })),

  setActive: (activeTerminalId) => set({ activeTerminalId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setHydrated: (hydrated) => set({ hydrated }),

  setShells: (shells) =>
    set((s) => ({
      shells,
      // Keep the saved/selected default if still present, else pick the first.
      defaultShell:
        s.defaultShell && shells.some((sh) => sh.path === s.defaultShell)
          ? s.defaultShell
          : shells[0]?.path ?? null,
    })),

  setDefaultShell: (defaultShell) => set({ defaultShell }),
}));
