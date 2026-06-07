import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  path: string;
}

export interface TerminalTab {
  id: string;
  workspaceId: string;
  title: string;
}

export type ViewMode = "tabs" | "split";

export const MAX_TERMINALS = 6;

interface AppState {
  workspaces: Workspace[];
  terminals: TerminalTab[];
  activeTerminalId: string | null;
  viewMode: ViewMode;
  hydrated: boolean;

  setWorkspaces: (w: Workspace[]) => void;
  addWorkspace: (w: Workspace) => void;
  removeWorkspace: (id: string) => void;
  addTerminal: (workspaceId: string) => string | null;
  removeTerminal: (id: string) => void;
  setActive: (id: string) => void;
  setViewMode: (m: ViewMode) => void;
  setHydrated: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  workspaces: [],
  terminals: [],
  activeTerminalId: null,
  viewMode: "split",
  hydrated: false,

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
    if (s.terminals.length >= MAX_TERMINALS) return null;
    const ws = s.workspaces.find((w) => w.id === workspaceId);
    if (!ws) return null;
    const id = crypto.randomUUID();
    const n = s.terminals.filter((t) => t.workspaceId === workspaceId).length + 1;
    set({
      terminals: [...s.terminals, { id, workspaceId, title: `${ws.name} #${n}` }],
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

  setActive: (activeTerminalId) => set({ activeTerminalId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
