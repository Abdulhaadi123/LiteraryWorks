import Link from "next/link";
import { AssemblyOpenPoster, AssemblyPoster } from "@/components/Posters";
import { CaseCards, d, Faq, Ladder, Quotes, SectionHead, ServiceIndex } from "@/components/ui";
import { Phase, Xp } from "@/components/Xp";
import { cases, engagement, voices } from "@/lib/content";
import { assemblyLabels } from "@/lib/scenes";
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
        scene="assembly"
        vh={460}
        aria="One precision-built system, shown assembled and then opened layer by layer: web and mobile apps, UI and UX design, AI and voice, workflow automation, data, integrations, and cloud and security. Every layer sits on the same axis, and the system closes again exactly as it was."
        labels={assemblyLabels}
        poster={<AssemblyPoster />}
      >
        <Phase from={0} to={0.1}>
          <p className="kicker rise" style={d(0)}>
            AI, software and cloud engineering
          </p>
          <h1 className="h-hero rise" style={d(1)}>
            AI and software, <em>built with precision.</em>
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
        <Phase from={0.1} to={0.3} ch={1}>
          <p className="kicker">01 / Interface and design</p>
          <h2 className="h-lg">The part people actually touch.</h2>
          <p className="lead">
            Web and mobile apps designed around the person using them. Clear the first time, fast every time, and built to be changed.
          </p>
        </Phase>
        <Phase from={0.3} to={0.46} ch={2}>
          <p className="kicker">02 / Intelligence</p>
          <h2 className="h-lg">Models and automation, wired into real work.</h2>
          <p className="lead">
            AI agents, voice systems and workflows that read, route, answer and act, with people reviewing the steps that matter.
          </p>
        </Phase>
        <Phase from={0.46} to={0.62} ch={3}>
          <p className="kicker">03 / Foundation</p>
          <h2 className="h-lg">Data, integrations and cloud that keep it running.</h2>
          <p className="lead">
            Your records connected, your tools integrated, everything hosted, secured and monitored on AWS, Azure or Google Cloud.
          </p>
          <AssemblyOpenPoster />
        </Phase>
        <Phase from={0.62} to={0.86} ch={4}>
          <p className="kicker">04 / Alignment</p>
          <h2 className="h-lg">Hundreds of decisions, in perfect alignment.</h2>
          <p className="lead">
            That is what a system you can trust is made of. We make the decisions, write them down, and hand it over documented.
          </p>
        </Phase>
        <Phase from={0.86} to={1}>
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

      <section className="section on-white statement" id="approach">
        <div className="wrap">
          <p className="kicker" data-reveal>
            Our approach
          </p>
          <h2 className="big" data-split="words" style={{ marginTop: "1.25rem" }}>
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
      </section>

      <section className="section on-mist" id="services">
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
          <ServiceIndex />
        </div>
      </section>

      <section className="section on-white" id="method">
        <div className="wrap">
          <SectionHead
            kicker="How we build"
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

      <section className="section on-mist" id="start">
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

      <section className="section on-white" id="work">
        <div className="wrap">
          <SectionHead
            kicker="Work"
            title={
              <>
                Systems that run <em>in production.</em>
              </>
            }
            lead="A few of the things we have built, and what changed once they were running."
          />
          <CaseCards items={cases.slice(0, 4)} />
          <div className="cta-row section-cta">
            <Link className="btn btn-line" href="/work">
              All work
            </Link>
          </div>
        </div>
      </section>

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
