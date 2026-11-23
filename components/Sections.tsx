import Link from "next/link";
import type { ReactNode } from "react";
import { auditOutputs, industries, phases, problems, rhythm, techUsed, type Phase } from "@/lib/content";
import { Icon, type IconName } from "./icons";
import { CaseImage, Checks, SectionHead } from "./ui";

/** The sections the pages are built from: the problem, the phases in full, the path of a service, sectors, the audit hour, how we work, the tools. */

/* ---- the four phases (the home page): a track of four icon nodes joined by a line, a card under each ---- */

const art = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
function PhaseArt({ n }: { n: string }) {
  return (
    <svg className="phase-art" viewBox="0 0 120 90" aria-hidden="true" {...art}>
      {n === "01" ? (
        <>
          <circle cx="24" cy="26" r="7" />
          <circle cx="60" cy="16" r="7" />
          <circle cx="96" cy="32" r="7" />
          <circle cx="36" cy="66" r="7" />
          <circle cx="86" cy="70" r="7" />
          <path d="M30 28l24-9M66 19l23 10M28 33l6 26M43 66l36 3M92 39l-4 24" />
          <g className="art-acc">
            <circle cx="60" cy="42" r="12" />
            <path d="M69 51l11 11" />
          </g>
        </>
      ) : n === "02" ? (
        <>
          <rect x="12" y="12" width="68" height="48" rx="5" />
          <path d="M12 28h68M34 28v32" />
          <rect className="art-acc" x="42" y="36" width="28" height="16" rx="3" />
          <path d="M12 74h68M12 69v10M80 69v10M96 12v48M91 12h10M91 60h10" />
        </>
      ) : n === "03" ? (
        <>
          <rect x="8" y="34" width="28" height="28" rx="5" />
          <rect x="46" y="34" width="28" height="28" rx="5" />
          <rect className="art-acc" x="84" y="34" width="28" height="28" rx="5" />
          <path d="M36 48h10M74 48h10" />
          <path className="art-acc" d="M98 26V10M91 17l7-7 7 7" />
        </>
      ) : (
        <>
          <path d="M12 76h96M12 76V12" />
          <path className="art-acc" d="M20 62l22-14 20 8 24-26 16 4" />
          <circle cx="42" cy="48" r="3.5" />
          <circle cx="62" cy="56" r="3.5" />
          <circle cx="86" cy="30" r="3.5" />
        </>
      )}
    </svg>
  );
}

export function Phases({ items = phases }: { items?: Phase[] }) {
  return (
    <section className="section on-white journey" id="method">
      <div className="wrap">
        <SectionHead
          center
          kicker="How we build"
          title={
            <>
              Four phases, <em>one team.</em>
            </>
          }
          lead="A structured path built for clarity, speed and a result that lasts. Each phase ends with something you can hold, and you decide whether to go on."
        />
        <div className="journey-body">
          <svg className="journey-wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 22 C 100 6, 200 6, 300 20 S 500 36, 600 20 S 800 4, 900 20 S 1100 34, 1200 18" />
          </svg>
          <ol className="journey-track" data-stagger>
            {items.map((p) => (
              <li key={p.n} id={`phase-${p.n}`} className="journey-step">
                <div className="journey-node">
                  <span className="journey-ring">
                    <PhaseArt n={p.n} />
                    <span className="journey-n">Step {p.n}</span>
                  </span>
                </div>
                <div className="journey-text">
                  <h3>{p.title}</h3>
                  <p className="journey-goal">{p.goal}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="journey-cta">
          <Link className="btn btn-navy" href="/contact?topic=audit">
            Book a free AI audit
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---- the path of one service: a timeline that zigzags down the page ---- */

export function Timeline({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="tl" data-stagger>
      {steps.map((s) => (
        <li key={s.title}>
          <div className="tl-card">
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---- the problem ---- */

export function Problems({ items = problems }: { items?: { title: string; text: string }[] }) {
  return (
    <section className="section on-mist" id="problem">
      <div className="wrap split">
        <SectionHead
          kicker="The problem"
          title={
            <>
              Most businesses do not need more tools. <em>They need clarity on what to fix first.</em>
            </>
          }
          lead="Before anything is built, we look for the three things that quietly cost the most."
        />
        <ol className="problems" data-stagger>
          {items.map((p, i) => (
            <li key={p.title}>
              <span className="problem-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---- sectors ---- */

const industryIcon: Record<string, IconName> = {
  Healthcare: "heart",
  "Logistics and distribution": "truck",
  "Professional services": "briefcase",
  "Real estate": "home",
  "E-commerce": "cart",
  Construction: "hardhat",
};

export function Industries({ tone = "white" }: { tone?: "white" | "mist" }) {
  return (
    <section className={`section on-${tone}`}>
      <div className="wrap">
        <SectionHead
          kicker="Industries"
          title={
            <>
              Shaped by <em>your sector.</em>
            </>
          }
          lead="AI is most useful when it understands the detail of your work. These are the places we spend most of our time."
        />
        <ul className="sectors" data-stagger>
          {industries.map((i, k) => (
            <li key={i.name}>
              {/* the large first tile shows the work itself: the AI medical scribe we built for a healthcare client */}
              {k === 0 ? (
                <figure className="sector-shot">
                  <CaseImage slug="ai-medical-scribe" sizes="(min-width: 64rem) 560px, 92vw" />
                </figure>
              ) : null}
              <span className="card-icon">
                <Icon name={industryIcon[i.name] ?? "sparkles"} />
              </span>
              <h3>{i.name}</h3>
              <p>{i.text}</p>
              {k === 0 ? (
                <Link className="sector-link" href="/work/ai-medical-scribe">
                  See the AI medical scribe case study
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---- the free hour ---- */

export function AuditStrip({ tone = "mist" }: { tone?: "white" | "mist" }) {
  return (
    <section className={`section on-${tone} audit-strip`}>
      <div className="wrap">
        <div className="audit-panel on-navy textured">
        <SectionHead
          kicker="The free audit"
          title={
            <>
              One hour. <em>Four things you leave with.</em>
            </>
          }
          lead="A working session, not a sales call, and useful even if you do not go further."
        />
        <ol className="audit-steps" data-stagger>
          {auditOutputs.map((o, i) => (
            <li key={o.title}>
              <span className="audit-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{o.title}</h3>
              <p>{o.text}</p>
            </li>
          ))}
        </ol>
        <div className="audit-foot">
          <span className="pill pill-new">60 minutes · free</span>
          <Link className="btn btn-navy" href="/contact?topic=audit">
            Book the free audit
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}

/* ---- how a project runs (about) ---- */

export function Rhythm() {
  return (
    <section className="section on-white">
      <div className="wrap">
        <SectionHead
          kicker="Working together"
          title={
            <>
              How we <em>work with you.</em>
            </>
          }
          lead="Projects go well when both sides know what is expected. This is ours."
        />
        <ul className="rhythm" data-stagger>
          {rhythm.map((r) => (
            <li key={r.title} className="panel">
              <span className="card-icon">
                <Icon name={r.icon} />
              </span>
              <h3 className="h-md">{r.title}</h3>
              <Checks items={r.items} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---- the tools (services) ---- */

export function Stack({ children }: { children?: ReactNode }) {
  return (
    <section className="section on-mist">
      <div className="wrap">
        <SectionHead
          kicker="Built with"
          title={
            <>
              The tools behind <em>the work.</em>
            </>
          }
          lead="What our case studies were built with: chosen for the job, never for the label."
        />
        <ul className="stack-chips" data-stagger>
          {techUsed.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}
