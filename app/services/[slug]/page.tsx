import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Checks, PageHero, SectionHead, ServiceCards } from "@/components/ui";
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

  const related = services.filter((x) => x.slug !== slug && (x.group === s.group || x.group === "AI")).slice(0, 3);

  return (
    <>
      <PageHero kicker={`${s.group} / Service`} title={s.name} lead={p.summary}>
        <Link className="btn btn-navy" href={`/contact?topic=${s.slug}`}>
          Talk to us about this
        </Link>
        <Link className="btn btn-line" href="/services">
          All services
        </Link>
      </PageHero>

      <section className="section on-white">
        <div className="wrap split">
          <div>
            <p className="kicker" data-reveal>
              What we build
            </p>
            <h2 className="h-lg" data-reveal>
              The work, <em>in detail.</em>
            </h2>
            <div className="panel" data-reveal>
              <Checks items={p.features} />
            </div>
          </div>
          <div className="stack-lg">
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
      </section>

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead
            kicker="What changes"
            title={
              <>
                The result, <em>in practice.</em>
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
                Five steps, <em>no surprises.</em>
              </>
            }
          />
          <ol className="steps" data-stagger>
            {p.steps.map((x) => (
              <li key={x.title}>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead kicker="Related" title={<>More ways we <em>can help.</em></>} />
          <ServiceCards items={related} />
        </div>
      </section>
    </>
  );
}
