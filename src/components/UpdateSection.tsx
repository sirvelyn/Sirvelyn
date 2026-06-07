import { useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Status = "idle" | "checking" | "available" | "uptodate" | "installing" | "error";

/** Manual "check for updates" control for the settings modal. */
export function UpdateSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateRef = useRef<Update | null>(null);

  async function onCheck() {
    setStatus("checking");
    setError(null);
    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        setVersion(update.version);
        setStatus("available");
      } else {
        setStatus("uptodate");
      }
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  async function onInstall() {
    const update = updateRef.current;
    if (!update) return;
    setStatus("installing");
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  const busy = status === "checking" || status === "installing";

  return (
    <>
      <p className="modal-section">Pembaruan</p>
      <div className="update-row">
        {status === "available" ? (
          <button className="px-btn px-btn-sm" onClick={onInstall}>
            Pasang v{version} &amp; mulai ulang
          </button>
        ) : (
          <button className="px-btn px-btn-sm" disabled={busy} onClick={onCheck}>
            {status === "checking" ? "Memeriksa…" : "Cek pembaruan"}
          </button>
        )}
        {status === "uptodate" && <span className="update-msg">Sudah versi terbaru ✓</span>}
        {status === "installing" && <span className="update-msg">Mengunduh &amp; memasang…</span>}
        {status === "error" && (
          <span className="update-msg update-err" title={error ?? undefined}>
            Tidak dapat memeriksa pembaruan
          </span>
        )}
      </div>
    </>
  );
}
