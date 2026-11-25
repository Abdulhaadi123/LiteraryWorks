import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { adminStatus } from "@/lib/admin/auth";
import { getInbox } from "@/lib/admin/data";
import { currentSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** The signed-in shell. Without a valid session nothing below is rendered: the visitor is sent to the sign-in page. */
export default async function PanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  if (!adminStatus().ready) redirect("/admin/login");
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  let fresh = 0;
  try {
    fresh = (await getInbox()).filter((i) => i.status === "new").length;
  } catch {
    // the pages say when the store cannot be read; the badge simply stays off
  }
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Logo tone="light" />
        <AdminNav fresh={fresh} />
        <div className="adm-who">
          <div>
            <span>Signed in as</span>
            <b>{session.sub}</b>
          </div>
          <SignOutButton>Sign out</SignOutButton>
        </div>
      </aside>
      <div className="adm-main">
        <main className="adm-page" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
