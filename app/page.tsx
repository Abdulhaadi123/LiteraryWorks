import Link from "next/link";
import { SystemDashPoster, SystemPoster } from "@/components/Posters";
import { CaseReel } from "@/components/CaseReel";
import { Marquee } from "@/components/Marquee";
import { d, Faq, Ladder, Quotes, SectionHead, ServiceCards, Tiles } from "@/components/ui";
import { ServicesDeck } from "@/components/ServicesDeck";
import { AuditStrip, Industries, Phases, Problems, ResultsBand, Transformation } from "@/components/Sections";
import { Phase, Xp } from "@/components/Xp";
import { cases, voices } from "@/lib/content";
import { sceneAria, systemLabelsFor } from "@/lib/scenes";
import { siteName, siteUrl } from "@/lib/seo";

/** What a search engine may know about the business: its name, address and logo. Nothing here that the site does not already say. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/brand/logo-color.png`,
      description: "AI, software and cloud engineering for U.S. businesses.",
    },
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: siteName, publisher: { "@id": `${siteUrl}/#organization` } },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Xp
        id="story"
        scene="system"
        vh={500}
        aria={sceneAria("hero")}
        labels={systemLabelsFor("hero")}
        data={{ variant: "hero" }}
        poster={<SystemPoster />}
      >
        <Phase from={0} to={0.11}>
          <p className="kicker rise" style={d(0)}>
            AI, software and cloud engineering
          </p>
          <h1 className="h-hero rise" style={d(1)}>
            AI and software, <em>working as one system.</em>
          </h1>
          <p className="lead rise" style={d(2)}>
            LiteraryWorks designs and builds AI systems, web and mobile apps and cloud platforms for U.S. businesses. We start with a free audit of where your time and money are going.
          </p>
          <div className="cta-row rise" style={d(3)}>
            <Link className="btn btn-navy" href="/contact?topic=audit">
              Book a free AI audit
            </Link>
            <Link className="btn btn-line" href="#method">
              See how we build
            </Link>
          </div>
        </Phase>
        <Phase from={0.11} to={0.31}>
          <p className="kicker">01 / Discover</p>
          <h2 className="h-lg">Start with how the work really runs.</h2>
          <p className="lead">
            Most businesses run on a dozen tools that do not talk to each other. A free audit maps them, finds the handoffs that waste time, and shows what is worth automating before anything is built.
          </p>
        </Phase>
        <Phase from={0.31} to={0.49}>
          <p className="kicker">02 / Connect</p>
          <h2 className="h-lg">Wire the pieces into one system.</h2>
          <p className="lead">
            AI assistants, voice agents and workflows connected to the apps and data you already use, so work moves between them on its own, with people reviewing the steps that matter.
          </p>
        </Phase>
        <Phase from={0.49} to={0.69}>
          <p className="kicker">03 / Build</p>
          <h2 className="h-lg">Build it as one product.</h2>
          <p className="lead">
            Web and mobile apps designed around the people who use them, on cloud infrastructure that is secure, monitored and ready to grow. One team, one plan, one system.
          </p>
          <SystemDashPoster />
        </Phase>
        <Phase from={0.69} to={0.88}>
          <p className="kicker">04 / Run</p>
          <h2 className="h-lg">Then keep it running.</h2>
          <p className="lead">
            We launch it, monitor it and keep improving it. Every decision is written down, and you get the whole system handed over, documented, whether or not we stay on.
          </p>
        </Phase>
        <Phase from={0.88} to={1}>
          <p className="kicker">Start here</p>
          <h2 className="h-lg">See how yours would come together.</h2>
          <p className="lead">
            A free one-hour audit shows where AI and software will pay for themselves, before you commit to building anything.
          </p>
          <div className="cta-row">
            <Link className="btn btn-navy" href="/contact?topic=audit">
              Book a free AI audit
            </Link>
            <Link className="btn btn-line" href="#start">
              The three ways to start
            </Link>
          </div>
        </Phase>
      </Xp>

      <Marquee />

      <section className="section on-white statement" id="approach">
        <div className="wrap statement-grid">
          <div>
            <p className="kicker" data-reveal>
              Our approach
            </p>
            <h2 className="big" data-split="words">
              Great software is not one feature. It is hundreds of decisions, <em>brought into perfect alignment.</em>
            </h2>
            <div className="statement-foot">
              <p data-reveal>
                We audit how your business really runs, then design and build the AI systems and software that take the busywork off your team.
              </p>
              <p data-reveal>
                Every engagement starts with understanding the work. You get the plan in writing either way, and you keep it whether or not we build it.
              </p>
            </div>
          </div>
          <Tiles
            items={[
              { icon: "clipboard", title: "A written plan first", text: "What we will build, why it matters, what it costs and how we will measure it." },
              { icon: "package", title: "Small releases you can judge", text: "Working software in stages, so you see progress and steer it as you go." },
              { icon: "book", title: "Handed over documented", text: "Everything written down, so your team can run it with us or without us." },
            ]}
          />
        </div>
      </section>

      <Problems />

      <ServicesDeck
        id="services"
        intro={
          <>
            <p className="kicker">What we build</p>
            <h2 className="h-lg">
              AI, software and cloud, <em>built as one system.</em>
            </h2>
            <p className="lead">
              Nine services, one method: map the work, design the system, build it into the tools you already use, then measure it. Keep scrolling to turn through them.
            </p>
          </>
        }
        fallback={
          <section className="section on-mist" id="services-list">
            <div className="wrap">
              <SectionHead
                kicker="What we build"
                title={
                  <>
                    AI, software and cloud, <em>built as one system.</em>
                  </>
                }
                lead="Whatever we are building, the method is the same: map the work, design the system, build it into the tools you already use, then measure it."
              />
              <ServiceCards />
            </div>
          </section>
        }
      />

      <Phases />

      <Transformation tone="mist" />

      <ResultsBand />

      <Industries tone="white" />

      <AuditStrip tone="mist" />

      <section className="section on-white" id="start">
        <div className="wrap">
          <SectionHead
            kicker="Three ways to start"
            title={
              <>
                Start free. <em>Go deeper when it makes sense.</em>
              </>
            }
            lead="Every engagement begins with understanding the work. You choose how far to take it, and you keep what we learn either way."
          />
          <Ladder />
        </div>
      </section>

      <CaseReel
        id="work"
        items={cases}
        head={
          <>
            <p className="kicker" data-reveal>
              Case studies
            </p>
            <h2 className="h-lg" data-split="words">
              Systems that run <em>in production.</em>
            </h2>
            <p className="lead" data-reveal>
              A few of the things we have built, and what changed once they were running.
            </p>
            <div className="cta-row">
              <Link className="btn btn-line" href="/work">
                All case studies
              </Link>
            </div>
          </>
        }
      />

      <section className="section on-mist">
        <div className="wrap">
          <SectionHead kicker="In their words" title={<>What clients <em>say.</em></>} />
          <Quotes items={voices} />
        </div>
      </section>

      <section className="section on-white">
        <div className="wrap two-col">
          <SectionHead kicker="Questions" title={<>Straight <em>answers.</em></>} lead="How the audit works, what it costs and who it is for." />
          <Faq />
        </div>
      </section>
    </>
  );
}
