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
    <div className="architecture-static">
      <div className="architecture-static-top">
        <div className="static-top-badge">
          <span className="static-pulse-dot" />
          <span>LW / ENTERPRISE ARCHITECTURE</span>
        </div>
        <span className="architecture-static-serial">CAD-REF-006</span>
      </div>

      <div className="architecture-stack" aria-label="Six coordinated layers in an intelligent enterprise architecture">
        {levels.map((level) => (
          <div className="architecture-level" key={level.id} style={{ "--level-accent": level.color } as React.CSSProperties}>
            <span className="architecture-rail">{level.id}</span>
            <div className="architecture-level-info">
              <div className="architecture-level-head">
                <strong>{level.name}</strong>
                <span className="level-badge">{level.tag}</span>
              </div>
              <small>{level.slug}</small>
            </div>
            <span className="architecture-level-glyph" aria-hidden="true">
              ◈
            </span>
          </div>
        ))}
      </div>

      <div className="architecture-static-footer">
        <p className="architecture-static-note">
          Illustrative system stack. Every client implementation is purpose-engineered to specific operational logic, data residency, and compliance mandates.
        </p>
      </div>
    </div>
  );
}
