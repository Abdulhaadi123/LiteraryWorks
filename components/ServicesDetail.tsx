import Link from "next/link";
import { serviceStillAlt, STILL_VERSION } from "@/lib/scenes";
import { servicePages } from "@/lib/service-pages";
import { services } from "@/lib/services";
import { SectionHead } from "./ui";

/**
 * Every service in plain words, on the services page: a picture of the service's own object, what it is, what we build, where it
 * fits, and the two ways on (its page, or a conversation about it). The words are the services' own (lib/service-pages.ts), so this
 * page and each service's page always agree.
 */
export function ServicesDetail() {
  return (
    <section className="section on-white svc-detail" id="all-services">
      <div className="wrap">
        <SectionHead
          kicker="What we offer"
          title={
            <>
              Every service, <em>in plain words</em>
            </>
          }
          lead="What each one is, what we build, and where it fits. Pick the one that matches your work, or start with the free audit and we will tell you which."
        />
        <ol className="svc-detail-list">
          {services.map((s, i) => {
            const p = servicePages[s.slug];
            if (!p) return null;
            return (
              <li key={s.slug} className="svc-detail-item" id={s.slug}>
                <Link className="svc-detail-pic" href={`/services/${s.slug}`} tabIndex={-1} aria-hidden="true">
                  <img src={`/scene/services/${s.slug}.webp?v=${STILL_VERSION}`} width={720} height={540} loading="lazy" decoding="async" alt={serviceStillAlt(s.slug)} />
                </Link>
                <div className="svc-detail-body">
                  <p className="svc-detail-meta">
                    <span className="svc-detail-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="tag svc-group">{s.kind}</span>
                    {s.isNew ? <span className="pill pill-new">New</span> : null}
                  </p>
                  <h3 className="svc-detail-name">{s.name}</h3>
                  <p className="svc-detail-lead">{p.summary}</p>
                  <div className="svc-detail-cols">
                    <div>
                      <h4>What we build</h4>
                      <ul className="plain">
                        {p.features.slice(0, 4).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Where it fits</h4>
                      <ul className="plain">
                        {p.useCases.slice(0, 4).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="cta-row">
                    <Link className="btn btn-navy" href={`/services/${s.slug}`}>
                      Explore {s.name}
                    </Link>
                    <Link className="btn btn-line" href={`/contact?topic=${s.slug}`}>
                      Talk to us about this
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
