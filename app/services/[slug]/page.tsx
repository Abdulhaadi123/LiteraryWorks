import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SceneHero } from "@/components/SceneHero";
import { Timeline } from "@/components/Sections";
import { CaseImage, SectionHead, ServiceCards } from "@/components/ui";
import { caseBySlug, caseForService } from "@/lib/content";
import { servicePages } from "@/lib/service-pages";
import { serviceBySlug, services } from "@/lib/services";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  const p = servicePages[slug];
  if (!s || !p) return {};
  return pageMeta(s.name, p.summary.length > 158 ? `${p.summary.slice(0, 155)}...` : p.summary, `/services/${slug}`);
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  const p = servicePages[slug];
  if (!s || !p) notFound();

  const practice = caseBySlug(caseForService[slug] ?? "");
  const related = services.filter((x) => x.slug !== slug && (x.group === s.group || x.group === "AI")).slice(0, 3);

  return (
    <>
      <SceneHero
        id="top"
        variant={slug}
        kicker={`${s.group} / Service`}
        title={s.name}
        lead={p.summary}
        actions={
          <>
            <Link className="btn btn-navy" href={`/contact?topic=${s.slug}`}>
              Talk to us about this
            </Link>
            <Link className="btn btn-line" href="/services">
              All services
            </Link>
          </>
        }
        chapters={[
          { kicker: "What we build", title: <>The work, <em>in detail</em></>, items: p.features.slice(0, 4) },
          { kicker: "What changes", title: <>The result, <em>in practice</em></>, items: p.outcomes.slice(0, 4) },
        ]}
        closing={{
          title: <>Let us look at <em>your version</em></>,
          lead: "A free one-hour working session is enough to see where this fits in your business.",
          actions: (
            <>
              <Link className="btn btn-navy" href={`/contact?topic=${s.slug}`}>
                Talk to us about this
              </Link>
              <Link className="btn btn-line" href="/ai-audit">
                How an audit works
              </Link>
            </>
          ),
        }}
      />

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="What we build"
            title={
              <>
                The work, <em>in detail</em>
              </>
            }
          />
          <div className="detail-grid">
          <ol className="feature-list" data-stagger>
            {p.features.map((x, i) => (
              <li key={x}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{x}</p>
              </li>
            ))}
          </ol>
          <div className="detail-aside">
            <div data-reveal>
              <h3 className="h-md">Problems we solve</h3>
              <ul className="plain">
                {p.problems.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h3 className="h-md">Where it fits</h3>
              <ul className="chips">
                {p.useCases.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="section on-navy textured">
        <div className="wrap">
          <SectionHead
            kicker="What changes"
            title={
              <>
                The result, <em>in practice</em>
              </>
            }
          />
          <ol className="outcomes" data-stagger>
            {p.outcomes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="How it works"
            title={
              <>
                Five steps, <em>no surprises</em>
              </>
            }
          />
          <Timeline steps={p.steps} />
        </div>
      </section>

      {practice ? (
        <section className="section on-mist">
          <div className="wrap">
            <SectionHead kicker="In practice" title={<>See it <em>at work</em></>} lead="One of our case studies that shows this service in a real business." />
            <article className="in-practice" data-reveal>
              <Link href={`/work/${practice.slug}`} className="in-practice-img" tabIndex={-1} aria-hidden="true">
                <CaseImage slug={practice.slug} sizes="(min-width: 64rem) 560px, 92vw" />
              </Link>
              <div className="in-practice-text">
                <p className="kicker">{practice.tags.slice(0, 3).join(" · ")}</p>
                <h3 className="h-md">
                  <Link href={`/work/${practice.slug}`}>{practice.title}</Link>
                </h3>
                <p className="case-lead">{practice.summary}</p>
                <dl className="metrics">
                  {practice.results.slice(0, 3).map((r) => (
                    <div key={r.label}>
                      <dt>{r.value}</dt>
                      <dd>{r.label}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/work/${practice.slug}`} className="card-link">
                  <span>Read the case study</span>
                </Link>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="section on-white">
        <div className="wrap">
          <SectionHead kicker="Related" title={<>More ways we <em>can help</em></>} />
          <ServiceCards items={related} />
        </div>
      </section>
    </>
  );
}
