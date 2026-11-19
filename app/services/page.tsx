import Link from "next/link";
import { services } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Technology & AI Capabilities",
  "Explore LiteraryWorks' comprehensive technology engineering services: enterprise AI swarms, ConTech digital twins, custom SaaS, and cloud infrastructure for US organizations.",
  "/services"
);

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>FULL-STACK ENGINEERING CAPABILITIES</span>
          </div>
          <p className="block font-mono text-xs font-semibold tracking-wider text-[#9a753a] uppercase">
            CORE EXPERTISE
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Engineered for Precision.<br />
            <em className="text-[#b48d55] not-italic">Built for Measurable Growth.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            We partner with forward-thinking US enterprises, commercial builders, and high-growth operators to design, build, and deploy high-reliability software, autonomous AI systems, and connected digital platforms.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 01 // CAPABILITIES CATALOG
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Six Specialized Divisions.<br />
                <em className="text-[#b48d55] not-italic">One Integrated Partner.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Every engagement blends strategic architecture, rigorous engineering, and long-term operational support.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard service={service} key={service.slug} />
            ))}
          </div>

          {/* Construction Feature Callout Card */}
          <div className="mt-16 flex flex-col items-start justify-between gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100 sm:p-10 lg:flex-row lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> SPECIALIZED DIVISION
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Construction Technology &amp; Heavy Asset Intelligence</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Looking specifically for automated blueprint takeoffs, BIM coordination, field reporting, or subcontractor workflow management? Explore our dedicated ConTech systems.
              </p>
            </div>
            <Link
              href="/construction"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854]"
            >
              Explore ConTech Division <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Engineering Standards */}
      <section className="border-b border-slate-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> 02 // TECHNICAL ASSURANCE
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                The standards we build by.<br />
                <em className="text-[#b48d55] not-italic">Zero compromise on quality.</em>
              </h2>
            </div>

            <div className="border-t border-slate-200">
              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">01</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">Deterministic AI with Human Guardrails</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    We never deploy &ldquo;black box&rdquo; autonomous agents without structured audit logs, verifiable source citations, and enforceable human approval gates for critical actions.
                  </p>
                </div>
              </article>

              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">02</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">US Enterprise Compliance &amp; Security</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Zero-trust network architecture, encrypted data at rest/transit, and SOC2 / HIPAA / ISO 27001 readiness embedded into system foundations from day one.
                  </p>
                </div>
              </article>

              <article className="flex gap-6 border-b border-slate-200 py-7">
                <span className="font-mono text-sm font-bold text-[#b48d55]">03</span>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">Production-Grade Scalability &amp; Observability</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Containerized architectures, automated CI/CD deployments, real-time APM telemetry, and 99.98% SLA benchmarks designed to handle demanding enterprise load.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Banner */}
      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0f2438] p-8 text-white shadow-xl sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
              <div>
                <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#c29b61] uppercase">
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> ARCHITECTURAL AUDIT
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Not sure which solution <em className="text-[#c29b61] not-italic">fits your operational reality?</em>
                </h2>
              </div>
              <div>
                <p className="mb-6 text-base text-slate-300">
                  We offer a complimentary 1-hour systems audit to analyze your existing workflows and identify your highest-leverage digital opportunities.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#c29b61] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#b0894f]"
                >
                  Book Architecture Audit <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
