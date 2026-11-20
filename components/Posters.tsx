/**
 * The still pictures of the hero scene: the same model the 3D scene draws, rendered once from the scene itself
 * (scripts/make-posters.mjs), so phones, tablets, reduced motion and the moment before WebGL is ready all show
 * the real thing and not a drawing of it. Sizes are fixed, so nothing moves while they load.
 */

export function AssemblyPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster"
      src="/scene/assembly-closed.webp"
      srcSet="/scene/assembly-closed-800.webp 800w, /scene/assembly-closed.webp 1100w"
      sizes="(min-width: 64rem) 56vw, 92vw"
      width={1100}
      height={825}
      alt=""
      decoding="async"
    />
  );
}

/** The opened model, shown inside the third chapter wherever the scene itself is not playing. */
export function AssemblyOpenPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-open"
      src="/scene/assembly-open.webp"
      srcSet="/scene/assembly-open-800.webp 800w, /scene/assembly-open.webp 1056w"
      sizes="(min-width: 64rem) 40vw, 92vw"
      width={1056}
      height={1320}
      alt="The same system opened into its seven layers: web and mobile apps, design, AI, workflow automation, data, integrations, and cloud and security."
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
}
