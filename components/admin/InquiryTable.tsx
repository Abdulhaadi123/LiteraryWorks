import Link from "next/link";
import type { StoredInquiry } from "@/lib/admin/inquiries";
import { statusLabel } from "@/lib/admin/inquiries";
import { LocalTime } from "./LocalTime";

export function StatusBadge({ status }: { status: StoredInquiry["status"] }) {
  return <span className={`adm-status ${status}`}>{statusLabel[status]}</span>;
}

/** The inquiries as a table (a list of blocks on a phone): who, what about, the first lines of the message, when. */
export function InquiryTable({ rows }: { rows: StoredInquiry[] }) {
  return (
    <table className="adm-table">
      <thead>
        <tr>
          <th scope="col">Status</th>
          <th scope="col">From</th>
          <th scope="col">Topic</th>
          <th scope="col">Message</th>
          <th scope="col">Received</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((i) => (
          <tr key={i.id} className={i.status === "new" ? "is-new" : undefined}>
            <td>
              <StatusBadge status={i.status} />
            </td>
            <td>
              <div className="who">
                <Link href={`/admin/inquiries/${i.id}`} prefetch={false}>
                  {i.name}
                </Link>
                <span>{i.company ? `${i.company} · ${i.email}` : i.email}</span>
              </div>
            </td>
            <td className="topic">{i.interest}</td>
            <td className="snippet-cell">
              <div className="snippet">{i.message}</div>
            </td>
            <td className="when">
              <LocalTime ts={i.createdAt} variant="ago" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
