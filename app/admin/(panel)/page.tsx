import type { Metadata } from "next";
import Link from "next/link";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { InquiryTable } from "@/components/admin/InquiryTable";
import { getInbox } from "@/lib/admin/data";
import { plural } from "@/lib/admin/format";
import { summarize, type StoredInquiry } from "@/lib/admin/inquiries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Overview" };

const warn = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
  </svg>
);

export default async function OverviewPage() {
  await requireAdmin("/admin");
  let inbox: StoredInquiry[] = [];
  let unreadable = false;
  try {
    inbox = await getInbox();
  } catch {
    unreadable = true;
  }
  const s = summarize(inbox);
  const change = s.last7 - s.prev7;
  // the six asked about most, the rest together, so the list stays short
  const shownTopics = s.topics.slice(0, 6);
  const rest = s.topics.slice(6);
  if (rest.length) shownTopics.push({ name: `Other (${plural(rest.length, "topic")})`, count: rest.reduce((a, t) => a + t.count, 0) });
  const topMax = Math.max(...shownTopics.map((t) => t.count), 1);
  const noticeEmail = !process.env.SENDGRID_API_KEY || !process.env.CONTACT_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Overview</h1>
          <p>What people have sent through the website.</p>
        </div>
        <div className="adm-actions">
          <Link className="btn btn-navy" href="/admin/inquiries?status=new">
            {s.fresh > 0 ? `Read ${s.fresh} new` : "Open the inbox"}
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
        {unreadable ? (
          <p className="adm-note" role="alert">
            {warn}
            <span>
              <b>The inbox could not be read.</b> The data store did not answer. Reload in a moment; if it stays, check the store&apos;s settings.
            </span>
          </p>
        ) : null}
        {s.unnotified > 0 && !noticeEmail ? (
          <p className="adm-note">
            {warn}
            <span>
              <b>{plural(s.unnotified, "message")} reached the inbox but not the team&apos;s e-mail.</b> They are all here; check the e-mail settings so nobody has to look.
            </span>
          </p>
        ) : null}
        {noticeEmail ? (
          <p className="adm-note">
            {warn}
            <span>
              <b>The e-mail notice is not set up.</b> New messages are saved here, but nobody is told by e-mail, so check this inbox often (or add the SendGrid settings).
            </span>
          </p>
        ) : null}
      </div>

      <dl className="adm-figures">
        <div className={`adm-figure${s.fresh > 0 ? " is-attention" : ""}`}>
          <dt>New, unread</dt>
          <dd className="num">{s.fresh}</dd>
          <small>{s.fresh > 0 ? "Waiting for a first look" : "Nothing waiting"}</small>
        </div>
        <div className="adm-figure">
          <dt>Last 7 days</dt>
          <dd className="num">{s.last7}</dd>
          <small>
            {change === 0 ? (
              "Same as the 7 days before"
            ) : (
              <span className={`adm-delta ${change > 0 ? "up" : "down"}`}>
                {change > 0 ? "▲" : "▼"} {Math.abs(change)} {change > 0 ? "more" : "fewer"} than before
              </span>
            )}
          </small>
        </div>
        <div className="adm-figure">
          <dt>Last 30 days</dt>
          <dd className="num">{s.last30}</dd>
          <small>{plural(s.sources.assistant, "from the assistant", "from the assistant")}</small>
        </div>
        <div className="adm-figure">
          <dt>All time</dt>
          <dd className="num">{s.total}</dd>
          <small>{plural(s.sources.form, "from the contact form", "from the contact form")}</small>
        </div>
      </dl>

      <div className="adm-grid two">
        <section className="adm-panel" aria-labelledby="h-activity">
          <header>
            <h2 id="h-activity">Inquiries per day</h2>
            <p>Last 14 days</p>
          </header>
          <div className="adm-panel-body">
            <ActivityChart daily={s.daily} />
          </div>
        </section>
        <section className="adm-panel" aria-labelledby="h-topics">
          <header>
            <h2 id="h-topics">What people ask about</h2>
            <p>All time</p>
          </header>
          <div className="adm-panel-body">
            {shownTopics.length ? (
              <ul className="adm-rank">
                {shownTopics.map((t) => (
                  <li key={t.name}>
                    <div className="adm-rank-top">
                      <span>{t.name}</span>
                      <span className="num">{t.count}</span>
                    </div>
                    <div className="adm-track" aria-hidden="true">
                      <i style={{ width: `${(t.count / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint" style={{ marginTop: "1rem" }}>
                Topics appear here once the first message arrives.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="adm-panel" style={{ marginTop: "1rem" }} aria-labelledby="h-recent">
        <header>
          <h2 id="h-recent">Latest messages</h2>
          <p>
            <Link href="/admin/inquiries" style={{ color: "var(--navy)", fontWeight: 600 }}>
              See all
            </Link>
          </p>
        </header>
        <div style={{ marginTop: "0.6rem" }}>
          {inbox.length ? (
            <InquiryTable rows={inbox.slice(0, 5)} />
          ) : (
            <div className="adm-empty">
              <b>No messages yet</b>
              Anything sent through the contact form or the assistant appears here.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
