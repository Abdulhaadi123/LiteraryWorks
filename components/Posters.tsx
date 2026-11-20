/**
 * The still pictures of the hero scene: the same model the 3D scene draws, rendered once from the scene itself
 * (scripts/make-posters.mjs), so phones, tablets, reduced motion and the moment before WebGL is ready all show
 * the real thing and not a drawing of it. Sizes are fixed, so nothing moves while they load.
 */

/** The first frame of the live scene (the cards still loose): shown on wide screens until the scene is ready, so nothing jumps. */
export function SystemFirstPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-first"
      src="/scene/system-hero.webp"
      width={1200}
      height={1185}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

/** The cards gathered around the AI core: the picture phones, tablets and reduced motion show. */
export function SystemPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-ring"
      src="/scene/system-ring.webp"
      srcSet="/scene/system-ring-800.webp 800w, /scene/system-ring.webp 1200w"
      sizes="(min-width: 64rem) 56vw, 92vw"
      width={1200}
      height={1185}
      alt=""
      decoding="async"
    />
  );
}

/** The finished product, shown inside the closing chapter wherever the scene itself is not playing. */
export function SystemDashPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-open"
      src="/scene/system-dash.webp"
      srcSet="/scene/system-dash-800.webp 800w, /scene/system-dash.webp 1200w"
      sizes="(min-width: 64rem) 40vw, 92vw"
      width={1200}
      height={828}
      alt="The same six systems closed up into one product dashboard: apps, an AI assistant, voice, workflows, data and cloud, with the AI core docked in the corner."
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
}
