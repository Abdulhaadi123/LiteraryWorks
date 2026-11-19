import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Privacy Notice & Security Standards",
  "Information regarding LiteraryWorks Technologies' data handling, SOC2 alignment, and security protocols.",
  "/privacy"
);

export default function PrivacyPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>INFORMATION &amp; SECURITY</span>
          </div>
          <h1 className="mt-4 mb-4 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Privacy &amp; Data Security.
          </h1>
          <p className="max-w-xl text-base text-slate-600">
            Transparency, zero-trust data residency, and enterprise compliance.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70 py-16">
        <div className="mx-auto max-w-3xl px-6 space-y-8 text-sm leading-relaxed text-slate-600">
          <div className="rounded-xl border border-[#c29b61]/30 bg-[#c29b61]/10 p-5 font-mono text-xs text-[#9a753a]">
            Enterprise Security Notice — All inquiries and systems comply with US SOC2 Type II, HIPAA, and ISO 27001 data governance baselines.
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              When you submit an engineering inquiry via our contact form, we collect your name, business email, organization/contractor name, capability interest, and technical project description. We use this information solely to schedule consultations, assess technical scope, and respond to your inquiry.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl font-bold text-slate-900">2. Mutual Non-Disclosure &amp; Client Blueprints</h2>
            <p>
              LiteraryWorks Technologies LLC enters into mutual non-disclosure agreements (NDAs) prior to receiving proprietary blueprints, CAD files, ERP credentials, or internal operational documentation. Your data is never shared, resold, or used for model training without explicit written consent.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl font-bold text-slate-900">3. Infrastructure &amp; Data Residency</h2>
            <p>
              Client production data is hosted in hardened US-based cloud infrastructure (AWS GovCloud / Azure Commercial) with encrypted storage (AES-256) at rest and TLS 1.3 in transit.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl font-bold text-slate-900">4. Contacting Security &amp; Compliance</h2>
            <p>
              For security disclosures, SOC2 audit packet requests, or compliance inquiries, please contact our engineering team via the consultation portal.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
