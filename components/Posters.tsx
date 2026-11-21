/**
 * The still pictures of the hero scene: the same model the 3D scene draws, rendered once from the scene itself
 * (scripts/make-posters.mjs), so phones, tablets, reduced motion and a browser without WebGL all show the real
 * thing and not a drawing of it. Sizes are fixed, so nothing moves while they load.
 */

/** Our projects on a laptop, a tablet and a phone (the story's first object): the picture phones, tablets and reduced motion show. */
export function SystemPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-ring"
      src="/scene/system-ring.webp"
      srcSet="/scene/system-ring-800.webp 800w, /scene/system-ring.webp 1200w"
      sizes="(min-width: 64rem) 56vw, 92vw"
      width={1200}
      height={1149}
      alt=""
      decoding="async"
    />
  );
}

/** The web apps we built, in three browser windows (the story's last object), shown inside the closing chapter wherever the scene itself is not playing. */
export function SystemDashPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="poster poster-open"
      src="/scene/system-dash.webp"
      srcSet="/scene/system-dash-800.webp 800w, /scene/system-dash.webp 1200w"
      sizes="(min-width: 64rem) 40vw, 92vw"
      width={1200}
      height={1149}
      alt="Three browser windows, one behind the other, showing web apps we built: an AI language tutor, a workspace and an executive search tool."
      loading="lazy"
      decoding="async"
      fetchPriority="low"
    />
  );
}
