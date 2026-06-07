import { useStore } from "../state/store";
import { TerminalView } from "./TerminalView";

function gridClass(n: number): string {
  if (n <= 1) return "g1";
  if (n === 2) return "g2";
  if (n <= 4) return "g4";
  return "g6";
}

export function TerminalArea() {
  const terminals = useStore((s) => s.terminals);
  const workspaces = useStore((s) => s.workspaces);
  const viewMode = useStore((s) => s.viewMode);
  const activeTerminalId = useStore((s) => s.activeTerminalId);
  const setViewMode = useStore((s) => s.setViewMode);
  const setActive = useStore((s) => s.setActive);

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
          className={`term-stage ${
            viewMode === "split" ? `split ${gridClass(terminals.length)}` : "tabbed"
          }`}
        >
          {terminals.map((t) => (
            <TerminalView
              key={t.id}
              id={t.id}
              cwd={cwdFor(t.workspaceId)}
              title={t.title}
              shell={t.shell}
              visible={viewMode === "split" ? true : t.id === activeId}
              active={t.id === activeId}
            />
          ))}
        </div>
      )}
    </main>
  );
}
