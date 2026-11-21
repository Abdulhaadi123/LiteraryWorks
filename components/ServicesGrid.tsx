import Link from "next/link";
import { serviceStillAlt } from "@/lib/scenes";
import { services } from "@/lib/services";
import { SectionHead } from "./ui";

/**
 * The nine services on the home page, as a plain grid: each card shows a still of the service's own 3D object (rendered
 * from the live scene by scripts/make-posters.mjs), its name, one line and a link. Nothing is pinned and nothing waits
 * for a script: the page scrolls at its own speed, and the pictures load as they come near.
 */
export function ServicesGrid({ id = "services" }: { id?: string }) {
  return (
    <section className="section on-mist" id={id}>
      <div className="wrap">
        <div className="svc-head">
          <SectionHead
            kicker="What we build"
            title={
              <>
                AI, software and cloud, <em>built as one system.</em>
              </>
            }
            lead="Nine services, one method: map the work, design the system, build it into the tools you already use, then measure it."
          />
          <Link className="btn btn-line" href="/services">
            All services
          </Link>
        </div>
        <ul className="svc-grid" data-stagger>
          {services.map((s) => (
            <li key={s.slug}>
              <Link className="svc-card" href={`/services/${s.slug}`}>
                <div className="svc-pic">
                  <img src={`/scene/services/${s.slug}.webp`} width={720} height={540} loading="lazy" decoding="async" alt={serviceStillAlt(s.slug)} />
                </div>
                <div className="svc-body">
                  <span className="svc-tags">
                    <span className="svc-group">{s.group}</span>
                    {s.isNew ? <span className="pill pill-new">New</span> : null}
                  </span>
                  <h3 className="svc-name">{s.name}</h3>
                  <p className="svc-short">{s.short}</p>
                  <span className="svc-more" aria-hidden="true">
                    Explore
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
