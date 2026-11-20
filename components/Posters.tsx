/**
 * The still pictures of the hero scene: the same model the 3D scene draws, rendered once from the scene itself
 * (scripts/make-posters.mjs), so phones, tablets, reduced motion and a browser without WebGL all show the real
 * thing and not a drawing of it. Sizes are fixed, so nothing moves while they load.
 */

/** The nine tiles joined to the AI core by threads of light: the picture phones, tablets and reduced motion show. */
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
      height={1185}
      alt="The finished system: an AI core with a glass shell and turning rings, and nine tiles, one for each service we build, locked into one halo around it."
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
}
