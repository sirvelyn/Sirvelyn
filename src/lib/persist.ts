import { load, type Store } from "@tauri-apps/plugin-store";
import { useStore, type Workspace } from "../state/store";

/**
 * Persists the workspace folder list across restarts via tauri-plugin-store.
 * Terminals are intentionally NOT persisted (fresh shells each launch).
 */
const FILE = "sirvelyn.json";
const KEY = "workspaces";

let store: Store | null = null;

export async function initPersistence(): Promise<void> {
  try {
    store = await load(FILE);
    const saved = (await store.get<Workspace[]>(KEY)) ?? [];
    useStore.getState().setWorkspaces(saved);
  } catch (e) {
    console.error("Persistence unavailable:", e);
  } finally {
    useStore.getState().setHydrated(true);
  }

  // Save whenever the workspace list changes.
  useStore.subscribe((state, prev) => {
    if (state.workspaces !== prev.workspaces) {
      void saveWorkspaces(state.workspaces);
    }
  });
}

async function saveWorkspaces(workspaces: Workspace[]): Promise<void> {
  if (!store) return;
  await store.set(KEY, workspaces);
  await store.save();
}
