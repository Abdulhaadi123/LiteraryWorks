import Link from "next/link";
import { industries } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Target Industries & Sectors",
  "How LiteraryWorks engineers specialized software, AI systems, and ConTech workflows across commercial construction, healthcare, logistics, and enterprise SaaS.",
  "/industries"
);

export default function IndustriesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#060911] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3.5 py-1 font-mono text-[10px] tracking-wider text-[#00f0ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
            <span>US SECTOR SPECIALIZATION</span>
          </div>
          <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> INDUSTRY VERTICALS
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Engineered for the Realities of<br />
            <em className="text-[#ff6b00] not-italic">Regulated &amp; Complex Sectors.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            We don&apos;t apply one-size-fits-all templates. We study the operational constraints, compliance rules, and data flows of each industry to build systems that fit your team&apos;s daily reality.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0a101d] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-14 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_0.38fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#00f0ff] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#00f0ff]" /> 01 // SECTORS IN FOCUS
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Where our technology delivers<br />
                <em className="text-[#ff6b00] not-italic">the highest operational leverage.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                From jobsite field coordination to high-security data rooms, discover how our custom architectures perform.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10">
            {industries.map((item) => (
              <div
                className="group flex flex-col justify-between gap-4 border-b border-white/10 py-7 transition-all hover:bg-white/[0.02] sm:flex-row sm:items-center"
                key={item.number}
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-xs font-bold text-[#ff6b00]">{item.number}</span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white transition-colors group-hover:text-[#00f0ff]">
                      {item.name}
                    </h3>
                    <span className="font-mono text-[10px] text-[#00f0ff]">{item.tag}</span>
                  </div>
                </div>
                <p className="max-w-md text-sm text-slate-400 sm:text-right">{item.detail}</p>
                <span className="text-xl text-[#ff6b00] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
                  ↗
                </span>
              </div>
            ))}
          </div>

          {/* Construction Highlight */}
          <div className="mt-16 flex flex-col items-start justify-between gap-8 rounded-xl border border-white/15 bg-[#0f172a] p-8 sm:p-10 lg:flex-row lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> FLAGSHIP SECTOR
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Commercial Construction &amp; AEC Technology</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                Learn how our automated blueprint takeoffs, BIM conflict detection, and submittal automation pipelines are saving general contractors hundreds of hours per project.
              </p>
            </div>
            <Link
              href="/construction"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33]"
            >
              View ConTech Overview <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="border-b border-white/10 bg-[#060911] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-16 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> CUSTOM SYSTEM ARCHITECTURE
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Operating in a niche or <em className="text-[#ff6b00] not-italic">highly regulated market?</em>
            </h2>
          </div>
          <div>
            <p className="mb-6 text-base text-slate-300">
              Let&apos;s discuss your industry&apos;s specific compliance, security, and integration challenges in a confidential engineering audit.
            </p>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33]"
            >
              Schedule Industry Consultation <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
