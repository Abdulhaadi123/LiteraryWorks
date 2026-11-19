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
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>US ENGINEERING CONSULTATION</span>
          </div>
          <p className="block font-mono text-xs font-semibold tracking-wider text-[#9a753a] uppercase">
            START THE CONVERSATION
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Tell Us the Bottleneck.<br />
            <em className="text-[#b48d55] not-italic">We&apos;ll Architect the Solution.</em>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Whether you&apos;re planning an autonomous AI agent swarm, automating construction takeoffs, or modernizing an enterprise cloud platform, it begins with an honest, technical conversation.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> DIRECT INQUIRY
              </p>
              <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                What would you like <em className="text-[#b48d55] not-italic">to run faster &amp; cleaner?</em>
              </h2>
              <p className="mb-8 text-base text-slate-600">
                Share an overview of your current challenges, desired timeline, or system requirements. Our senior systems architects will review your submission and reach out within 24 business hours.
              </p>

              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="mb-4 block font-mono text-xs font-bold tracking-wider text-[#0f2438]">
                  OPERATIONAL HUBS
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <strong className="block text-sm font-semibold text-slate-900">New York, NY</strong>
                    <p className="text-xs text-slate-500">Enterprise Software &amp; Financial AI</p>
                  </div>
                  <div>
                    <strong className="block text-sm font-semibold text-slate-900">Austin, TX</strong>
                    <p className="text-xs text-slate-500">ConTech Systems &amp; Robotics/IoT</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-2xl">🛡️</span>
                <div>
                  <strong className="block text-sm font-semibold text-slate-900">Confidential &amp; Secure</strong>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
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
