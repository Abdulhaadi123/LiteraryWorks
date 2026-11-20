import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cases, faqs as allFaqs, guarantee, ladder, type CaseStudy, type Quote } from "@/lib/content";
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

/** A strip of the sectors the work is done in. */
export function Strip({ title, items }: { title: string; items: { name: string; icon: IconName }[] }) {
  return (
    <section className="strip" aria-label={title}>
      <div className="wrap">
        <p>{title}</p>
        <ul>
          {items.map((i) => (
            <li key={i.name}>
              <Icon name={i.icon} />
              {i.name}
            </li>
          ))}
        </ul>
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

/** The services as cards: an icon, the name, one line and the group. */
export function ServiceCards({ items = services }: { items?: ServiceIndexItem[] }) {
  return (
    <ul className="cards" data-stagger>
      {items.map((s) => (
        <li key={s.slug}>
          <Link href={`/services/${s.slug}`} className="card">
            <span className="card-top">
              <span className="card-icon">
                <Icon name={serviceIcon[s.slug] ?? "sparkles"} />
              </span>
              <span className="pill">{s.group}</span>
              {s.isNew ? <span className="pill pill-new">New</span> : null}
            </span>
            <h3 className="h-md">{s.name}</h3>
            <p>{s.short}</p>
            <span className="card-link">
              <span>Learn more</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Ladder() {
  return (
    <>
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
      <p className="guarantee" data-reveal>
        <span className="pill pill-new">Guarantee</span>
        {guarantee}
      </p>
    </>
  );
}

/** Four outlines for the head of a case card: bars, a conversation, a sound, a network. */
function CaseGlyph({ i }: { i: number }) {
  const w = "rgba(255,255,255,";
  switch (i % 4) {
    case 0:
      return (
        <svg viewBox="0 0 176 120" fill="none" aria-hidden="true">
          <rect x="14" y="62" width="26" height="58" rx="7" fill={`${w}0.45)`} />
          <rect x="52" y="38" width="26" height="82" rx="7" fill={`${w}0.65)`} />
          <rect x="90" y="52" width="26" height="68" rx="7" fill={`${w}0.5)`} />
          <rect x="128" y="14" width="26" height="106" rx="7" fill={`${w}0.9)`} />
          <path d="M20 40l38-18 38 12 52-26" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="148" cy="8" r="6" fill="#fff" />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 176 120" fill="none" aria-hidden="true">
          <rect x="10" y="22" width="104" height="38" rx="14" fill={`${w}0.9)`} />
          <rect x="24" y="36" width="64" height="7" rx="3.5" fill="#7dadf6" />
          <rect x="60" y="70" width="106" height="38" rx="14" fill={`${w}0.5)`} />
          <rect x="74" y="84" width="70" height="7" rx="3.5" fill="#fff" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 176 120" fill="none" aria-hidden="true">
          {Array.from({ length: 18 }, (_, k) => {
            const h = 16 + 70 * Math.abs(Math.sin(k * 0.62)) * (0.5 + 0.5 * Math.abs(Math.sin(k * 0.23 + 0.7)));
            return <rect key={k} x={8 + k * 9.4} y={110 - h} width="5.6" height={h} rx="2.8" fill={`${w}${0.4 + (k % 4) * 0.16})`} />;
          })}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 176 120" fill="none" aria-hidden="true">
          <path d="M30 96l40-50 36 28 44-56M70 46l-8-24M106 74l30 24" stroke={`${w}0.7)`} strokeWidth="2.5" strokeLinecap="round" />
          {[
            [30, 96],
            [70, 46],
            [106, 74],
            [150, 18],
            [62, 22],
            [136, 98],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k % 2 ? 9 : 12} fill={k % 3 ? `${w}0.9)` : "#fff"} />
          ))}
        </svg>
      );
  }
}

export function CaseCards({ items = cases }: { items?: CaseStudy[] }) {
  return (
    <ul className="cards cards-2" data-stagger>
      {items.map((c, i) => (
        <li key={c.slug}>
          <Link href={`/work/${c.slug}`} className="card case">
            <span className="case-art" aria-hidden="true">
              <CaseGlyph i={i} />
              <span className="card-top">
                {c.tags.slice(0, 2).map((t) => (
                  <span className="pill" key={t}>
                    {t}
                  </span>
                ))}
              </span>
            </span>
            <span className="case-body">
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
                <span>Read the case study</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const initials = (name: string) =>
  name
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function Quotes({ items }: { items: Quote[] }) {
  return (
    <ul className="cards cards-3" data-stagger>
      {items.map((q) => (
        <li key={q.name + q.role}>
          <figure className="quote">
            <blockquote>{q.text}</blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">
                {initials(q.name)}
              </span>
              <b>{q.name}</b>
              <span>{q.role}</span>
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
