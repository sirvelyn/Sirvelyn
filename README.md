# Sirvelyn

A pixel-art terminal emulator for the desktop, built with Tauri 2, React 19 and
xterm.js. Open folders as workspaces and run up to 6 terminals side by side in a
split grid or as tabs, with a GPU (WebGL) renderer so full-screen TUIs (Claude
Code, opencode, gemini, …) stay crisp and smooth.

## Features

- Multiple terminals (max 6) in **split** or **tabbed** layout
- Per-machine **shell picker** (PowerShell, pwsh, cmd, Git Bash; bash/zsh/fish on
  Unix), with the choice persisted across restarts
- Workspace folders persisted across restarts; terminals start fresh each launch
- WebGL renderer with a DOM-renderer fallback
- Custom pixel-art chrome (frameless window, custom title bar)

## Development

```bash
npm install
npm run tauri dev
```

## Build installers

```bash
npm run tauri build
```

Outputs an `.msi` and an NSIS `setup.exe` under
`src-tauri/target/release/bundle/`.

## Stack

- **Frontend:** React 19 + TypeScript + Vite, Zustand for state, xterm.js 5.5
- **Backend:** Rust (Tauri 2), `portable-pty` for the PTY, output streamed to the
  UI over a Tauri channel as raw bytes
