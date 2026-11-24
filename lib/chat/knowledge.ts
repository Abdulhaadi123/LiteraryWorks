/**
 * What the assistant knows: the site's own words, gathered from the same data the pages render. Nothing here is
 * written separately, so the assistant can never say something the site does not.
 */
import { auditOutputs, cases, company, engagement, faqs, industries, ladder, location, phases, plan, principles, products } from "@/lib/content";
import { clientLogos } from "@/lib/client-logos";
import { clientQuotes } from "@/lib/clients";
import { projects, projectPictures, type Project } from "@/lib/projects";
import { servicePages } from "@/lib/service-pages";
import { services } from "@/lib/services";

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

/** One project, in full, as its page says it (and nothing the page does not say). */
function projectText(p: Project) {
  const out = [`## ${p.name}: ${p.kind} (page: /work/${p.slug}; ${projectPictures(p.slug).length} screens on the page)`, `Tags: ${p.tags.join(", ")}.`, `Overview: ${p.overview.join(" ")}`];
  if (p.glance) out.push(`At a glance: ${p.glance.map((g) => `${g.value} ${g.label.toLowerCase()}`).join("; ")}.`);
  if (p.features) out.push(`Features:\n${p.features.map((f) => `- ${f.title}: ${f.text}`).join("\n")}`);
  if (p.challenge) out.push(`Challenge: ${p.challenge.join(" ")}`);
  if (p.solution) out.push(`Solution: ${p.solution.join(" ")}`);
  for (const s of p.sections ?? []) {
    out.push(`${s.kicker}: ${s.title}.${s.lead ? ` ${s.lead}` : ""}`);
    for (const b of s.blocks) {
      out.push(`- ${b.label ? `${b.label}: ` : ""}${b.title}.${b.text ? ` ${b.text}` : ""}${b.points ? ` Key capabilities: ${b.points.join("; ")}.` : ""}${b.callout ? ` ${b.callout.title}: ${b.callout.text}` : ""}`);
    }
  }
  if (p.closing) out.push(`${p.closing.title} ${p.closing.text}`);
  return out.join("\n");
}

function build() {
  const parts: string[] = [];

  parts.push(`# Company
Literary Worx is a brand of ${company.legalName}, based in ${location.label}. It designs and builds AI automation, web and mobile apps and cloud systems for U.S. businesses.
Email: ${company.email}. Contact form: /contact. There is no published phone number or street address.`);

  parts.push(`# Ways to engage (the free 1-hour audit is the only published price; the 14-day audit and every build are quoted per business)
${ladder.map((o) => `## ${o.name}: ${o.price} (${o.unit})${o.note ? `. ${o.note}` : ""}
${list(o.points)}
Link: ${o.cta.href}`).join("\n")}
(There is no published guarantee, refund or money-back policy.)`);

  parts.push(`# The 14-day AI audit, day by day
${plan.map((p) => `- ${p.days}, ${p.title}: ${p.text} You get: ${p.gets.join("; ")}.`).join("\n")}
What you leave the free 1-hour audit with:
${auditOutputs.map((a) => `- ${a.title}: ${a.text}`).join("\n")}
Page: /ai-audit`);

  parts.push(`# Services (page for each: /services/<slug>; all services: /services)
${services
  .map((s) => {
    const p = servicePages[s.slug];
    return `## ${s.name} (slug: ${s.slug})
${s.short} ${p?.summary ?? ""}
Features: ${p?.features.join("; ") ?? ""}
Outcomes: ${p?.outcomes.join("; ") ?? ""}
Use cases: ${p?.useCases.join("; ") ?? ""}
Steps: ${p?.steps.map((x) => x.title).join(" > ") ?? ""}`;
  })
  .join("\n\n")}`);

  parts.push(`# Case studies (page for each: /work/<slug>; all: /work)
${cases
  .map(
    (c) => `## ${c.title} (slug: ${c.slug})
Client: ${c.client}. Timeline: ${c.timeline}. Tags: ${c.tags.join(", ")}.
${c.summary}
Built: ${c.built.join("; ")}
Results: ${c.results.map((r) => `${r.value} ${r.label}`).join("; ")}
Tech: ${c.tech.join(", ")}${c.quote ? `\nClient quote: "${c.quote.text}" (${c.quote.name}, ${c.quote.role})` : ""}`,
  )
  .join("\n\n")}`);

  parts.push(`# Our own products (each has its own website)
${products.map((p) => `## ${p.name}: ${p.category}. ${p.status}.
${p.text}
Covers ${p.domains.join(", ")} and ${p.moreDomains} more regulatory domains. ${p.facts.map((f) => `${f.value} ${f.label.toLowerCase()}`).join("; ")}.
Website: ${p.url} (the one outside link you may give: write it as a markdown link whose words are the domain, for example [balosys.com](https://balosys.com/))`).join("\n")}`);

  parts.push(`# Clients (shown on the home page and the about page, #clients)
Logos shown: ${clientLogos.map((l) => l.name).join(", ")}. The names and words below are published; no ratings, counts of clients or satisfaction figures are published, so give none.
${clientQuotes.map((q) => `- ${q.name}, ${q.role}: "${q.text}"`).join("\n")}`);

  parts.push(`# Other products and platforms the team has built (each has its own page on this site, linked below)
Everything the team has published about each one is written here, and nothing else is known about it: no technology stack, architecture, clients, prices, dates, user numbers or results beyond what is written. A part that is missing (a challenge, a solution, features) was not published. When you describe one, link to its page once.

${projects.map(projectText).join("\n\n")}`);

  parts.push(`# How an engagement runs (four phases)
${phases.map((p) => `- ${p.title}: ${p.goal} You get: ${p.gets.join("; ")}.`).join("\n")}
Short form: ${engagement.map((e) => e.title).join(", ")}.`);

  parts.push(`# Principles
${principles.map((p) => `- ${p.title}: ${p.text}`).join("\n")}`);

  parts.push(`# Industries
${industries.map((i) => `- ${i.name}: ${i.text}`).join("\n")}`);

  parts.push(`# FAQ
${faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`);

  parts.push(`# Pages you may link to
/ (home), /services, /ai-audit, /work, /about, /contact, /contact?topic=audit (book the free AI audit), /privacy,
${services.map((s) => `/services/${s.slug}`).join(", ")},
${[...cases, ...projects].map((c) => `/work/${c.slug}`).join(", ")}`);

  return parts.join("\n\n");
}

export const knowledge = build();

/** Every path the assistant may link to; any other link in an answer is shown as plain text. */
export const linkablePaths = new Set<string>([
  "/",
  "/services",
  "/ai-audit",
  "/work",
  "/about",
  "/contact",
  "/contact?topic=audit",
  "/privacy",
  ...services.map((s) => `/services/${s.slug}`),
  ...cases.map((c) => `/work/${c.slug}`),
  ...projects.map((p) => `/work/${p.slug}`),
]);
