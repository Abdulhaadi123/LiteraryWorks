import type { Metadata } from "next";
import { LocalTime } from "@/components/admin/LocalTime";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { adminStatus, describeAgent, recentAudit, sessionHours, type AuditEvent, type AuditKind } from "@/lib/admin/auth";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Security" };

const kinds: Record<AuditKind, { text: string; tone: "ok" | "bad" | "" }> = {
  signin: { text: "Signed in", tone: "ok" },
  failed: { text: "Failed attempt", tone: "bad" },
  blocked: { text: "Blocked (too many attempts)", tone: "bad" },
  signout: { text: "Signed out", tone: "" },
  signout_all: { text: "Signed out everywhere", tone: "" },
  setup: { text: "Admin account made", tone: "ok" },
};

export default async function SecurityPage() {
  const session = await requireAdmin("/admin/security");
  const status = await adminStatus();
  let events: AuditEvent[] = [];
  let unreadable = false;
  try {
    events = await recentAudit(40);
  } catch {
    unreadable = true;
  }
  const checks = [
    { on: true, title: "Password", text: "Kept only as a scrypt hash (memory-hard, with its own random salt). The password itself is never stored, and a wrong e-mail address costs the same time as a wrong password." },
    {
      on: status.twoFactor,
      title: "Two-step sign-in",
      text: status.twoFactor ? "A 6-digit code from your authenticator app is needed with the password. Each code works once." : "Off: the password alone signs in, so keep it long. To switch it on, add ADMIN_TOTP_SECRET to the host's settings (npm run admin:setup makes a key) and type the key into an authenticator app.",
    },
    { on: true, title: "Attempt limits", text: "8 attempts in 15 minutes from one address, and 30 an hour on the account; the count lives in the store, so it holds on every server." },
    { on: true, title: "Session cookie", text: `Signed, HttpOnly, SameSite=Strict, and Secure on https. A session ends after ${sessionHours()} hours, or earlier when you sign out.` },
    {
      on: status.storage === "mongo" || status.storage === "redis",
      title: "Data store",
      text: status.storage === "mongo" ? "MongoDB: messages are in the inquiries collection, the account, counters and log in kv." : status.storage === "redis" ? "Redis, over HTTPS." : "A file on this server (.data/store.json). Fine for trying things out; a host with no disk (Vercel) needs MongoDB or Redis, or messages and the sign-in limits are lost.",
    },
  ];

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Security</h1>
          <p>How the admin area is protected, and who has been in.</p>
        </div>
      </div>

      <div className="adm-grid two" style={{ marginTop: 0 }}>
        <section className="adm-panel" aria-labelledby="h-prot">
          <header>
            <h2 id="h-prot">Protection</h2>
          </header>
          <div className="adm-panel-body">
            <ul className="adm-checks">
              {checks.map((c) => (
                <li key={c.title}>
                  <span className={`state ${c.on ? "on" : "off"}`}>{c.on ? "On" : "Off"}</span>
                  <div>
                    <b>{c.title}</b>
                    <span className="d">{c.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="adm-panel" aria-labelledby="h-sess">
          <header>
            <h2 id="h-sess">This session</h2>
          </header>
          <div className="adm-panel-body">
            <dl className="adm-dl">
              <div>
                <dt>Signed in as</dt>
                <dd>{session.sub}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>
                  <LocalTime ts={session.iat} />
                </dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>
                  <LocalTime ts={session.exp} />
                </dd>
              </div>
            </dl>
            <div className="adm-row" style={{ marginTop: "1rem" }}>
              <SignOutButton>Sign out</SignOutButton>
              <SignOutButton everywhere className="btn btn-sm btn-danger">
                Sign out everywhere
              </SignOutButton>
            </div>
            <p className="hint" style={{ marginTop: "0.8rem" }}>
              &ldquo;Everywhere&rdquo; ends every session on every device, this one included. Use it if a device is lost, or after changing the password.
            </p>
          </div>
        </section>
      </div>

      <section className="adm-panel" style={{ marginTop: "1rem" }} aria-labelledby="h-log">
        <header>
          <h2 id="h-log">Recent sign-ins</h2>
          <p>The last 40 events</p>
        </header>
        <div style={{ marginTop: "0.6rem" }}>
          {unreadable ? (
            <div className="adm-empty" role="alert">
              <b>The log could not be read</b>
              The data store did not answer.
            </div>
          ) : events.length ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">What</th>
                  <th scope="col">Address</th>
                  <th scope="col">Device</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, k) => (
                  <tr key={`${e.t}-${k}`}>
                    <td className="when">
                      <LocalTime ts={e.t} />
                    </td>
                    <td>
                      <span className={`kind ${kinds[e.kind]?.tone ?? ""}`}>{kinds[e.kind]?.text ?? e.kind}</span>
                      {e.detail ? <div className="hint">{e.detail}</div> : null}
                    </td>
                    <td className="num">{e.ip}</td>
                    <td>{describeAgent(e.ua)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="adm-empty">
              <b>Nothing recorded yet</b>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
