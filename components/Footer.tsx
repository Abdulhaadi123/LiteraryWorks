import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#04070d]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        {/* Top CTA Banner */}
        <div className="grid grid-cols-1 items-center gap-12 border-b border-white/10 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-[#00f0ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
              <span>READY TO ARCHITECT WHAT&apos;S NEXT</span>
            </div>
            <h2 className="mb-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Transform operations.<br />
              <em className="text-[#ff6b00] not-italic">Build with precision.</em>
            </h2>
            <p className="mb-8 max-w-xl text-base text-slate-300">
              From autonomous AI agent swarms to BIM digital twins and high-concurrency cloud systems, we engineer software that removes operational friction.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_24px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33] hover:shadow-[0_0_32px_rgba(255,107,0,0.4)]"
                href="/contact"
              >
                Schedule Engineering Consultation <span aria-hidden="true">↗</span>
              </Link>
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.03] px-7 font-display text-xs font-bold text-white backdrop-blur-md transition-all hover:border-[#00f0ff] hover:text-[#00f0ff]"
                href="/construction"
              >
                Explore ConTech Division <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-[#0a101d] p-7 shadow-xl">
            <span className="mb-4 block font-mono text-xs font-bold tracking-widest text-[#00f0ff]">
              US ENGINEERING HUBS
            </span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-[#0f172a] p-4">
                <strong className="block text-sm font-semibold text-white">New York, NY</strong>
                <small className="block text-xs text-slate-400">Enterprise &amp; Finance</small>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#0f172a] p-4">
                <strong className="block text-sm font-semibold text-white">Austin, TX</strong>
                <small className="block text-xs text-slate-400">ConTech &amp; AI Labs</small>
              </div>
            </div>
            <div className="my-5 h-[1px] w-full bg-white/10" />
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">SYSTEM UPTIME</span>
              <strong className="font-bold text-[#22c55e]">99.98% SLA</strong>
            </div>
          </div>
        </div>

        {/* Middle Navigation Grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link className="font-display text-2xl font-bold tracking-tight text-white" href="/">
              Literary<strong className="text-[#ff6b00]">Works</strong>
              <small className="mt-1.5 block font-mono text-[10px] tracking-wider text-slate-400">
                Enterprise Intelligence &amp; Built Environments
              </small>
            </Link>
            <p className="mt-4 mb-6 max-w-xs text-sm leading-relaxed text-slate-400">
              A high-precision US technology engineering firm delivering custom AI systems, modern cloud platforms, and construction technology solutions.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-slate-400">
                SOC2 TYPE II READY
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-slate-400">
                HIPAA ALIGNED
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] text-slate-400">
                ISO 27001 READY
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-white">
              Capabilities
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-[#00f0ff]" href="/services#ai-agents">
                Autonomous AI Swarms
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/construction">
                BIM &amp; ConTech Software
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/services#custom-saas">
                Custom Cloud Platforms
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/services#integrations">
                Legacy &amp; ERP Pipelines
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/services#cloud">
                Hardened Cloud &amp; DevOps
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-white">
              Industries
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-[#00f0ff]" href="/industries">
                Commercial Construction
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/industries">
                Heavy Industry &amp; Logistics
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/industries">
                AEC &amp; Real Estate
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/industries">
                Financial Services
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/industries">
                Healthcare Networks
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-[#00f0ff]" href="/about">
                Our Approach
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/about#principles">
                Engineering Principles
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/construction">
                Licensing &amp; Delivery
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/contact">
                Book Technical Audit
              </Link>
              <Link className="transition-colors hover:text-[#00f0ff]" href="/privacy">
                Privacy &amp; Security
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-start justify-between gap-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} LiteraryWorks Technologies LLC. All rights reserved. US-focused technology and ConTech engineering services.
          </p>
          <div className="flex items-center gap-3">
            <Link className="hover:text-[#00f0ff]" href="/privacy">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link className="hover:text-[#00f0ff]" href="/privacy">
              Terms of Service
            </Link>
            <span>·</span>
            <Link className="hover:text-[#00f0ff]" href="/privacy">
              Security Whitepaper
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
