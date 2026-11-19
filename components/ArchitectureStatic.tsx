const levels = [
  { id: "06", name: "Security & Oversight", slug: "Human approval, governance and audit trail", tag: "Control" },
  { id: "05", name: "AI Agents & Automation", slug: "Grounding in approved business knowledge", tag: "Intelligence" },
  { id: "04", name: "Applications & Dashboards", slug: "Portals and tools teams use daily", tag: "Software" },
  { id: "03", name: "Integrations & APIs", slug: "Connected ERP, CRM, and field systems", tag: "Connectivity" },
  { id: "02", name: "Data & BIM Models", slug: "Structured databases, drawings and knowledge", tag: "Information" },
  { id: "01", name: "Cloud Foundation", slug: "Reliable infrastructure, security and uptime", tag: "Infrastructure" },
];

/** Semantic, clean architectural fallback for phone, reduced motion, and no-WebGL environments. */
export function ArchitectureStatic() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
          <span className="h-2 w-2 rounded-full bg-[#c29b61]" />
          <span>LW // REFERENCE ARCHITECTURE</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">SIX-LAYER SYSTEM</span>
      </div>

      <div className="my-6 grid gap-2.5" aria-label="Six coordinated layers in an intelligent enterprise architecture">
        {levels.map((level) => (
          <div
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:bg-slate-50"
            key={level.id}
          >
            <span className="font-mono text-xs font-bold text-[#b48d55]">{level.id}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-slate-900">{level.name}</strong>
                <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs">
                  {level.tag}
                </span>
              </div>
              <small className="mt-0.5 block text-xs text-slate-500">{level.slug}</small>
            </div>
            <span className="text-slate-400" aria-hidden="true">
              ◈
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
        An illustrative reference architecture. Every system is shaped around your specific team, data rules, and physical workflows.
      </div>
    </div>
  );
}
