import Link from "next/link";
import type { Service } from "@/lib/content";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#0a101d] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f0ff]/50 hover:bg-[#0f172a] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(0,240,255,0.08)]"
      data-reveal="rise"
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#ff6b00]">
            {service.number} // 06
          </span>
          {service.badge && (
            <span className="rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#00f0ff]">
              {service.badge}
            </span>
          )}
          <span className="text-2xl text-slate-300 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
            {service.icon}
          </span>
        </div>

        <div className="mb-2 font-mono text-[11px] tracking-wider text-[#00f0ff] uppercase">
          {service.eyebrow}
        </div>
        <h3 className="mb-3 font-display text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-[#00f0ff]">
          {service.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-400">
          {service.intro}
        </p>
      </div>

      <div className="mt-8 border-t border-white/10 pt-5">
        <span className="flex items-center justify-between font-display text-xs font-bold text-white transition-colors group-hover:text-[#ff6b00]">
          <span>Explore Architecture &amp; Deliverables</span>
          <span className="text-base text-[#ff6b00] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" aria-hidden="true">
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}
