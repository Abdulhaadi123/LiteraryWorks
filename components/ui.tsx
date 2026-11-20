import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cases, faqs as allFaqs, guarantee, ladder, type CaseStudy, type Quote } from "@/lib/content";
import { services, type ServiceIndexItem } from "@/lib/services";

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

/** The top of every inner page. */
export function PageHero({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero on-mist">
      <div className="wrap">
        <p className="kicker rise" style={d(0)}>
          {kicker}
        </p>
        <h1 className="h-xl rise" style={d(1)}>
          {title}
        </h1>
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

/** The services as an index: a number, the name, one line, and the group. */
export function ServiceIndex({ items = services }: { items?: ServiceIndexItem[] }) {
  return (
    <ul className="index" data-stagger>
      {items.map((s, i) => (
        <li key={s.slug}>
          <Link href={`/services/${s.slug}`}>
            <span className="no">{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.name}</h3>
            <p>{s.short}</p>
            <span className="tags">
              <span className="pill">{s.group}</span>
              {s.isNew ? <span className="pill pill-new">New</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ServiceCards({ items = services }: { items?: ServiceIndexItem[] }) {
  return (
    <ul className="cards" data-stagger>
      {items.map((s) => (
        <li key={s.slug}>
          <Link href={`/services/${s.slug}`} className="card">
            <span className="card-top">
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

export function CaseCards({ items = cases }: { items?: CaseStudy[] }) {
  return (
    <ul className="cards cards-2" data-stagger>
      {items.map((c) => (
        <li key={c.slug}>
          <Link href={`/work/${c.slug}`} className="card case">
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
              <span>Read the case study</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Quotes({ items }: { items: Quote[] }) {
  return (
    <ul className="cards cards-3" data-stagger>
      {items.map((q) => (
        <li key={q.name + q.role}>
          <figure className="quote">
            <blockquote>{q.text}</blockquote>
            <figcaption>
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
