import { open } from "@tauri-apps/plugin-dialog";
import { MAX_TERMINALS, useStore } from "../state/store";
import { InlineEdit } from "./InlineEdit";

function basename(p: string): string {
  const trimmed = p.replace(/[\\/]+$/, "");
  const parts = trimmed.split(/[\\/]/);
  return parts[parts.length - 1] || trimmed;
}

export function Sidebar() {
  const workspaces = useStore((s) => s.workspaces);
  const terminals = useStore((s) => s.terminals);
  const addWorkspace = useStore((s) => s.addWorkspace);
  const removeWorkspace = useStore((s) => s.removeWorkspace);
  const renameWorkspace = useStore((s) => s.renameWorkspace);
  const addTerminal = useStore((s) => s.addTerminal);
  const shells = useStore((s) => s.shells);
  const defaultShell = useStore((s) => s.defaultShell);
  const setDefaultShell = useStore((s) => s.setDefaultShell);

  // Exited tabs no longer hold a backend slot, so the limit counts live ones.
  const total = terminals.filter((t) => !t.dead).length;
  const atMax = total >= MAX_TERMINALS;

  async function pickFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Pilih folder workspace",
    });
    if (typeof selected === "string") {
      addWorkspace({ id: crypto.randomUUID(), name: basename(selected), path: selected });
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-heading">WORKSPACES</span>
        <span className="term-counter" title="Total terminal aktif">
          {total}/{MAX_TERMINALS}
        </span>
      </div>

      {shells.length > 0 && (
        <label className="shell-picker" title="Shell untuk terminal baru">
          <span className="shell-picker-label">SHELL</span>
          <select
            className="px-select"
            value={defaultShell ?? ""}
            onChange={(e) => setDefaultShell(e.target.value)}
          >
            {shells.map((sh) => (
              <option key={sh.path} value={sh.path}>
                {sh.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button className="px-btn px-btn-block" onClick={pickFolder}>
        + Add Folder
      </button>

      <div className="ws-list">
        {workspaces.length === 0 && (
          <p className="muted">Belum ada folder. Klik "Add Folder" untuk mulai.</p>
        )}
        {workspaces.map((ws) => {
          const count = terminals.filter((t) => t.workspaceId === ws.id).length;
          return (
            <div className="ws-item" key={ws.id}>
              <div className="ws-info">
                <span className="ws-name" title={ws.path}>
                  🔑{" "}
                  <InlineEdit
                    value={ws.name}
                    title={ws.path}
                    onCommit={(name) => renameWorkspace(ws.id, name)}
                  />
                </span>
                <span className="ws-path" title={ws.path}>
                  {ws.path}
                </span>
              </div>
              <div className="ws-actions">
                <button
                  className="px-btn px-btn-sm"
                  disabled={atMax}
                  title={atMax ? "Maksimal 6 terminal" : "Buka terminal baru di folder ini"}
                  onClick={() => addTerminal(ws.id)}
                >
                  + Terminal{count > 0 ? ` · ${count}` : ""}
                </button>
                <button
                  className="px-btn px-btn-sm px-btn-ghost"
                  title="Hapus folder"
                  onClick={() => removeWorkspace(ws.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
