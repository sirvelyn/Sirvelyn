import { useEffect } from "react";
import { SHORTCUT_GUIDE } from "../lib/useShortcuts";
import { UpdateSection } from "./UpdateSection";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">⚙ PENGATURAN</span>
          <button className="px-btn px-btn-sm px-btn-ghost" title="Tutup" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-section">Pintasan Keyboard</p>
          <ul className="shortcut-list">
            {SHORTCUT_GUIDE.map((s) => (
              <li className="shortcut-row" key={s.keys}>
                <span className="shortcut-desc">{s.desc}</span>
                <kbd className="shortcut-keys">{s.keys}</kbd>
              </li>
            ))}
          </ul>
          <UpdateSection />
        </div>
      </div>
    </div>
  );
}
