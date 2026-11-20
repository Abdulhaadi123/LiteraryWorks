import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseCards, CaseImage, Checks, PageHero, SectionHead } from "@/components/ui";
import { caseBySlug, cases } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) return {};
  return pageMeta(c.title, c.summary.length > 158 ? `${c.summary.slice(0, 155)}...` : c.summary, `/work/${slug}`);
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) notFound();
  const more = cases.filter((x) => x.slug !== slug).slice(0, 2);

  return (
    <>
      <PageHero kicker={`Case study / ${c.client}`} title={c.title} lead={c.summary}>
        <Link className="btn btn-navy" href="/contact?topic=audit">
          Book a free audit
        </Link>
        <Link className="btn btn-line" href="/work">
          All case studies
        </Link>
      </PageHero>

      <div className="case-cover">
        <div className="wrap">
          <CaseImage slug={c.slug} sizes="(min-width: 80rem) 1200px, 92vw" priority />
        </div>
      </div>

      <section className="section on-white">
        <div className="wrap">
          <dl className="metrics metrics-lg" data-stagger>
            {c.results.map((r) => (
              <div key={r.label}>
                <dt>{r.value}</dt>
                <dd>{r.label}</dd>
              </div>
            ))}
          </dl>
          <ul className="chips tags" aria-label="Tags">
            {c.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap split">
          <div data-reveal>
            <p className="kicker">The problem</p>
            <h2 className="h-lg">What was broken.</h2>
            {c.problem.map((t) => (
              <p className="lead" key={t}>
                {t}
              </p>
            ))}
          </div>
          <div className="panel" data-reveal>
            <h3 className="h-md">The state we walked into</h3>
            <ul className="plain">
              {c.before.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap split">
          <div data-reveal>
            <p className="kicker">The solution</p>
            <h2 className="h-lg">How we approached it.</h2>
            {c.solution.map((t) => (
              <p className="lead" key={t}>
                {t}
              </p>
            ))}
          </div>
          <div className="panel" data-reveal>
            <h3 className="h-md">What we built</h3>
            <Checks items={c.built} />
          </div>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap split">
          <div data-reveal>
            <p className="kicker">Timeline</p>
            <p className="big-fact">{c.timeline}</p>
            <h3 className="h-md">Tools and technology</h3>
            <ul className="chips">
              {c.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          {c.quote ? (
            <figure className="quote" data-reveal>
              <blockquote>{c.quote.text}</blockquote>
              <figcaption>
                <b>{c.quote.name}</b>
                <span>{c.quote.role}</span>
              </figcaption>
            </figure>
          ) : null}
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap">
          <SectionHead kicker="More work" title={<>Want results <em>like this?</em></>} />
          <CaseCards items={more} />
        </div>
      </section>
    </>
  );
}
