import { ContactForm } from "@/components/ContactForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Schedule Technical Consultation",
  "Connect with LiteraryWorks' senior systems architects to discuss custom AI systems, ConTech solutions, or enterprise cloud platforms.",
  "/contact"
);

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#060911] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3.5 py-1 font-mono text-[10px] tracking-wider text-[#00f0ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
            <span>US ENGINEERING CONSULTATION</span>
          </div>
          <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#ff6b00] uppercase">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#ff6b00]" /> START THE CONVERSATION
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Tell Us the Bottleneck.<br />
            <em className="text-[#ff6b00] not-italic">We&apos;ll Architect the Solution.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Whether you&apos;re planning an autonomous AI agent swarm, automating construction takeoffs, or modernizing an enterprise cloud platform, it begins with an honest, technical conversation.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0a101d] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#00f0ff] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#00f0ff]" /> DIRECT INQUIRY
              </p>
              <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                What would you like <em className="text-[#ff6b00] not-italic">to run faster &amp; cleaner?</em>
              </h2>
              <p className="mb-8 text-base text-slate-300">
                Share an overview of your current challenges, desired timeline, or system requirements. Our senior systems architects will review your submission and reach out within 24 business hours.
              </p>

              <div className="mb-8 rounded-xl border border-white/10 bg-[#0f172a] p-6">
                <span className="mb-4 block font-mono text-xs font-bold tracking-wider text-[#00f0ff]">
                  OPERATIONAL HUBS
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <strong className="block text-sm font-semibold text-white">New York, NY</strong>
                    <p className="text-xs text-slate-400">Enterprise Software &amp; Financial AI</p>
                  </div>
                  <div>
                    <strong className="block text-sm font-semibold text-white">Austin, TX</strong>
                    <p className="text-xs text-slate-400">ConTech Systems &amp; Robotics/IoT</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <span className="text-2xl">🛡️</span>
                <div>
                  <strong className="block text-sm font-semibold text-white">Confidential &amp; Secure</strong>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    We treat all operational blueprints, system architectures, and client disclosures under strict mutual non-disclosure (NDA) standards.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
