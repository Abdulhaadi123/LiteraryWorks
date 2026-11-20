import Link from "next/link";
import { ServicesDeck } from "@/components/ServicesDeck";
import { PageHero, SectionHead, ServiceCards } from "@/components/ui";
import { engagement, industries } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Services",
  "AI and automation, voice systems, SaaS platforms, enterprise software, AI web and mobile apps, UI/UX design, cloud and DevOps, and construction technology.",
  "/services",
);

export default function ServicesPage() {
  return (
    <>
      <h1 className="sr-only">AI, software and cloud services</h1>
      <ServicesDeck
        id="services-deck"
        intro={
          <>
            <p className="kicker">Services</p>
            <h2 className="h-hero">
              Nine services. <em>One method.</em>
            </h2>
            <p className="lead">
              We help businesses find, build and scale the systems that take work off their teams: strategy first, then automation, software and cloud. Keep scrolling to turn through them.
            </p>
            <div className="cta-row">
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book a free audit
              </Link>
              <Link className="btn btn-white" href="/ai-audit">
                How an audit works
              </Link>
            </div>
          </>
        }
        fallback={
          <>
            <PageHero
              as="h2"
              kicker="Services"
              title={
                <>
                  Nine services. <em>One method.</em>
                </>
              }
              lead="We help businesses find, build and scale the systems that take work off their teams: strategy first, then automation, software and cloud."
            >
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book a free audit
              </Link>
              <Link className="btn btn-line" href="/ai-audit">
                How an audit works
              </Link>
            </PageHero>
            <section className="section on-white">
              <div className="wrap">
                <h2 className="sr-only">All services</h2>
                <ServiceCards />
              </div>
            </section>
          </>
        }
      />

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead
            kicker="How we work"
            title={
              <>
                Four phases, <em>one team.</em>
              </>
            }
            lead="A structured path built for clarity, speed and a result that lasts."
          />
          <ol className="steps" data-stagger>
            {engagement.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="Industries"
            title={
              <>
                Shaped by <em>your sector.</em>
              </>
            }
            lead="AI is most useful when it understands the detail of your work. These are the places we spend most of our time."
          />
          <ul className="industries" data-stagger>
            {industries.map((i) => (
              <li key={i.name}>
                <h3>{i.name}</h3>
                <p className="soft">{i.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
