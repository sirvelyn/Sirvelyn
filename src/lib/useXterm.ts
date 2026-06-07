import { useCallback, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { xtermTheme } from "./theme";
import {
  closeTerminal,
  createTerminal,
  onTerminalExit,
  onTerminalOutput,
  resizeTerminal,
  writeTerminal,
} from "./pty";

/**
 * Owns one xterm.js instance bound to a backend PTY (`id`), opened in `cwd`.
 * The instance lives for the lifetime of the mounted component — switching
 * tabs/view modes must hide (display:none), never unmount, so scrollback and
 * the shell process survive. Call `refit()` when the pane becomes visible.
 */
export function useXterm(id: string, cwd: string, shell?: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  const refit = useCallback(() => {
    const el = containerRef.current;
    const term = termRef.current;
    const fit = fitRef.current;
    if (!el || !term || !fit) return;
    // Skip while hidden (display:none) or not laid out — fit would throw/NaN.
    if (el.offsetParent === null || el.clientWidth === 0 || el.clientHeight === 0) return;
    try {
      fit.fit();
      void resizeTerminal(id, term.cols, term.rows);
    } catch {
      /* transient layout race, ignore */
    }
  }, [id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let raf = 0;
    let unlistenOut: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 13,
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 8000,
      theme: xtermTheme,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);
    termRef.current = term;
    fitRef.current = fit;

    // GPU renderer: draws text + custom box-drawing/block glyphs to a canvas so
    // TUI apps (Claude Code, opencode, …) render crisply with connected borders
    // and smooth full-screen redraws. If WebGL is unavailable or its context is
    // lost (can happen in WebView2), fall back to xterm's default DOM renderer.
    let webgl: WebglAddon | undefined;
    try {
      webgl = new WebglAddon();
      webgl.onContextLoss(() => {
        webgl?.dispose(); // disposing reverts the terminal to the DOM renderer
        webgl = undefined;
      });
      term.loadAddon(webgl);
    } catch {
      webgl = undefined; // no WebGL → keep DOM renderer
    }

    term.onData((d) => void writeTerminal(id, d));

    // Register the output/exit listeners BEFORE spawning the pty, otherwise the
    // shell's first bytes (the initial prompt) can be emitted before `listen`
    // has finished registering over IPC and would be lost.
    const setup = async () => {
      const [uOut, uExit] = await Promise.all([
        onTerminalOutput(id, (bytes) => {
          if (!disposed) term.write(bytes);
        }),
        onTerminalExit(id, () => {
          if (!disposed) term.writeln("\r\n\x1b[90m[ proses berakhir ]\x1b[0m");
        }),
      ]);
      if (disposed) {
        uOut();
        uExit();
        return;
      }
      unlistenOut = uOut;
      unlistenExit = uExit;

      // Listeners are live; fit then spawn the pty on the next frame (layout settled).
      raf = requestAnimationFrame(() => {
        refit();
        createTerminal(id, cwd, term.cols || 80, term.rows || 24, shell).catch((e) =>
          term.writeln(`\x1b[31mGagal memulai shell: ${e}\x1b[0m`),
        );
      });
    };
    void setup();

    const ro = new ResizeObserver(() => refit());
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unlistenOut?.();
      unlistenExit?.();
      void closeTerminal(id);
      webgl?.dispose();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [id, cwd, shell, refit]);

  return { containerRef, refit };
}
