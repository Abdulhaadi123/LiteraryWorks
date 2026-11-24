import Link from "next/link";
import { SystemDashPoster, SystemPoster } from "@/components/Posters";
import { CaseReel } from "@/components/CaseReel";
import { Marquee } from "@/components/Marquee";
import { Products } from "@/components/Products";
import { d, Faq, Ladder, SectionHead, Tiles } from "@/components/ui";
import { Clients } from "@/components/Clients";
import { ServicesGrid } from "@/components/ServicesGrid";
import { AuditStrip, Industries, Phases, Problems } from "@/components/Sections";
import { Phase, Xp } from "@/components/Xp";
import { cases, company, location } from "@/lib/content";
import { sceneAria, storyScene } from "@/lib/scenes";
import { siteName, siteUrl } from "@/lib/seo";

/** What a search engine may know about the business: its name, address and logo. Nothing here that the site does not already say. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      legalName: company.legalName,
      email: company.email,
      url: siteUrl,
      logo: `${siteUrl}/brand/logo-color.png`,
      description: "AI, software and cloud engineering for U.S. businesses.",
      address: { "@type": "PostalAddress", addressLocality: location.city, addressRegion: location.regionCode, addressCountry: location.country },
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
        scene="deck"
        auto
        steps={["Overview", "Discover", "Connect", "Build"]}
        aria={sceneAria("story")}
        labels={[]}
        data={storyScene()}
        poster={<SystemPoster />}
      >
        <Phase from={0} to={0.25} on>
          <p className="kicker rise" style={d(0)}>
            AI, software and cloud engineering
          </p>
          <h1 className="h-hero rise" style={d(1)}>
            AI and software, <em>working as one system</em>
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
        <Phase from={0.25} to={0.5}>
          <p className="kicker">01 / Discover</p>
          <h2 className="h-lg">Start with how the work really runs</h2>
          <p className="lead">
            Most businesses run on a dozen tools that do not talk to each other. A free audit maps them, finds the handoffs that waste time, and shows what is worth automating before anything is built.
          </p>
        </Phase>
        <Phase from={0.5} to={0.75}>
          <p className="kicker">02 / Connect</p>
          <h2 className="h-lg">Wire the pieces into one system</h2>
          <p className="lead">
            AI assistants, voice agents and workflows connected to the apps and data you already use, so work moves between them on its own, with people reviewing the steps that matter.
          </p>
        </Phase>
        <Phase from={0.75} to={1}>
          <p className="kicker">03 / Build</p>
          <h2 className="h-lg">Build it as one product</h2>
          <p className="lead">
            Web and mobile apps designed around the people who use them, on cloud infrastructure that is secure, monitored and ready to grow. One team, one plan, one system.
          </p>
          <SystemDashPoster />
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

      <section className="section on-navy statement textured" id="approach">
        <div className="wrap statement-grid">
          <div>
            <p className="kicker" data-reveal>
              Our approach
            </p>
            <h2 className="big" data-split="words">
              Great software is not one feature. It is hundreds of decisions, <em>brought into perfect alignment</em>
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

      <ServicesGrid />

      <Phases />

      <Industries tone="white" />

      <AuditStrip tone="mist" />

      <section className="section on-white" id="start">
        <div className="wrap">
          <SectionHead
            kicker="Three ways to start"
            title={
              <>
                Start free. <em>Go deeper when it makes sense</em>
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
              Systems that run <em>in production</em>
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

      <Products />

      <Clients />

      <section className="section on-mist">
        <div className="wrap two-col">
          <SectionHead kicker="Questions" title={<>Straight <em>answers</em></>} lead="How the audit works, what it costs and who it is for." />
          <Faq />
        </div>
      </section>
    </>
  );
}
