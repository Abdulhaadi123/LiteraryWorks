import { clientLogos } from "@/lib/client-logos";
import { versioned } from "@/lib/assets";

/**
 * A band of the logos of businesses we have built for, drifting sideways (it stops under the pointer, and under
 * reduced motion it is a wrapped row that stands still). The logos keep their colours (one grows a little when pointed at). The names are in the
 * page once (the second copy of the row, which makes the loop seamless, is hidden from assistive technology).
 */
export function ClientLogos() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined}>
      {clientLogos.map((l) => (
        <li key={l.file}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={versioned(`/clients/logos/${l.file}`)} width={l.w} height={l.h} alt={hidden ? "" : l.name} loading="lazy" decoding="async" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="logo-wall" role="group" aria-label="Some of the businesses we have built for">
      <div className="logo-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
