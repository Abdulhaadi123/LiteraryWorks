"use client";

import { useState, type FormEvent } from "react";

const alertIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

/** A strong password made in the browser (crypto.getRandomValues): four groups of six, no look-alike characters. */
function strongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const group = (from: number) => Array.from(bytes.subarray(from, from + 6), (b) => chars[b % chars.length]).join("");
  return `${group(0)}-${group(6)}-${group(12)}-${group(18)}`;
}

/** The first-run form: the owner makes the admin account. Shown only while no account exists. */
export function SetupForm({ needsKey }: { needsKey: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function generate() {
    const p = strongPassword();
    setPassword(p);
    setConfirm(p);
    setShow(true);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password, confirm, key: data.get("key") ?? "" }),
      });
      if (res.ok) {
        window.location.assign("/admin");
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      setError(j.message || "Could not make the account. Please try again.");
      // someone made it first (or it exists already): the sign-in form is what the page needs now
      if (res.status === 409) window.setTimeout(() => window.location.assign("/admin/login"), 1500);
    } catch {
      setError("We could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form className="adm-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="s-email">Your e-mail address</label>
        <input id="s-email" name="email" type="email" className="input" autoComplete="username" required maxLength={254} autoFocus spellCheck={false} />
      </div>
      <div className="field">
        <label htmlFor="s-pass">Password</label>
        <div className="adm-pass">
          <input id="s-pass" type={show ? "text" : "password"} className="input" autoComplete="new-password" required minLength={12} maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="s-pass-hint" />
          <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <span className="hint" id="s-pass-hint">
          12 or more characters.{" "}
          <button type="button" className="adm-link" onClick={generate}>
            Make a strong one for me
          </button>
        </span>
      </div>
      <div className="field">
        <label htmlFor="s-confirm">Password again</label>
        <input id="s-confirm" type={show ? "text" : "password"} className="input" autoComplete="new-password" required maxLength={200} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {needsKey ? (
        <div className="field">
          <label htmlFor="s-key">Setup key</label>
          <input id="s-key" name="key" type="password" className="input" autoComplete="off" required maxLength={200} aria-describedby="s-key-hint" />
          <span className="hint" id="s-key-hint">
            The ADMIN_SETUP_KEY you set on the host.
          </span>
        </div>
      ) : null}
      <div role="alert" aria-live="assertive">
        {error ? (
          <p className="adm-error">
            {alertIcon}
            <span>{error}</span>
          </p>
        ) : null}
      </div>
      <button type="submit" className="btn btn-navy" disabled={busy} style={{ minHeight: "2.75rem" }}>
        {busy ? "Making the account" : "Make the admin account"}
      </button>
    </form>
  );
}
