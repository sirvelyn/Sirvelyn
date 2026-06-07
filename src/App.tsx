import { useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { ResizeHandles } from "./components/ResizeHandles";
import { Sidebar } from "./components/Sidebar";
import { TerminalArea } from "./components/TerminalArea";
import { initPersistence } from "./lib/persist";
import { useStore } from "./state/store";

export default function App() {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    void initPersistence();
  }, []);

  return (
    <div className="app">
      <ResizeHandles />
      <TitleBar />
      <div className="app-body">
        {/* Wait for saved workspaces + shell detection before rendering, so the
            empty state never flashes before persisted data has loaded. */}
        {hydrated ? (
          <>
            <Sidebar />
            <TerminalArea />
          </>
        ) : (
          <div className="app-loading">memuat…</div>
        )}
      </div>
    </div>
  );
}
