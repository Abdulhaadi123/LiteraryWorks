import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { SetupForm } from "@/components/admin/SetupForm";
import { adminStatus } from "@/lib/admin/auth";
import { StoreError } from "@/lib/admin/kv";
import { currentSession } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sign in" };
// what is set up is read when the page is asked for, never frozen at build time
export const dynamic = "force-dynamic";

const warn = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
  </svg>
);

export default async function LoginPage() {
  const status = await adminStatus();
  if (status.ready) {
    try {
      if (await currentSession()) redirect("/admin");
    } catch (error) {
      if (!(error instanceof StoreError)) throw error;
    }
  }
  const lead = status.ready
    ? "Sign in to read the messages sent through the website."
    : status.setupNeeded
      ? "Welcome. Make the admin account for the site's inbox: you do this once."
      : status.unavailable
        ? "The data store is not answering just now."
        : "The admin area is not set up yet.";
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <Logo />
        <h1>{status.setupNeeded ? "Make the admin account" : "Admin sign-in"}</h1>
        <p className="lead">{lead}</p>
        {status.ready ? (
          <LoginForm twoFactor={status.twoFactor} />
        ) : status.setupNeeded ? (
          <>
            <SetupForm needsKey={status.needsSetupKey} />
            <p className="hint" style={{ marginTop: "0.9rem" }}>
              Until this is done, anyone who opens this page could make the account, so do it right away. Afterwards this form is closed for good.
            </p>
          </>
        ) : status.unavailable ? (
          <div className="adm-note" role="alert">
            {warn}
            <div>Reload in a moment. If it stays like this, check the store&apos;s settings on the host.</div>
          </div>
        ) : (
          <div className="adm-note">
            {warn}
            <div>
              <b>Still to set:</b> {status.missing.join(", ")}.
              <br />
              Connect a store (the README explains how), then reload this page to make the admin account.
            </div>
          </div>
        )}
        <p className="adm-login-foot">Authorised use only. Every sign-in and failed attempt is recorded.</p>
      </div>
    </div>
  );
}
