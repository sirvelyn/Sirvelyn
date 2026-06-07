import { useEffect } from "react";
import { useXterm } from "../lib/useXterm";
import { MAX_TERMINALS, useStore } from "../state/store";

interface Props {
  id: string;
  cwd: string;
  title: string;
  shell?: string;
  dead?: boolean;
  visible: boolean;
  active: boolean;
}

export function TerminalView({ id, cwd, title, shell, dead, visible, active }: Props) {
  const removeTerminal = useStore((s) => s.removeTerminal);
  const setActive = useStore((s) => s.setActive);
  const markTerminalDead = useStore((s) => s.markTerminalDead);
  const restartTerminal = useStore((s) => s.restartTerminal);
  // A dead tab can only be revived if a live slot is free.
  const canRestart = useStore((s) => s.terminals.filter((t) => !t.dead).length < MAX_TERMINALS);
  const fontSize = useStore((s) => s.fontSize);
  const { containerRef, refit } = useXterm(id, cwd, fontSize, shell, () => markTerminalDead(id));

  // Re-fit when this pane becomes visible again (tab/view switch).
  useEffect(() => {
    if (!visible) return;
    const r = requestAnimationFrame(() => refit());
    return () => cancelAnimationFrame(r);
  }, [visible, refit]);

  return (
    <section
      className={`term-pane${active ? " is-active" : ""}${dead ? " is-dead" : ""}`}
      style={{ display: visible ? "flex" : "none" }}
      onMouseDown={() => setActive(id)}
    >
      <div className="term-pane-head">
        <span className="term-pane-title">▸ {title}</span>
        {dead && <span className="term-pane-dead">● selesai</span>}
        {dead && (
          <button
            className="px-btn px-btn-sm"
            title={canRestart ? "Jalankan ulang shell" : "Tutup terminal lain dulu (maks 6)"}
            disabled={!canRestart}
            onClick={(e) => {
              e.stopPropagation();
              restartTerminal(id);
            }}
          >
            ↻
          </button>
        )}
        <button
          className="px-btn px-btn-sm px-btn-ghost"
          title="Tutup terminal"
          onClick={(e) => {
            e.stopPropagation();
            removeTerminal(id);
          }}
        >
          ✕
        </button>
      </div>
      <div className="term-host" ref={containerRef} />
    </section>
  );
}
