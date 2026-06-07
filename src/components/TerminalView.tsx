import { useEffect } from "react";
import { useXterm } from "../lib/useXterm";
import { useStore } from "../state/store";

interface Props {
  id: string;
  cwd: string;
  title: string;
  visible: boolean;
  active: boolean;
}

export function TerminalView({ id, cwd, title, visible, active }: Props) {
  const removeTerminal = useStore((s) => s.removeTerminal);
  const setActive = useStore((s) => s.setActive);
  const { containerRef, refit } = useXterm(id, cwd);

  // Re-fit when this pane becomes visible again (tab/view switch).
  useEffect(() => {
    if (!visible) return;
    const r = requestAnimationFrame(() => refit());
    return () => cancelAnimationFrame(r);
  }, [visible, refit]);

  return (
    <section
      className={`term-pane${active ? " is-active" : ""}`}
      style={{ display: visible ? "flex" : "none" }}
      onMouseDown={() => setActive(id)}
    >
      <div className="term-pane-head">
        <span className="term-pane-title">▸ {title}</span>
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
