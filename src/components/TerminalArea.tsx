import { useStore } from "../state/store";
import { useResizableGrid } from "../lib/useResizableGrid";
import { TerminalView } from "./TerminalView";

/** Columns/rows the split grid uses for a given terminal count. */
function gridDims(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 };
}

export function TerminalArea() {
  const terminals = useStore((s) => s.terminals);
  const workspaces = useStore((s) => s.workspaces);
  const viewMode = useStore((s) => s.viewMode);
  const activeTerminalId = useStore((s) => s.activeTerminalId);
  const setViewMode = useStore((s) => s.setViewMode);
  const setActive = useStore((s) => s.setActive);

  const { cols, rows } = gridDims(terminals.length);
  const grid = useResizableGrid(cols, rows);
  const split = viewMode === "split";

  const activeId = activeTerminalId ?? terminals[0]?.id ?? null;
  const cwdFor = (wsId: string) => workspaces.find((w) => w.id === wsId)?.path ?? ".";

  return (
    <main className="term-area">
      <div className="term-toolbar">
        <div className="tabs">
          {terminals.map((t) => (
            <button
              key={t.id}
              className={`tab${t.id === activeId ? " tab-active" : ""}`}
              onClick={() => setActive(t.id)}
              title={t.title}
            >
              <span className="tab-key">🔑</span>
              <span className="tab-label">{t.title}</span>
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            className={`px-btn px-btn-sm px-btn-ghost${viewMode === "tabs" ? " is-on" : ""}`}
            onClick={() => setViewMode("tabs")}
          >
            Tabs
          </button>
          <button
            className={`px-btn px-btn-sm px-btn-ghost${viewMode === "split" ? " is-on" : ""}`}
            onClick={() => setViewMode("split")}
          >
            Split
          </button>
        </div>
      </div>

      {terminals.length === 0 ? (
        <div className="empty-state">
          <img src="/logo.png" className="empty-logo pixelated" alt="" draggable={false} />
          <p className="empty-title">SIRVELYN</p>
          <p className="empty-sub">Tambah folder di kiri, lalu buka terminal untuk mulai.</p>
        </div>
      ) : (
        <div
          ref={grid.stageRef}
          className={`term-stage ${split ? "split" : "tabbed"}`}
          style={
            split
              ? {
                  gridTemplateColumns: grid.gridTemplateColumns,
                  gridTemplateRows: grid.gridTemplateRows,
                }
              : undefined
          }
        >
          {terminals.map((t) => (
            <TerminalView
              key={`${t.id}#${t.epoch ?? 0}`}
              id={t.id}
              cwd={cwdFor(t.workspaceId)}
              title={t.title}
              shell={t.shell}
              dead={t.dead}
              visible={split ? true : t.id === activeId}
              active={t.id === activeId}
            />
          ))}
          {split &&
            grid.dividers.map((d) => (
              <div
                key={d.key}
                className={d.className}
                style={d.style}
                onPointerDown={d.onPointerDown}
              />
            ))}
        </div>
      )}
    </main>
  );
}
