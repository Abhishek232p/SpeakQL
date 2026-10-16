"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function OfflineIndicator() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
        color: "#ffffff",
        padding: "8px 16px",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
      }}
    >
      <span>⚡ Offline Mode:</span>
      <span>
        Internet connection lost. Local exercises, practice whiteboard, and audio playback remain available. Your unsaved responses are preserved locally in the editor. Reconnect to submit evaluations and record progress.
      </span>
    </aside>
  );
}
