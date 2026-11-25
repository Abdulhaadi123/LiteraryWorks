import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminStatus } from "@/lib/admin/auth";
import { StoreError } from "@/lib/admin/kv";
import { currentSession } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sign in" };
// what is set up is read when the page is asked for, never frozen at build time
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const status = adminStatus();
  if (status.ready) {
    try {
      if (await currentSession()) redirect("/admin");
    } catch (error) {
      if (!(error instanceof StoreError)) throw error;
    }
  }
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <Logo />
        <h1>Admin sign-in</h1>
        <p className="lead">{status.ready ? "Sign in to read the messages sent through the website." : "The admin area is not set up yet."}</p>
        {status.ready ? (
          <LoginForm twoFactor={status.twoFactor} />
        ) : (
          <div className="adm-note">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
            </svg>
            <div>
              <b>Still to set:</b> {status.missing.join(", ")}.
              <br />
              Run <code>npm run admin:setup</code> and add its output to the host&apos;s environment settings (the README explains each step).
            </div>
          </div>
        )}
        <p className="adm-login-foot">Authorised use only. Every sign-in and failed attempt is recorded.</p>
      </div>
    </div>
  );
}
