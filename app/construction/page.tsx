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
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>BUILT ENVIRONMENT &amp; CONTECH PRACTICE</span>
          </div>
          <p className="block font-mono text-xs font-semibold tracking-wider text-[#9a753a] uppercase">
            CONSTRUCTION &amp; HEAVY ASSETS
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Building Smarter.<br />
            <em className="text-[#b48d55] not-italic">Engineered for the Physical World.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Bridging heavy physical construction with high-precision digital intelligence. We engineer automated blueprint takeoffs, BIM/CAD scheduling workflows, submittal automation, and jobsite telemetry for US general contractors, specialty trades, and commercial developers.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854] hover:shadow-md"
            >
              Request ConTech Consultation <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="#solutions"
              className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-7 font-display text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              Explore Core Capabilities <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Blueprint Feature */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28" id="solutions">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 01 // DIGITAL TWIN &amp; CAD PRECISION
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Interactive Project Telemetry.<br />
                <em className="text-[#b48d55] not-italic">Real-Time Clash &amp; Takeoff Engine.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Toggle layers below to inspect how our software connects structural framing, MEP infrastructure, and IoT sensors into one governed digital twin.
              </p>
            </div>
          </div>

          <BlueprintGraphic />
        </div>
      </section>

      {/* ConTech Software Pillars & Impact Stats */}
      <section className="border-b border-slate-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 02 // CONTECH SOFTWARE PILLARS
              </p>
              <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Eliminate Jobsite Friction.<br />
                <em className="text-[#b48d55] not-italic">From Blueprint to Handover.</em>
              </h2>
              <p className="mb-8 text-base text-slate-600">
                Contractors are burdened with manual submittals, fragmented estimating spreadsheets, and miscommunicated RFIs. We deliver unified software solutions designed specifically around commercial construction workflows:
              </p>

              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                <div className="py-5">
                  <strong className="block text-base font-bold text-slate-900">Automated AI Blueprint Takeoffs</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Parse complex multi-page architectural and structural vector PDFs in minutes. Automatically extract linear footages, area counts, and fixture quantities with verified audit trails.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-slate-900">BIM &amp; Schedule Conflict Detection</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Correlate 3D BIM models against 4D project timelines. Identify trade stacking, spatial clashes, and delivery delays before crews are blocked on site.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-slate-900">Autonomous Submittal &amp; RFI Routing</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Intelligently parse spec books, match product cut sheets, flag specification deviations, and route approval packets through general contractors and architects automatically.
                  </p>
                </div>

                <div className="py-5">
                  <strong className="block text-base font-bold text-slate-900">Procore, Autodesk &amp; ERP Connectors</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Bidirectional live synchronization between your field coordination platforms and back-office financial systems (Sage, Foundation, Viewpoint, QuickBooks).
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-8 shadow-xl shadow-slate-100">
              <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 font-mono text-xs text-[#0f2438]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
                <span className="font-semibold">FIELD IMPACT BENCHMARKS (US COMMERCIAL PILOTS)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <strong className="font-display text-3xl font-bold text-[#b48d55]">78%</strong>
                  <span className="mt-1 block text-xs font-semibold text-slate-900">Faster Takeoffs</span>
                  <small className="block text-[11px] text-slate-500">From 3 days to under 4 hours</small>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <strong className="font-display text-3xl font-bold text-[#b48d55]">-35%</strong>
                  <span className="mt-1 block text-xs font-semibold text-slate-900">RFI Cycle Time</span>
                  <small className="block text-[11px] text-slate-500">Automated spec correlation</small>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <strong className="font-display text-3xl font-bold text-[#0f2438]">$0</strong>
                  <span className="mt-1 block text-xs font-semibold text-slate-900">Clash Surprises</span>
                  <small className="block text-[11px] text-slate-500">Early BIM spatial alignment</small>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <strong className="font-display text-3xl font-bold text-emerald-700">100%</strong>
                  <span className="mt-1 block text-xs font-semibold text-slate-900">Audit Completeness</span>
                  <small className="block text-[11px] text-slate-500">Every change documented</small>
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
      <section className="border-t border-b border-[#c29b61]/30 bg-[#c29b61]/10 py-8">
        <div className="mx-auto flex max-w-[1400px] items-start gap-4 px-6 lg:px-8">
          <span className="text-2xl">⚖️</span>
          <div>
            <h3 className="text-sm font-bold text-[#9a753a]">Professional Standards &amp; Verified Delivery</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              LiteraryWorks Technologies LLC specializes in software engineering, artificial intelligence, and digital workflow systems for the built environment. Any physical construction, engineering oversight, or regulated site execution is coordinated through appropriately licensed, bonded, and insured professionals in compliance with applicable US municipal, state, and federal building codes.
            </p>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0f2438] p-8 text-white shadow-xl sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
              <div>
                <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#c29b61] uppercase">
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> START WITH AN ENGINEERING REVIEW
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Ready to modernize <em className="text-[#c29b61] not-italic">your construction workflows?</em>
                </h2>
              </div>
              <div>
                <p className="mb-6 text-base text-slate-300">
                  Let&apos;s review your current bidding, takeoff, or project coordination stack and identify where intelligent automation delivers immediate returns.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#c29b61] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#b0894f]"
                >
                  Schedule ConTech Consultation <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
