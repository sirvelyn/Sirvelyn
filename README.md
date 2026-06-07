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

## Auto-update (mechanism wired, host pending)

The Tauri updater plugin is set up; users check manually via the ⚙ settings
dialog. To actually ship updates, finish these once releases are hosted:

1. **Endpoint** — in `src-tauri/tauri.conf.json` → `plugins.updater.endpoints`,
   replace the `OWNER/REPO` placeholder with your real GitHub repo. Until then,
   "Cek pembaruan" will just report it can't check.
2. **Signing key** — a keypair was generated. The public key is already in
   `tauri.conf.json` (`plugins.updater.pubkey`); the private key is
   `sirvelyn-updater.key` (git-ignored — **never commit it, keep a backup**;
   losing it means updates can no longer be signed).
3. **Build signed artifacts** for a release — set
   `bundle.createUpdaterArtifacts: true`, then build with the key in env:
   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content sirvelyn-updater.key -Raw
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
   npm run tauri build
   ```
   Upload the generated `latest.json` and signed bundles to the release the
   endpoint points at. (Normal builds work without the key while
   `createUpdaterArtifacts` is off.)

## Stack

- **Frontend:** React 19 + TypeScript + Vite, Zustand for state, xterm.js 5.5
- **Backend:** Rust (Tauri 2), `portable-pty` for the PTY, output streamed to the
  UI over a Tauri channel as raw bytes
