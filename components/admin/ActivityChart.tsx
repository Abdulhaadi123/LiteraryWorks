import type { Summary } from "@/lib/admin/inquiries";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (day: number) => {
  const d = new Date(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
/** A round top for the axis, so the ticks read 0, half, top. */
const niceTop = (max: number) => [4, 8, 10, 20, 40, 50, 100, 200, 400, 500, 1000].find((n) => n >= max) ?? Math.ceil(max / 1000) * 1000;

/**
 * Inquiries per day: one series, so one colour and no legend; thin columns (24px at most) with a rounded cap and a
 * flat base, hairline gridlines. Each column answers a hover or keyboard focus with its figure, and "View as a
 * table" holds every number, so nothing depends on the pointer. (Days are UTC days.)
 */
export function ActivityChart({ daily }: { daily: Summary["daily"] }) {
  const top = niceTop(Math.max(...daily.map((d) => d.count), 0));
  const total = daily.reduce((a, d) => a + d.count, 0);
  return (
    <div>
      <p className="sr-only">
        {total} {total === 1 ? "inquiry" : "inquiries"} in the last {daily.length} days. A table of each day follows.
      </p>
      <div className="adm-chart" style={{ ["--n" as string]: daily.length }}>
        <div className="adm-chart-grid" aria-hidden="true">
          {[0, 0.5, 1].map((f) => (
            <span key={f} style={{ bottom: `${f * 100}%` }}>
              <i className="num">{Math.round(top * f)}</i>
            </span>
          ))}
        </div>
        <ul className="adm-bars">
          {daily.map((d) => (
            <li key={d.day} className={`adm-bar${d.count === 0 ? " is-zero" : ""}`} tabIndex={0} aria-label={`${label(d.day)}: ${d.count} ${d.count === 1 ? "inquiry" : "inquiries"}`}>
              <i style={{ height: `${(d.count / top) * 100}%` }} />
              <span className="tip" aria-hidden="true">
                <b className="num">{d.count}</b>
                {label(d.day)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="adm-xaxis" aria-hidden="true" style={{ ["--n" as string]: daily.length }}>
        {daily.map((d, k) => (
          <span key={d.day}>{k === 0 || new Date(d.day).getUTCDate() === 1 ? label(d.day) : new Date(d.day).getUTCDate()}</span>
        ))}
      </div>
      <details className="adm-details">
        <summary>View as a table</summary>
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Day (UTC)</th>
              <th scope="col">Inquiries</th>
            </tr>
          </thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}>
                <td>{label(d.day)}</td>
                <td className="num">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
