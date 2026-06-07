import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SettingsModal } from "./SettingsModal";

const appWindow = getCurrentWindow();

/** Custom pixel-art titlebar (window has decorations:false). */
export function TitleBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-brand" data-tauri-drag-region>
        <img src="/logo.png" className="titlebar-logo pixelated" alt="" draggable={false} />
        <span className="titlebar-title">SIRVELYN</span>
      </div>
      <div className="titlebar-spacer" data-tauri-drag-region />
      <div className="titlebar-controls">
        <button
          className="tb-btn"
          title="Pengaturan & pintasan"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
        <button className="tb-btn" title="Minimize" onClick={() => void appWindow.minimize()}>
          –
        </button>
        <button className="tb-btn" title="Maximize" onClick={() => void appWindow.toggleMaximize()}>
          ▢
        </button>
        <button className="tb-btn tb-close" title="Close" onClick={() => void appWindow.close()}>
          ✕
        </button>
      </div>
    </header>
    <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
