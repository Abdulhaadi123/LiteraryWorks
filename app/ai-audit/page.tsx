import Link from "next/link";
import { SceneHero } from "@/components/SceneHero";
import { Checks, Faq, Ladder, SectionHead } from "@/components/ui";
import { plan, problems } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "AI audit",
  "Start with a free 1-hour AI audit, or a 14-day audit that ends in a roadmap you can act on, with or without us. Money-back guarantee.",
  "/ai-audit",
);

export default function AiAuditPage() {
  return (
    <>
      <SceneHero
        id="top"
        variant="audit"
        kicker="AI audit"
        title={
          <>
            Know what to automate. <em>Before you pay to build it.</em>
          </>
        }
        lead="Most businesses do not have an AI problem. They have a workflow problem. We look at how your business really runs, find where time and money are being lost, and design the systems that fix it, in plain language, with a clear scope."
        actions={
          <>
            <Link className="btn btn-navy" href="/contact?topic=audit">
              Book a free 1-hour audit
            </Link>
            <Link className="btn btn-line" href="#start">
              See how to start
            </Link>
          </>
        }
        chapters={[
          {
            kicker: "The free audit",
            title: (
              <>
                One hour. <em>Useful even if you do not go further.</em>
              </>
            ),
            items: ["A review of your current workflows", "The bottlenecks, named", "Two or three high-impact AI opportunities", "A clear direction on what to automate first"],
          },
          {
            kicker: "The 14-day audit",
            title: (
              <>
                Clarity in 14 days. <em>Not another slide deck.</em>
              </>
            ),
            items: ["A full workflow breakdown", "An AI system architecture", "A ranked list of opportunities", "A roadmap you can execute"],
          },
        ]}
        closing={{
          title: (
            <>
              Start free. <em>Go deeper when it makes sense.</em>
            </>
          ),
          lead: "If the audit does not give you clarity on what to automate next, you do not pay.",
          actions: (
            <>
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book the free audit
              </Link>
              <Link className="btn btn-line" href="#start">
                See how to start
              </Link>
            </>
          ),
        }}
      />

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="The problem"
            title={
              <>
                Most businesses do not need more tools. <em>They need clarity.</em>
              </>
            }
            lead="Without clarity, AI only makes the chaos faster."
          />
          <ul className="cards cards-3" data-stagger>
            {problems.map((p, i) => (
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

      <section className="section on-navy textured">
        <div className="wrap split">
          <div>
            <p className="kicker" data-reveal>
              The free audit
            </p>
            <h2 className="h-lg" data-reveal>
              One hour. <em>Useful even if you do not go further.</em>
            </h2>
            <p className="lead" data-reveal>
              A working session, not a sales call. You leave with a clearer picture of your own operations.
            </p>
            <div className="cta-row section-cta">
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book the free audit
              </Link>
            </div>
          </div>
          <div className="panel" data-reveal>
            <Checks
              items={[
                "A review of your current workflows",
                "The inefficiencies and bottlenecks, named",
                "Two or three high-impact AI opportunities for your business",
                "A clear direction on what to automate first",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap">
          <SectionHead
            kicker="The 14-day audit"
            title={
              <>
                Clarity in 14 days. <em>Not another slide deck.</em>
              </>
            }
            lead="Clear decisions, ranked priorities and a roadmap you can actually execute."
          />
          <ol className="plan" data-stagger>
            {plan.map((s) => (
              <li key={s.title}>
                <span className="days">{s.days}</span>
                <h3 className="h-md">{s.title}</h3>
                <p className="soft">{s.text}</p>
                <div className="gets">
                  <p className="gets-label">What you walk away with</p>
                  <Checks items={s.gets} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section on-mist" id="start">
        <div className="wrap">
          <SectionHead
            kicker="Ways to engage"
            title={
              <>
                Clear scope. <em>No surprises.</em>
              </>
            }
            lead="Three ways to engage: start free, get clarity in 14 days, or build and run the systems with us."
          />
          <Ladder />
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap two-col">
          <SectionHead kicker="Questions" title={<>Before you <em>book.</em></>} lead="How the audit works, what it costs and who it is for." />
          <Faq />
        </div>
      </section>
    </>
  );
}
