"use client";

import { useState, type FormEvent } from "react";

const alertIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

/** The sign-in form: e-mail, password and (when it is switched on) the six-digit code from the authenticator app. */
export function LoginForm({ twoFactor }: { twoFactor: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), code: data.get("code") ?? "" }),
      });
      if (res.ok) {
        // a full load, so the page that follows is made with the new session
        window.location.assign("/admin");
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      setError(j.message || "Could not sign in. Please try again.");
    } catch {
      setError("We could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form className="adm-form" onSubmit={onSubmit} noValidate={false}>
      <div className="field">
        <label htmlFor="a-email">E-mail address</label>
        <input id="a-email" name="email" type="email" className="input" autoComplete="username" required maxLength={254} autoFocus spellCheck={false} />
      </div>
      <div className="field">
        <label htmlFor="a-pass">Password</label>
        <div className="adm-pass">
          <input id="a-pass" name="password" type={show ? "text" : "password"} className="input" autoComplete="current-password" required maxLength={512} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {twoFactor ? (
        <div className="field">
          <label htmlFor="a-code">Authentication code</label>
          <input id="a-code" name="code" type="text" className="input code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="000000" required aria-describedby="a-code-hint" />
          <span className="hint" id="a-code-hint">
            The 6 digits shown by your authenticator app.
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
        {busy ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
