import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  return service ? pageMeta(service.title, service.intro, `/services/${slug}`) : {};
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const index = services.findIndex((s) => s.slug === slug);
  const next = services[(index + 1) % services.length];

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/90 bg-white bg-[radial-gradient(ellipse_at_top_right,rgba(194,155,97,0.08)_0%,transparent_60%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <Link href="/services" className="mb-6 inline-block font-mono text-xs font-semibold text-slate-500 hover:text-[#0f2438]">
            ← Back to Capabilities Catalog
          </Link>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c29b61]/30 bg-[#c29b61]/10 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
            <span>SPECIFICATION // {service.number}</span>
          </div>
          <p className="block font-mono text-xs font-semibold tracking-wider text-[#9a753a] uppercase">
            {service.eyebrow}
          </p>
          <h1 className="mt-4 mb-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            {service.title.split(" & ")[0]}
            {service.title.includes(" & ") && (
              <>
                <br />
                <em className="text-[#b48d55] not-italic">&amp; {service.title.split(" & ").slice(1).join(" & ")}</em>
              </>
            )}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{service.intro}</p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-slate-50/70 py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 lg:grid-cols-[0.28fr_0.72fr] lg:gap-16 lg:px-8">
          <aside>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#9a753a] uppercase">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" /> DIVISION ICON
            </p>
            <span className="my-6 block text-6xl text-slate-800" aria-hidden="true">
              {service.icon}
            </span>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="block font-mono text-[10px] font-bold text-slate-500">TARGET SECTORS</span>
              <strong className="mt-1 block text-sm font-semibold text-slate-900">{service.idealFor}</strong>
            </div>
          </aside>

          <div>
            <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Solve the right bottleneck. <em className="text-[#b48d55] not-italic">Architect the durable solution.</em>
            </h2>
            <p className="mb-10 text-base leading-relaxed text-slate-600">{service.detail}</p>

            <h3 className="mb-6 font-display text-xl font-bold text-slate-900">Core Deliverables &amp; Architectural Milestones</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {service.deliverables.map((deliverable, i) => (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={deliverable}>
                  <span className="font-mono text-xs font-bold text-[#b48d55]">0{i + 1} // MILESTONE</span>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{deliverable}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-[#c29b61]/30 bg-[#c29b61]/10 p-6">
              <span className="font-mono text-xs font-bold text-[#9a753a]">DESIGNED FOR US OPERATIONAL REALITY</span>
              <p className="mt-1 text-sm font-semibold text-slate-900">{service.idealFor}</p>
            </div>

            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a3854]"
              >
                Discuss Implementation Scope <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-8">
          <span className="font-mono text-xs text-slate-500">NEXT ENGINEERING CAPABILITY</span>
          <Link href={`/services/${next.slug}`} className="font-display text-base font-semibold text-slate-900 hover:text-[#b48d55]">
            {next.title} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
