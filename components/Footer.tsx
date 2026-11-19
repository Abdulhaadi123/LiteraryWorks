import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-[#0c1a28] text-white">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        {/* Top CTA Banner */}
        <div className="grid grid-cols-1 items-center gap-12 border-b border-white/10 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs tracking-wider text-[#e8d7b8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
              <span>HAVE A PROJECT IN MIND?</span>
            </div>
            <h2 className="mb-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let&apos;s make it<br />
              <em className="text-[#e8d7b8] not-italic">work better.</em>
            </h2>
            <p className="mb-8 max-w-xl text-base text-slate-300">
              Tell us where your business is heading. We&apos;ll help shape a practical, accountable path from idea to implementation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg bg-[#c29b61] px-7 font-display text-xs font-bold text-[#0c1a28] shadow-md transition-all hover:bg-[#d6b078]"
                href="/contact"
              >
                Discuss Your Project <span aria-hidden="true">↗</span>
              </Link>
              <Link
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/5 px-7 font-display text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white hover:text-[#0c1a28]"
                href="/construction"
              >
                Explore Built Environment <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <span className="mb-4 block font-mono text-xs font-bold tracking-wider text-[#e8d7b8]">
              THE WAY FORWARD
            </span>
            <div className="text-4xl text-[#c29b61] mb-4">↗</div>
            <p className="text-sm leading-relaxed text-slate-300">
              Intelligent software. Connected operations. Thoughtful engineering. Designed around how your teams actually work.
            </p>
            <div className="my-5 h-px w-full bg-white/10" />
            <div className="flex items-center justify-between font-mono text-xs text-slate-400">
              <span>LOCATIONS</span>
              <strong className="text-white">New York &amp; Austin</strong>
            </div>
          </div>
        </div>

        {/* Middle Navigation Grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link className="font-display text-2xl font-bold tracking-tight text-white" href="/">
              literary<strong className="text-[#c29b61]">works.</strong>
              <small className="mt-1 block font-sans text-xs font-normal text-slate-400">
                Technology shaped around the work.
              </small>
            </Link>
            <p className="mt-4 mb-6 max-w-xs text-sm leading-relaxed text-slate-400">
              US-focused software, AI systems, and construction technology practice. Connecting digital systems and physical projects with clarity and precision.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              Expertise
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-white" href="/services">
                AI Agents &amp; Automation
              </Link>
              <Link className="transition-colors hover:text-white" href="/services">
                Custom Software &amp; SaaS
              </Link>
              <Link className="transition-colors hover:text-white" href="/services">
                Enterprise AI &amp; Integrations
              </Link>
              <Link className="transition-colors hover:text-white" href="/services">
                Cloud &amp; Platform Engineering
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              Sectors
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-white" href="/construction">
                Commercial Construction
              </Link>
              <Link className="transition-colors hover:text-white" href="/industries">
                Real Estate &amp; Development
              </Link>
              <Link className="transition-colors hover:text-white" href="/industries">
                Logistics &amp; Operations
              </Link>
              <Link className="transition-colors hover:text-white" href="/industries">
                Healthcare &amp; Services
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              Company
            </h4>
            <div className="flex flex-col space-y-3 text-sm text-slate-400">
              <Link className="transition-colors hover:text-white" href="/about">
                About Us
              </Link>
              <Link className="transition-colors hover:text-white" href="/about#principles">
                Our Principles
              </Link>
              <Link className="transition-colors hover:text-white" href="/construction">
                Construction Licensing
              </Link>
              <Link className="transition-colors hover:text-white" href="/contact">
                Contact &amp; Inquiries
              </Link>
              <Link className="transition-colors hover:text-white" href="/privacy">
                Privacy Notice
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-start justify-between gap-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} LiteraryWorks. US-focused technology services. Construction availability varies by location.
          </p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-white" href="/privacy">
              Privacy Notice
            </Link>
            <span>·</span>
            <Link className="hover:text-white" href="/contact">
              Inquiries
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
