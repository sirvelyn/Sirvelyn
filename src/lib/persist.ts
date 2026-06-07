import { load, type Store } from "@tauri-apps/plugin-store";
import { useStore, type Workspace } from "../state/store";
import { listShells } from "./pty";

/**
 * Persists the workspace folder list and the chosen default shell across
 * restarts via tauri-plugin-store. Terminals are intentionally NOT persisted
 * (fresh shells each launch).
 */
const FILE = "sirvelyn.json";
const KEY_WORKSPACES = "workspaces";
const KEY_DEFAULT_SHELL = "defaultShell";
const KEY_FONT_SIZE = "fontSize";

let store: Store | null = null;

export async function initPersistence(): Promise<void> {
  try {
    store = await load(FILE);
    const savedWorkspaces = (await store.get<Workspace[]>(KEY_WORKSPACES)) ?? [];
    useStore.getState().setWorkspaces(savedWorkspaces);

    // Apply the saved shell choice BEFORE detecting shells, so `setShells`
    // keeps it as long as that shell is still installed.
    const savedShell = await store.get<string>(KEY_DEFAULT_SHELL);
    if (savedShell) useStore.getState().setDefaultShell(savedShell);

    const savedFontSize = await store.get<number>(KEY_FONT_SIZE);
    if (typeof savedFontSize === "number") useStore.getState().setFontSize(savedFontSize);
  } catch (e) {
    console.error("Persistence unavailable:", e);
  }

  // Detect installed shells regardless of whether the store loaded.
  try {
    useStore.getState().setShells(await listShells());
  } catch (e) {
    console.error("Shell detection failed:", e);
  }

  useStore.getState().setHydrated(true);

  // Save whenever the persisted slices change.
  useStore.subscribe((state, prev) => {
    if (state.workspaces !== prev.workspaces) {
      void store?.set(KEY_WORKSPACES, state.workspaces).then(() => store?.save());
    }
    if (state.defaultShell !== prev.defaultShell && state.defaultShell) {
      void store?.set(KEY_DEFAULT_SHELL, state.defaultShell).then(() => store?.save());
    }
    if (state.fontSize !== prev.fontSize) {
      void store?.set(KEY_FONT_SIZE, state.fontSize).then(() => store?.save());
    }
  });
}
