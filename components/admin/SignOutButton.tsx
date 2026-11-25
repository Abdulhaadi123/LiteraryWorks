"use client";

import { useState } from "react";

/** Signs out of this device, or (everywhere) of every device, then goes to the sign-in page. */
export function SignOutButton({ everywhere = false, className = "btn btn-sm", children }: { everywhere?: boolean; className?: string; children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function go() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ everywhere }) });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        setError(j.message || "Could not sign out. Please try again.");
        setBusy(false);
        // the cookie is cleared even when the other devices could not be reached, so this device is signed out
        if (res.status !== 503) return;
      }
      window.location.assign("/admin/login");
    } catch {
      setError("Could not reach the server. Please try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={go} disabled={busy}>
        {busy ? "Signing out" : children}
      </button>
      {error ? (
        <span role="alert" className="hint" style={{ color: "#b42318" }}>
          {error}
        </span>
      ) : null}
    </>
  );
}
