import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { hdCovers, versioned } from "@/lib/assets";
import { cases, faqs as allFaqs, ladder, type CaseStudy } from "@/lib/content";
import { services, type ServiceIndexItem } from "@/lib/services";
import { Icon, serviceIcon, type IconName } from "./icons";

export const d = (i: number) => ({ "--i": i }) as CSSProperties;

/** A section's opening: a small label, the headline and one line of context. */
export function SectionHead({ kicker, title, lead, center }: { kicker: string; title: ReactNode; lead?: string; center?: boolean }) {
  return (
    <header className={`section-head${center ? " is-center" : ""}`}>
      <p className="kicker" data-reveal>
        {kicker}
      </p>
      <h2 className="h-lg" data-split="words">
        {title}
      </h2>
      {lead ? (
        <p className="lead" data-reveal>
          {lead}
        </p>
      ) : null}
    </header>
  );
}

export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="checks">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** The top of every inner page that has no scene of its own. */
export function PageHero({
  kicker,
  title,
  lead,
  children,
  as: Heading = "h1",
}: {
  kicker: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
  /** "h2" where the page has its own (visually hidden) h1. */
  as?: "h1" | "h2";
}) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <p className="kicker rise" style={d(0)}>
          {kicker}
        </p>
        <Heading className="h-xl rise" style={d(1)}>
          {title}
        </Heading>
        {lead ? (
          <p className="lead rise" style={d(2)}>
            {lead}
          </p>
        ) : null}
        {children ? (
          <div className="cta-row rise" style={d(3)}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Short statements with an icon each. */
export function Tiles({ items }: { items: { icon: IconName; title: string; text: string }[] }) {
  return (
    <ul className="tiles" data-stagger>
      {items.map((t) => (
        <li key={t.title} className="tile">
          <span className="card-icon">
            <Icon name={t.icon} />
          </span>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** The services as an index: one large ruled row each (number, name, one line, kind), filling navy on hover. */
export function ServiceCards({ items = services }: { items?: ServiceIndexItem[] }) {
  return (
    <ol className="svc-index" data-stagger>
      {items.map((s, i) => (
        <li key={s.slug}>
          <Link href={`/services/${s.slug}`} className="svc-row">
            <span className="svc-row-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="svc-row-name">
              <span className="svc-row-icon">
                <Icon name={serviceIcon[s.slug] ?? "sparkles"} />
              </span>
              {s.name}
              {s.isNew ? <span className="pill pill-new">New</span> : null}
            </span>
            <span className="svc-row-short">{s.short}</span>
            <span className="tag svc-row-group">{s.kind}</span>
            <span className="svc-row-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function Ladder() {
  return (
    <ul className="ladder" data-stagger>
      {ladder.map((o) => (
        <li key={o.name} className={o.featured ? "is-featured" : undefined}>
          <p className="ladder-tag">{o.tag}</p>
          <h3 className="h-md">{o.name}</h3>
          <p className="ladder-price">
            <b>{o.price}</b>
            <span>{o.unit}</span>
          </p>
          {o.note ? <p className="ladder-note">{o.note}</p> : null}
          <Checks items={o.points} />
          <Link href={o.cta.href} className={`btn ${o.featured ? "btn-white" : "btn-navy"}`}>
            {o.cta.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The cover picture of a case study: a screenshot of the system itself (public/cases/), in two sizes. */
export function CaseImage({ slug, sizes, priority }: { slug: string; sizes: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={versioned(`/cases/${slug}.webp`)}
      srcSet={`${versioned(`/cases/${slug}-640.webp`)} 640w, ${versioned(`/cases/${slug}.webp`)} ${hdCovers.has(slug) ? 1920 : 1280}w`}
      sizes={sizes}
      width={1280}
      height={720}
      alt=""
      loading={priority ? undefined : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

/**
 * The case studies as cards with a large picture of the system, the tags, the title, the three results and a link
 * (the way FAYD shows them). "rows" puts the picture and the words side by side, alternating; "grid" stacks them.
 */
export function CaseCards({ items = cases, layout = "grid" }: { items?: CaseStudy[]; layout?: "grid" | "rows" }) {
  if (layout === "rows") {
    return (
      <ul className="case-rows" data-stagger>
        {items.map((c) => (
          <li key={c.slug} className="case-row">
            <Link href={`/work/${c.slug}`} className="case-row-img" tabIndex={-1} aria-hidden="true">
              <CaseImage slug={c.slug} sizes="(min-width: 64rem) 560px, 92vw" />
            </Link>
            <div className="case-row-text">
              <p className="kicker">{c.tags.slice(0, 3).join(" · ")}</p>
              <h3 className="h-md">
                <Link href={`/work/${c.slug}`}>{c.title}</Link>
              </h3>
              <p className="case-lead">{c.summary}</p>
              <dl className="metrics">
                {c.results.slice(0, 3).map((r) => (
                  <div key={r.label}>
                    <dt>{r.value}</dt>
                    <dd>{r.label}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/work/${c.slug}`} className="card-link">
                <span>View case study</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="cards cards-2" data-stagger>
      {items.map((c) => (
        <li key={c.slug}>
          <Link href={`/work/${c.slug}`} className="card case">
            <span className="case-img">
              <CaseImage slug={c.slug} sizes="(min-width: 64rem) 560px, 92vw" />
            </span>
            <span className="case-body">
              <span className="card-top">
                {c.tags.slice(0, 2).map((t) => (
                  <span className="pill" key={t}>
                    {t}
                  </span>
                ))}
              </span>
              <h3 className="h-md">{c.title}</h3>
              <p>{c.summary}</p>
              <dl className="metrics">
                {c.results.slice(0, 3).map((r) => (
                  <div key={r.label}>
                    <dt>{r.value}</dt>
                    <dd>{r.label}</dd>
                  </div>
                ))}
              </dl>
              <span className="card-link">
                <span>View case study</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The screenshot (public/shots/) of each project in the wider portfolio. */
const projectShot: Record<string, string> = {
  "Grace AI": "grace",
  SIQETRA: "siqetra",
  "Vyral AI": "vyarl",
  "Dr Scribe": "drscribe",
  "Aztech AI": "aztech",
  "Alltrials AI": "alltrials",
  Vendibly: "vendibly",
  "Card Grading AI": "cardgrading",
  "Civil Security": "civil",
  "AI Language Tutor": "tutor",
  Monetiza: "monetiza",
  "OTA-GPT": "ota",
};

/** The wider portfolio: a picture of each project we have built, with its name and one line. */
export function Portfolio({ items }: { items: { name: string; text: string; href?: string }[] }) {
  return (
    <ul className="portfolio" data-stagger>
      {items.map((m) => (
        <li key={m.name}>
          <figure>
            {projectShot[m.name] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={versioned(`/shots/${projectShot[m.name]}.webp`)} width={1024} height={576} alt="" loading="lazy" decoding="async" />
            ) : null}
            <figcaption>
              <h3>{m.href ? <Link href={m.href}>{m.name}</Link> : m.name}</h3>
              <p>{m.text}</p>
              {m.href ? (
                <span className="portfolio-more" aria-hidden="true">
                  View project
                </span>
              ) : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export function Faq({ items = allFaqs }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
