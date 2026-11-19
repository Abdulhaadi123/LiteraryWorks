import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { BlueprintGraphic } from "@/components/BlueprintGraphic";

export const metadata = pageMeta(
  "Construction & Built Environment Intelligence",
  "Explore LiteraryWorks' specialized ConTech solutions, automated blueprint takeoffs, BIM coordination, and project systems for US commercial contractors and developers.",
  "/construction"
);

export default function ConstructionPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#060911] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3.5 py-1 font-mono text-[10px] tracking-wider text-[#00f0ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
            <span>BUILT ENVIRONMENT &amp; CONTECH DIVISION</span>
          </div>
          <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> CONSTRUCTION &amp; HEAVY ASSETS
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Building Smarter.<br />
            <em className="text-[#ff6b00] not-italic">Engineered for the Physical World.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Bridging heavy physical construction with high-precision digital intelligence. We engineer automated blueprint takeoffs, BIM/CAD scheduling workflows, submittal automation, and jobsite telemetry for US general contractors, specialty trades, and commercial developers.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33]"
            >
              Request ConTech Demo <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="#solutions"
              className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.03] px-7 font-display text-xs font-bold text-white transition-all hover:border-[#00f0ff] hover:text-[#00f0ff]"
            >
              Explore Core Capabilities <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Blueprint Feature */}
      <section className="border-b border-white/10 bg-[#0a101d] py-20 lg:py-28" id="solutions">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#00f0ff] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#00f0ff]" /> 01 // DIGITAL TWIN &amp; CAD PRECISION
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Interactive Project Telemetry.<br />
                <em className="text-[#ff6b00] not-italic">Real-Time Clash &amp; Takeoff Engine.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                Toggle layers below to inspect how our software connects structural framing, MEP infrastructure, and IoT sensors into one governed digital twin.
              </p>
            </div>
          </div>

          <BlueprintGraphic />
        </div>
      </section>

      {/* ConTech Software Pillars & Impact Stats */}
      <section className="border-b border-white/10 bg-[#060911] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#00f0ff] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#00f0ff]" /> 02 // CONTECH SOFTWARE PILLARS
              </p>
              <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Eliminate Jobsite Friction.<br />
                <em className="text-[#ff6b00] not-italic">From Blueprint to Handover.</em>
              </h2>
              <p className="mb-8 text-base text-slate-300">
                Contractors are burdened with manual submittals, fragmented estimating spreadsheets, and miscommunicated RFIs. We deliver unified software solutions designed specifically around commercial construction workflows:
              </p>

              <div className="divide-y divide-white/10 border-t border-b border-white/10">
                <div className="py-5">
                  <strong className="block text-base font-bold text-white">Automated AI Blueprint Takeoffs</strong>
                  <p className="mt-1 text-sm text-slate-400">
                    Parse complex multi-page architectural and structural vector PDFs in minutes. Automatically extract linear footages, area counts, and fixture quantities with verified audit trails.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-white">BIM &amp; Schedule Conflict Detection</strong>
                  <p className="mt-1 text-sm text-slate-400">
                    Correlate 3D BIM models against 4D project timelines. Identify trade stacking, spatial clashes, and delivery delays before crews are blocked on site.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-white">Autonomous Submittal &amp; RFI Routing</strong>
                  <p className="mt-1 text-sm text-slate-400">
                    Intelligently parse spec books, match product cut sheets, flag specification deviations, and route approval packets through general contractors and architects automatically.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-white">Procore, Autodesk &amp; ERP Connectors</strong>
                  <p className="mt-1 text-sm text-slate-400">
                    Bidirectional live synchronization between your field coordination platforms and back-office financial systems (Sage, Foundation, Viewpoint, QuickBooks).
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-[#0a101d] p-8 shadow-2xl">
              <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4 font-mono text-xs text-[#00f0ff]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                <span>FIELD IMPACT METRICS (US COMMERCIAL PILOTS)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/5 bg-[#0f172a] p-5">
                  <strong className="font-display text-3xl font-bold text-[#ff6b00]">78%</strong>
                  <span className="mt-1 block text-xs font-semibold text-white">Faster Takeoffs</span>
                  <small className="block text-[10px] text-slate-400">From 3 days to under 4 hours</small>
                </div>

                <div className="rounded-lg border border-white/5 bg-[#0f172a] p-5">
                  <strong className="font-display text-3xl font-bold text-[#ff6b00]">-35%</strong>
                  <span className="mt-1 block text-xs font-semibold text-white">RFI Cycle Time</span>
                  <small className="block text-[10px] text-slate-400">Automated spec correlation</small>
                </div>

                <div className="rounded-lg border border-white/5 bg-[#0f172a] p-5">
                  <strong className="font-display text-3xl font-bold text-[#00f0ff]">$0</strong>
                  <span className="mt-1 block text-xs font-semibold text-white">Clash Surprises</span>
                  <small className="block text-[10px] text-slate-400">Early BIM spatial alignment</small>
                </div>

                <div className="rounded-lg border border-white/5 bg-[#0f172a] p-5">
                  <strong className="font-display text-3xl font-bold text-[#22c55e]">100%</strong>
                  <span className="mt-1 block text-xs font-semibold text-white">Audit Completeness</span>
                  <small className="block text-[10px] text-slate-400">Every change documented</small>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-slate-500">
                *Based on deployment data across commercial general contractors and mechanical/electrical trade partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="border-t border-b border-[#ff6b00]/30 bg-[#ff6b00]/5 py-8">
        <div className="mx-auto flex max-w-[1400px] items-start gap-4 px-6 lg:px-8">
          <span className="text-2xl">⚖️</span>
          <div>
            <h3 className="text-sm font-bold text-[#ff6b00]">Professional Standards &amp; Verified Delivery</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              LiteraryWorks Technologies LLC specializes in software engineering, artificial intelligence, and digital workflow systems for the built environment. Any physical construction, engineering oversight, or regulated site execution is coordinated through appropriately licensed, bonded, and insured professionals in compliance with applicable US municipal, state, and federal building codes.
            </p>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="border-b border-white/10 bg-[#0a101d] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-16 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> START WITH AN ENGINEERING REVIEW
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to modernize <em className="text-[#ff6b00] not-italic">your construction workflows?</em>
            </h2>
          </div>
          <div>
            <p className="mb-6 text-base text-slate-300">
              Let&apos;s review your current bidding, takeoff, or project coordination stack and identify where intelligent automation delivers immediate returns.
            </p>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33]"
            >
              Schedule ConTech Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
