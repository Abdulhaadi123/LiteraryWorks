import Link from "next/link";
import { services, industries, approach, metrics } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { SystemPreview } from "@/components/SystemPreview";
import { BlueprintGraphic } from "@/components/BlueprintGraphic";
import { Stage3D } from "@/motion/Stage3D";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(15,36,56,0.04)_0%,transparent_50%)]"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto grid min-h-[min(840px,calc(100svh-140px))] max-w-[1400px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-[#9a753a]" data-reveal="fade">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
              <span>US ENTERPRISE AI &amp; BUILT ENVIRONMENT PRACTICE</span>
            </div>

            <h1 id="hero-heading" className="mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl" data-reveal="rise">
              Engineering Intelligence for the Built World &amp; Enterprise Scale.
            </h1>

            <p className="mb-9 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg" data-reveal="rise">
              We design mission-critical AI systems, custom software platforms, and digital twin workflows for forward-thinking US enterprises, commercial builders, and industrial operators.
            </p>

            <div className="mb-12 flex flex-wrap items-center gap-4" data-reveal="rise">
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854] hover:shadow-md"
                href="/contact"
              >
                Schedule Engineering Consultation <span aria-hidden="true">↗</span>
              </Link>
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-7 font-display text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400"
                href="/construction"
              >
                Explore ConTech Division <span aria-hidden="true">↗</span>
              </Link>
            </div>

            {/* Metrics Telemetry Strip */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-8 sm:grid-cols-4" data-reveal="fade">
              {metrics.map((m) => (
                <div key={m.label}>
                  <strong className="block font-display text-2xl font-bold text-[#b48d55] sm:text-3xl">
                    {m.value}
                  </strong>
                  <span className="mt-1 block text-xs font-semibold text-slate-900">{m.label}</span>
                  <small className="block text-[11px] text-slate-500">{m.note}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center" data-reveal="scale">
            <SystemPreview />
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 border-t border-slate-200/80 px-6 font-mono text-[11px] tracking-wider text-slate-500 lg:px-8">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span className="font-semibold">US INFRASTRUCTURE: OPERATIONAL</span>
          </div>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="hidden sm:inline text-slate-600">
            SCROLL TO INSPECT DIGITAL TWIN ARCHITECTURE <b className="text-[#0f2438]" aria-hidden="true">↓</b>
          </span>
        </div>
      </section>

      {/* Intro / Problem Statement */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28" id="why">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.35fr_1fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 01 // THE ARCHITECTURAL CHALLENGE
              </p>
              <span className="mt-4 block font-mono text-xs tracking-widest text-slate-400">
                BEYOND DISCONNECTED TOOLS
              </span>
            </div>

            <div>
              <h2 className="mb-8 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl" data-reveal="rise">
                The problem isn&apos;t a lack of tools.{" "}
                <em className="text-[#b48d55] not-italic">
                  It&apos;s that your operational systems don&apos;t talk to each other.
                </em>
              </h2>

              <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                  From fragmented spreadsheets and siloed ERPs to manual submittal bottlenecks on commercial job sites, valuable time is lost between handoffs. We build the connective intelligence—software, AI agents, and integrations that turn disjointed steps into an automated, transparent operation.
                </p>
                <Link
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 font-display text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400"
                  href="/about"
                >
                  Our Engineering Philosophy <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Runway Scene */}
      <Stage3D
        scene="aiSystem"
        eyebrow="02 // PHYSICAL DIGITAL TWIN"
        title={
          <>
            Six Coordinated Layers. <br />
            <em className="text-[#b48d55] not-italic">One Engineered Operation.</em>
          </>
        }
        description="Scroll through our reference architectural scale model. Rendered purely via mathematical geometry—from solid limestone foundation and structural steel framing to copper data conduits, optical glass intelligence cores, and executive governance."
        steps={[
          {
            title: "Substructure & Hardened Infrastructure",
            text: "High-availability cloud architecture, zero-trust security perimeters, and reliable edge compute foundations.",
          },
          {
            title: "Structural Framing & Connected Data",
            text: "Unified data models, 3D CAD framing schemas, and permission-governed knowledge stores.",
          },
          {
            title: "MEP Conduits & Real-Time Integrations",
            text: "Bi-directional event buses synchronizing ERPs, Procore, Autodesk, and internal databases.",
          },
          {
            title: "Control Dashboards & Modern SaaS",
            text: "High-concurrency web portals and offline-first mobile applications built for field crews and executives.",
          },
          {
            title: "Autonomous AI Swarms & Core Intelligence",
            text: "Specialized AI agents executing automated takeoffs, schedule conflict audits, and multi-step tasks.",
          },
          {
            title: "Executive Governance & Safety Gate",
            text: "Mandatory human-in-the-loop sign-off, SOC2 compliance logging, and real-time operational telemetry.",
          },
        ]}
        labels={[
          { key: "cloud", label: "Substructure Foundation", detail: "01 / CLOUD & EDGE" },
          { key: "data", label: "BIM & Structural Framing", detail: "02 / DATA STORE" },
          { key: "integrations", label: "Conduits & API Pipelines", detail: "03 / CONNECTIVITY" },
          { key: "applications", label: "Control Dashboards", detail: "04 / PLATFORMS" },
          { key: "agents", label: "Autonomous AI Core", detail: "05 / SWARM AGENTS" },
          { key: "governance", label: "Command & Governance", detail: "06 / OVERSIGHT" },
        ]}
      />

      {/* ConTech & Built Environment Feature */}
      <section className="grid grid-cols-1 border-b border-slate-200/80 bg-white lg:grid-cols-2" id="contech">
        <div className="flex items-center justify-center border-b border-slate-200/80 p-8 lg:border-b-0 lg:border-r lg:p-12 bg-slate-50/50">
          <BlueprintGraphic />
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[10px] tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>CONTECH &amp; AEC DIVISION</span>
          </div>

          <h2 className="mb-5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Physical structures.<br />
            <em className="text-[#b48d55] not-italic">Digital precision.</em>
          </h2>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-600">
            Commercial construction projects lose millions to paperwork delays, material estimation errors, and misaligned field handoffs. We build the next generation of construction intelligence—delivering automated blueprint takeoffs, live BIM clash analytics, and streamlined subcontractor submittal workflows.
          </p>

          <div className="mb-8 flex flex-wrap gap-2.5">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700">
              Automated AI Takeoffs
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700">
              BIM / CAD Pipelines
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700">
              Procore &amp; Autodesk Sync
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700">
              Submittal &amp; RFI Routing
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-mono text-xs text-slate-700">
              Jobsite Telematics
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/construction"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-6 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#183652]"
            >
              Explore ConTech Capabilities <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 font-display text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              Request ConTech Audit <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28" id="expertise">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 04 // CORE EXPERTISE
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Built for the reality of<br />
                <em className="text-[#b48d55] not-italic">high-stakes enterprise operations.</em>
              </h2>
            </div>
            <div>
              <p className="mb-4 text-sm text-slate-600">
                From specialized construction tech to autonomous AI agents and scalable cloud architectures, we design systems that perform under heavy enterprise load.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 font-display text-xs font-semibold text-[#0f2438] hover:text-[#b48d55]"
              >
                View All Capabilities <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard service={s} key={s.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Comparison Section */}
      <section className="border-b border-slate-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 05 // QUANTIFIABLE OUTCOMES
              </p>
              <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Measurable leverage.<br />
                <em className="text-[#b48d55] not-italic">Zero tech theater.</em>
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-slate-600">
                We measure every system by hard operational metrics: hours returned to senior staff, risk eliminated from contracts, and cycle times cut in half.
              </p>
            </div>

            <div className="border-t border-slate-200">
              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">01</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">Reclaim thousands of operational hours.</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Replace repetitive document sorting, submittal reviews, and manual spreadsheet entries with deterministic AI workflows that execute in seconds.
                  </p>
                </div>
              </article>

              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">02</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">Activate siloed enterprise data.</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Unify scattered blueprints, contract archives, and disconnected ERP records into a permission-governed retrieval system your leadership can trust.
                  </p>
                </div>
              </article>

              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">03</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">Eliminate costly change-order surprises.</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    In construction and capital projects, our automated takeoff and clash detection systems identify discrepancies before equipment rolls onto the site.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 06 // TARGET SECTORS
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Engineered for complex,<br />
                <em className="text-[#b48d55] not-italic">high-concurrency US industries.</em>
              </h2>
            </div>
            <div>
              <p className="mb-4 text-sm text-slate-600">
                We tailor our architectures to the regulatory, security, and operational standards of mission-critical American businesses.
              </p>
              <Link href="/industries" className="font-display text-xs font-semibold text-[#0f2438] hover:text-[#b48d55]">
                All Industry Verticals <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200">
            {industries.map((item) => (
              <div
                className="group flex flex-col justify-between gap-4 border-b border-slate-200 py-6 transition-all hover:bg-white hover:px-4 hover:rounded-xl hover:shadow-sm sm:flex-row sm:items-center"
                key={item.number}
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-xs font-bold text-[#b48d55]">{item.number}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 transition-colors group-hover:text-[#0f2438]">
                      {item.name}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500">{item.tag}</span>
                  </div>
                </div>
                <p className="max-w-md text-sm text-slate-600 sm:text-right">{item.detail}</p>
                <span className="text-xl text-[#0f2438] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
                  ↗
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process / Approach Section */}
      <section className="border-b border-slate-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 07 // DELIVERY METHODOLOGY
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Predictable delivery.<br />
                <em className="text-[#b48d55] not-italic">Rigorous execution.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Every engagement follows an accountable four-phase engineering framework designed to demonstrate value quickly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((item) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 transition-all hover:bg-white hover:shadow-md" key={item.number}>
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 font-mono text-[11px] font-bold text-[#b48d55]">
                  <span>{item.number} // {item.phase.toUpperCase()}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#0f2438] p-8 text-white shadow-xl sm:flex-row sm:items-center sm:p-10">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">Ready to audit your operational workflows?</h3>
              <p className="mt-1 text-sm text-slate-300">
                Schedule a focused 1-hour engineering consultation with our senior systems architects.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#c29b61] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#b0894f]"
            >
              Book Technical Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
