/**
 * A band of large words that drifts sideways: what we build, in the brand's two voices (solid and outline). Purely
 * decorative (the same words are in the page), so it is hidden from assistive technology, and it stands still for
 * visitors who prefer reduced motion.
 */
const words = ["Web and mobile apps", "AI assistants", "Voice AI", "Workflow automation", "Data and integrations", "Cloud and security"];

export function Marquee() {
  const row = words.map((w) => (
    <span key={w}>
      {w}
      <i>·</i>
    </span>
  ));
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <div>{row}</div>
        <div>{row}</div>
      </div>
    </div>
  );
}
