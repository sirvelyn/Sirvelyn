import { useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { ResizeHandles } from "./components/ResizeHandles";
import { Sidebar } from "./components/Sidebar";
import { TerminalArea } from "./components/TerminalArea";
import { initPersistence } from "./lib/persist";

export default function App() {
  useEffect(() => {
    void initPersistence();
  }, []);

  return (
    <div className="app">
      <ResizeHandles />
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <TerminalArea />
      </div>
    </div>
  );
}
