import Link from "next/link";
import { Checks, PageHero, SectionHead } from "@/components/ui";
import { engagement, principles } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "About",
  "LiteraryWorks designs and builds AI automation, software and cloud systems for U.S. businesses, and writes everything down so you can keep going without us.",
  "/about",
);

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About"
        title={
          <>
            We build the systems <em>behind the work.</em>
          </>
        }
        lead="LiteraryWorks designs and builds AI automation, software and cloud systems for U.S. businesses. We start with how your work actually runs, and we write everything down so you can keep going without us."
      >
        <Link className="btn btn-navy" href="/contact?topic=audit">
          Book a free audit
        </Link>
        <Link className="btn btn-line" href="/services">
          Our services
        </Link>
      </PageHero>

      <section className="section on-white">
        <div className="wrap split">
          <div>
            <p className="kicker" data-reveal>
              The name
            </p>
            <h2 className="h-lg" data-reveal>
              Written in chapters. <em>Built to read clearly.</em>
            </h2>
            <p className="lead" data-reveal>
              A good piece of writing is planned, drafted, edited until it reads clearly, and finished when nothing is left to explain. We try to build software the same way: a plan first, small chapters that ship, and a handover your team can read.
            </p>
          </div>
          <div className="panel" data-reveal>
            <h3 className="h-md">What that means in practice</h3>
            <Checks
              items={[
                "A written plan before any build",
                "Small releases you can see and judge",
                "Plain language in proposals, reports and invoices",
                "Documentation your team, or any team, can pick up",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead
            kicker="Principles"
            title={
              <>
                How we <em>think about the work.</em>
              </>
            }
          />
          <ul className="cards cards-2" data-stagger>
            {principles.map((p, i) => (
              <li key={p.title}>
                <div className="card is-static">
                  <span className="card-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="h-md">{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="How we work"
            title={
              <>
                Four phases, <em>start to finish.</em>
              </>
            }
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

      <section className="section on-mist">
        <div className="wrap split">
          <div className="panel" data-reveal>
            <h3 className="h-md">Who we work with</h3>
            <p className="soft">
              Founders and operators of established businesses with at least one repetitive, high-volume process that costs time: healthcare, logistics, professional services, real estate, e-commerce and construction.
            </p>
          </div>
          <div className="panel" data-reveal>
            <h3 className="h-md">When it is too early</h3>
            <p className="soft">
              If you are pre-revenue, or there is no process to automate yet, we will say so, and tell you what to put in place first.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
