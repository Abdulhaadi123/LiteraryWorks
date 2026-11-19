import Link from "next/link";
import { approach } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "About LiteraryWorks Technologies",
  "The philosophy, team ethos, and engineering standards behind LiteraryWorks: an elite US technology and ConTech engineering practice.",
  "/about"
);

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>OUR MISSION &amp; PHILOSOPHY</span>
          </div>
          <p className="block font-mono text-xs font-semibold tracking-wider text-[#9a753a] uppercase">
            ABOUT LITERARYWORKS
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Clarity in Architecture.<br />
            <em className="text-[#b48d55] not-italic">Rigorous Engineering.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            We help ambitious US organizations move past software bloat and empty AI promises into production-grade systems that accelerate real business operations.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.35fr_1fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> WHO WE ARE
              </p>
              <span className="mt-4 block font-mono text-xs tracking-widest text-slate-400">
                ENGINEERING FIRST
              </span>
            </div>

            <div>
              <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                We don&apos;t start with speculative tools.{" "}
                <em className="text-[#b48d55] not-italic">We start with the operational bottleneck.</em>
              </h2>
              <p className="mb-6 text-base leading-relaxed text-slate-600">
                LiteraryWorks Technologies LLC is a US-focused engineering and systems architecture firm. We combine strategic operational discovery, modern full-stack software development, and applied artificial intelligence to build systems that eliminate human friction.
              </p>
              <p className="text-base leading-relaxed text-slate-600">
                Our capabilities span two complementary engines: our <strong>Core Technology Division</strong> (delivering autonomous AI agent swarms, high-concurrency SaaS, and cloud platform engineering) and our specialized <strong>ConTech &amp; Built Environment Division</strong> (bringing digital precision, automated takeoffs, and BIM coordination to commercial construction).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Principles */}
      <section className="border-b border-slate-200/80 bg-white py-20 lg:py-28" id="principles">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> CORE PRINCIPLES
          </p>
          <h2 className="mt-3 mb-12 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            The Commitments Behind Every System We Ship
          </h2>

          <div className="border-t border-slate-200">
            <article className="grid grid-cols-1 gap-6 border-b border-slate-200 py-10 sm:grid-cols-[60px_1fr_1fr] sm:gap-10">
              <span className="font-mono text-base font-bold text-[#b48d55]">01</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900">Deterministic Execution Over Hype</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                We engineer AI systems with verifiable source citations, structured data schemas, and rigorous unit testing. Technology should create clarity, not unpredictable surprises.
              </p>
            </article>

            <article className="grid grid-cols-1 gap-6 border-b border-slate-200 py-10 sm:grid-cols-[60px_1fr_1fr] sm:gap-10">
              <span className="font-mono text-base font-bold text-[#b48d55]">02</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900">Human Oversight at the Helm</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                True automation doesn&apos;t eliminate human expertise; it removes tedious friction so senior leaders can make high-leverage decisions with complete audit transparency.
              </p>
            </article>

            <article className="grid grid-cols-1 gap-6 border-b border-slate-200 py-10 sm:grid-cols-[60px_1fr_1fr] sm:gap-10">
              <span className="font-mono text-base font-bold text-[#b48d55]">03</span>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900">Built for the Built World &amp; Enterprise Reality</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                From muddy construction trailers to hardened cloud data centers, our software is tested under real operational conditions with offline-first support and zero-latency interfaces.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Phased Roadmap */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14">
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> HOW WE PARTNER
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              From Architectural Audit to Continuous Scale
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((item) => (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={item.number}>
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 font-mono text-[11px] font-bold text-[#b48d55]">
                  <span>{item.number} // {item.phase.toUpperCase()}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854]"
            >
              Discuss Your Project With Us <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
