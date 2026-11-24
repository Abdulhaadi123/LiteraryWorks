import Link from "next/link";
import { Checks, PageHero, Portfolio, SectionHead } from "@/components/ui";
import { versioned } from "@/lib/assets";
import { projectList, projectPictures, projects, type Project, type ProjectBlock } from "@/lib/projects";

/**
 * The page of one of the other projects we have built (/work/<slug>): what it is, what it had to solve and how, its
 * features where they are published, and its pictures. The words come from lib/projects.ts; a part that was never
 * published (a challenge, a solution) is simply not on the page.
 */

const alt = (p: Project, n: number, total: number) => (n === 1 ? `${p.name}: ${p.kind}` : `${p.name}: screen ${n - 1} of ${total - 1}`);

function Block({ b }: { b: ProjectBlock }) {
  return (
    <li>
      {b.label ? <span className="project-label">{b.label}</span> : null}
      <h3>{b.title}</h3>
      {b.text ? <p>{b.text}</p> : null}
      {b.points ? <Checks items={b.points} /> : null}
      {b.callout ? (
        <div className="project-callout">
          <b>{b.callout.title}</b>
          <p>{b.callout.text}</p>
        </div>
      ) : null}
    </li>
  );
}

export function ProjectPage({ p }: { p: Project }) {
  const pics = projectPictures(p.slug);
  const [cover, ...rest] = pics;
  // the pictures that are screens of a phone are tall and narrow: they go in their own, narrower, rows
  const wide = rest.map((s, i) => ({ s, n: i + 2 })).filter((x) => x.s[0] / x.s[1] >= 0.8);
  const tall = rest.map((s, i) => ({ s, n: i + 2 })).filter((x) => x.s[0] / x.s[1] < 0.8);
  // the next three projects in the list, wrapping round
  const at = projects.findIndex((x) => x.slug === p.slug);
  const more = [1, 2, 3].map((k) => projectList[(at + k) % projectList.length]);

  const picture = ({ s, n }: { s: [number, number]; n: number }) => (
    <li key={n}>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={versioned(`/projects/${p.slug}/${n}.webp`)} width={s[0]} height={s[1]} alt={alt(p, n, pics.length)} loading="lazy" decoding="async" />
      </figure>
    </li>
  );

  return (
    <>
      <PageHero kicker={`Project / ${p.kind}`} title={p.name} lead={p.summary}>
        <Link className="btn btn-navy" href="/contact?topic=audit">
          Book a free audit
        </Link>
        <Link className="btn btn-line" href="/work">
          All case studies
        </Link>
      </PageHero>

      {cover ? (
        <div className="case-cover">
          {/* the picture keeps its own shape (never cropped); it may be as wide as keeps it under 36rem tall */}
          <div className="wrap" style={{ aspectRatio: `${cover[0]} / ${cover[1]}`, maxWidth: `${((36 * cover[0]) / cover[1]).toFixed(1)}rem` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={versioned(`/projects/${p.slug}/1.webp`)} width={cover[0]} height={cover[1]} alt={alt(p, 1, pics.length)} fetchPriority="high" decoding="async" />
          </div>
        </div>
      ) : null}

      <section className="section on-white">
        <div className="wrap">
          {p.glance ? (
            <dl className="metrics metrics-lg project-glance" data-stagger>
              {p.glance.map((g) => (
                <div key={g.label}>
                  <dt>{g.value}</dt>
                  <dd>{g.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <ul className="chips tags" aria-label="Tags">
            {p.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section on-mist">
        <div className="wrap two-col">
          <SectionHead kicker="Overview" title={<>About this <em>project</em></>} />
          <div className="project-prose" data-reveal>
            {p.overview.map((t) => (
              <p className="lead" key={t}>
                {t}
              </p>
            ))}
          </div>
        </div>
        {p.features ? (
          <div className="wrap">
            <ul className="project-items" data-stagger>
              {p.features.map((f) => (
                <Block key={f.title} b={{ title: f.title, text: f.text }} />
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {p.challenge || p.solution ? (
        <section className="section on-white">
          <div className="wrap split">
            {p.challenge ? (
              <div data-reveal>
                <p className="kicker">The challenge</p>
                <h2 className="h-lg">What it had to solve</h2>
                {p.challenge.map((t) => (
                  <p className="lead" key={t}>
                    {t}
                  </p>
                ))}
              </div>
            ) : null}
            {p.solution ? (
              <div data-reveal>
                <p className="kicker">The solution</p>
                <h2 className="h-lg">How we approached it</h2>
                {p.solution.map((t) => (
                  <p className="lead" key={t}>
                    {t}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {p.sections?.map((s, i) => (
        <section className={`section ${i % 2 === 0 ? "on-mist" : "on-white"}`} key={s.title}>
          <div className="wrap">
            <SectionHead kicker={s.kicker} title={s.title} lead={s.lead} />
            <ul className="project-items" data-stagger>
              {s.blocks.map((b) => (
                <Block key={`${b.label ?? ""}${b.title}`} b={b} />
              ))}
            </ul>
          </div>
        </section>
      ))}

      {rest.length ? (
        <section className={`section ${p.sections ? (p.sections.length % 2 === 0 ? "on-mist" : "on-white") : p.challenge || p.solution ? "on-mist" : "on-white"}`}>
          <div className="wrap">
            <SectionHead kicker="Gallery" title={<>Inside the <em>build</em></>} />
            {wide.length ? <ul className="project-gallery">{wide.map(picture)}</ul> : null}
            {tall.length ? <ul className="project-gallery is-tall">{tall.map(picture)}</ul> : null}
          </div>
        </section>
      ) : null}

      {p.closing ? (
        <section className="section on-mist">
          <div className="wrap">
            <div className="project-closing" data-reveal>
              <h2 className="h-lg">{p.closing.title}</h2>
              <p className="lead">{p.closing.text}</p>
              <Link className="btn btn-navy" href="/contact?topic=audit">
                Book a free audit
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section on-white">
        <div className="wrap">
          <SectionHead kicker="More we have built" title={<>Other <em>projects</em></>} />
          <Portfolio items={more} />
        </div>
      </section>
    </>
  );
}
