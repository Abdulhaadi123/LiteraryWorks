import type { Metadata } from "next";
import Link from "next/link";
import { InquiryTable } from "@/components/admin/InquiryTable";
import { getInbox } from "@/lib/admin/data";
import { plural } from "@/lib/admin/format";
import { countByStatus, filterInquiries, statuses, statusLabel, type Status, type StoredInquiry } from "@/lib/admin/inquiries";
import { requireAdmin } from "@/lib/admin/session";
import { topics } from "@/lib/topics";

export const metadata: Metadata = { title: "Inquiries" };

const PAGE = 15;
type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function InquiriesPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin("/admin/inquiries");
  const sp = await searchParams;
  const status: Status | "all" = (statuses as readonly string[]).includes(one(sp.status)) ? (one(sp.status) as Status) : "all";
  const topic = topics.some((t) => t.value === one(sp.topic)) ? one(sp.topic) : "";
  const q = one(sp.q).slice(0, 120);

  let all: StoredInquiry[] = [];
  let unreadable = false;
  try {
    all = await getInbox();
  } catch {
    unreadable = true;
  }
  const counts = countByStatus(all);
  const rows = filterInquiries(all, { status, topic, q });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(one(sp.page))) || 1));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);

  const href = (over: { status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const st = over.status ?? status;
    if (st && st !== "all") p.set("status", st);
    if (topic) p.set("topic", topic);
    if (q) p.set("q", q);
    if (over.page && over.page > 1) p.set("page", String(over.page));
    const s = p.toString();
    return `/admin/inquiries${s ? `?${s}` : ""}`;
  };
  const filtered = !!(topic || q);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Inquiries</h1>
          <p>{plural(counts.all, "message")} in the inbox.</p>
        </div>
        <div className="adm-actions">
          <a className="btn" href="/api/admin/export" download>
            Export CSV
          </a>
        </div>
      </div>

      <nav className="adm-tabs" aria-label="Status">
        {(["all", ...statuses] as const).map((s) => (
          <Link key={s} href={href({ status: s })} aria-current={status === s ? "page" : undefined} prefetch={false}>
            {s === "all" ? "All" : statusLabel[s]}
            <span>{counts[s]}</span>
          </Link>
        ))}
      </nav>

      <form className="adm-filter" method="get" action="/admin/inquiries" role="search">
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <label className="sr-only" htmlFor="f-q">
          Search messages
        </label>
        <input id="f-q" className="input" type="search" name="q" defaultValue={q} placeholder="Search name, e-mail, company or message" maxLength={120} />
        <label className="sr-only" htmlFor="f-topic">
          Topic
        </label>
        <select id="f-topic" className="select" name="topic" defaultValue={topic}>
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.key} value={t.value}>
              {t.value}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-navy">
          Search
        </button>
        {filtered ? (
          <Link className="btn" href={href({}).split("?")[0] + (status !== "all" ? `?status=${status}` : "")}>
            Clear
          </Link>
        ) : null}
      </form>

      <section className="adm-panel" aria-label="Messages">
        {unreadable ? (
          <div className="adm-empty" role="alert">
            <b>The inbox could not be read</b>
            The data store did not answer. Reload in a moment.
          </div>
        ) : shown.length ? (
          <>
            <InquiryTable rows={shown} />
            <div className="adm-pager">
              <span>
                {(page - 1) * PAGE + 1}–{(page - 1) * PAGE + shown.length} of {rows.length}
              </span>
              <div>
                <Link className="btn btn-sm" href={href({ page: page - 1 })} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} prefetch={false}>
                  Previous
                </Link>
                <Link className="btn btn-sm" href={href({ page: page + 1 })} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} prefetch={false}>
                  Next
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="adm-empty">
            <b>{filtered || status !== "all" ? "Nothing matches" : "No messages yet"}</b>
            {filtered || status !== "all" ? "Try another status, topic or search." : "Anything sent through the contact form or the assistant appears here."}
          </div>
        )}
      </section>
    </>
  );
}
