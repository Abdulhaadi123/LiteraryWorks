import Link from "next/link";
import type { Service } from "@/lib/content";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
      data-reveal="rise"
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-400">
            {service.number} // 06
          </span>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700 transition-colors group-hover:bg-[#0f2438] group-hover:text-white" aria-hidden="true">
            {service.icon}
          </div>
        </div>

        <div className="mb-2 font-mono text-[11px] font-semibold tracking-wider text-[#b48d55] uppercase">
          {service.eyebrow}
        </div>
        <h3 className="mb-3 font-display text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-[#0f2438]">
          {service.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">
          {service.intro}
        </p>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-5">
        <span className="flex items-center justify-between font-display text-xs font-bold text-slate-900 transition-colors group-hover:text-[#b48d55]">
          <span>Explore Capability</span>
          <span className="text-base transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}
