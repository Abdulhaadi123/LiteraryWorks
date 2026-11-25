import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryPanel } from "@/components/admin/InquiryPanel";
import { LocalTime } from "@/components/admin/LocalTime";
import { StatusBadge } from "@/components/admin/InquiryTable";
import { getInquiry, NOTE_MAX } from "@/lib/admin/inquiries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Message" };

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/inquiries/${id}`);
  const i = await getInquiry(id);
  if (!i) notFound();

  const first = i.name.split(/\s+/)[0] || i.name;
  const reply = `mailto:${encodeURIComponent(i.email).replace(/%40/g, "@")}?subject=${encodeURIComponent(`Re: your message to Literary Worx (${i.interest})`)}&body=${encodeURIComponent(`Hi ${first},\n\n`)}`;

  return (
    <>
      <Link className="adm-back" href="/admin/inquiries" prefetch={false}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M15.4 5.4L14 4l-8 8 8 8 1.4-1.4L8.8 12z" />
        </svg>
        All inquiries
      </Link>
      <div className="adm-head">
        <div>
          <h1>{i.name}</h1>
          <p>
            {i.interest} · <LocalTime ts={i.createdAt} />
          </p>
        </div>
        <div className="adm-actions">
          <StatusBadge status={i.status} />
          <a className="btn btn-primary" href={reply}>
            Reply by e-mail
          </a>
        </div>
      </div>

      <div className="adm-detail">
        <div style={{ display: "grid", gap: "1rem" }}>
          <section className="adm-panel" aria-labelledby="h-msg">
            <header>
              <h2 id="h-msg">Message</h2>
              <p>{i.source === "assistant" ? "Sent from the website assistant" : "Sent from the contact form"}</p>
            </header>
            <div className="adm-panel-body">
              <p className="adm-message">{i.message}</p>
            </div>
          </section>

          {i.conversation?.length ? (
            <section className="adm-panel" aria-labelledby="h-chat">
              <header>
                <h2 id="h-chat">The conversation before it</h2>
                <p>With the website assistant</p>
              </header>
              <div className="adm-panel-body">
                <div className="adm-chat">
                  {i.conversation.map((t, k) => (
                    <p key={k} className={t.role}>
                      <span className="sr-only">{t.role === "user" ? "Visitor: " : "Assistant: "}</span>
                      {t.content}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="adm-side-col">
          <section className="adm-panel" aria-labelledby="h-from">
            <header>
              <h2 id="h-from">Sender</h2>
            </header>
            <div className="adm-panel-body">
              <dl className="adm-dl">
                <div>
                  <dt>E-mail</dt>
                  <dd>
                    <a href={`mailto:${i.email}`}>{i.email}</a>
                  </dd>
                </div>
                {i.company ? (
                  <div>
                    <dt>Company</dt>
                    <dd>{i.company}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Topic</dt>
                  <dd>{i.interest}</dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>
                    <LocalTime ts={i.createdAt} />
                  </dd>
                </div>
                {i.country ? (
                  <div>
                    <dt>Country</dt>
                    <dd>{i.country}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Team e-mail</dt>
                  <dd>{i.notified === null ? "Not set up" : i.notified ? "Sent" : "Did not go out"}</dd>
                </div>
              </dl>
            </div>
          </section>
          <InquiryPanel id={i.id} status={i.status} note={i.note} noteMax={NOTE_MAX} />
        </div>
      </div>
    </>
  );
}
