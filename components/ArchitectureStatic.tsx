const levels = [
  {id:"06",name:"Security & oversight",slug:"Secure by design"},
  {id:"05",name:"AI agents",slug:"Action with approval"},
  {id:"04",name:"Applications & SaaS",slug:"Tools people use"},
  {id:"03",name:"Integrations",slug:"Systems connected"},
  {id:"02",name:"Data & knowledge",slug:"Trusted information"},
  {id:"01",name:"Cloud foundation",slug:"Reliable infrastructure"},
];
/** Semantic, lightweight fallback for phone, reduced motion, no JS and failed WebGL. */
export function ArchitectureStatic() {
  return <div className="architecture-static"><div className="architecture-static-top"><span className="architecture-static-mark">LW / SYSTEM</span><span>REFERENCE ARCHITECTURE</span></div><div className="architecture-stack" aria-label="Six coordinated layers in an intelligent enterprise architecture">{levels.map(level=><div className="architecture-level" key={level.id}><span className="architecture-rail">{level.id}</span><div><strong>{level.name}</strong><small>{level.slug}</small></div><span className="architecture-level-glyph" aria-hidden="true">◈</span></div>)}</div><p className="architecture-static-note">An illustrative architecture. Every implementation is tailored to the people, processes and systems involved.</p></div>;
}
