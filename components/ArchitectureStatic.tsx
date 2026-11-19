const levels = [
  { id: "06", name: "Security & Governance Deck", slug: "Human-in-the-loop oversight & telemetry", tag: "Governance", color: "#22c55e" },
  { id: "05", name: "Autonomous AI Swarm & Core", slug: "RAG reasoning, multi-agent dispatch & inference", tag: "Intelligence", color: "#ff6b00" },
  { id: "04", name: "Applications & Control Dashboards", slug: "High-concurrency portals & field mobile apps", tag: "Software", color: "#a855f7" },
  { id: "03", name: "Integrations & MEP Data Conduits", slug: "Bi-directional ERP, Procore & API pipelines", tag: "Connectivity", color: "#ff6b00" },
  { id: "02", name: "BIM & Structural Framing", slug: "3D CAD models, data schemas & knowledge stores", tag: "Structure", color: "#38bdf8" },
  { id: "01", name: "Substructure & Cloud Foundation", slug: "Hardened AWS/Azure infrastructure & edge telemetry", tag: "Infrastructure", color: "#00f0ff" },
];

/** Semantic, high-fidelity fallback for phone, reduced motion, and no-WebGL environments. */
export function ArchitectureStatic() {
  return (
    <div className="rounded-xl border border-white/15 bg-[#0a101d] p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00f0ff]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
          <span>LW / ENTERPRISE ARCHITECTURE</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">CAD-REF-006</span>
      </div>

      <div className="my-6 grid gap-2.5" aria-label="Six coordinated layers in an intelligent enterprise architecture">
        {levels.map((level) => (
          <div
            className="flex items-center gap-4 rounded-md border border-white/5 bg-[#0f172a] p-3.5 sm:gap-5 sm:p-4"
            key={level.id}
            style={{ borderLeftWidth: "3px", borderLeftColor: level.color }}
          >
            <span className="font-mono text-xs font-bold text-[#ff6b00]">{level.id}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <strong className="text-xs font-semibold text-white sm:text-sm">{level.name}</strong>
                <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-400">
                  {level.tag}
                </span>
              </div>
              <small className="mt-0.5 block text-[11px] text-slate-400">{level.slug}</small>
            </div>
            <span className="text-sm text-[#00f0ff]" aria-hidden="true">
              ◈
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 pt-4">
        <p className="text-xs leading-relaxed text-slate-400">
          Illustrative system stack. Every client implementation is purpose-engineered to specific operational logic, data residency, and compliance mandates.
        </p>
      </div>
    </div>
  );
}
