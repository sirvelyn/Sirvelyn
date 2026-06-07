import ReactDOM from "react-dom/client";
import App from "./App";

// Pixel + mono fonts (bundled offline via @fontsource).
import "@fontsource/press-start-2p/400.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

import "@xterm/xterm/css/xterm.css";
import "./styles/pixel.css";

// NOTE: no React.StrictMode — it double-invokes effects in dev, which would
// spawn/kill PTYs twice. The terminal lifecycle is imperative, so we skip it.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
