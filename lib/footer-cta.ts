/** The call to action at the top of the footer: its words and its two buttons. */
export interface FooterCta {
  kicker: string;
  /** The headline, in two parts: the second is shown in the muted second tone. */
  title: [string, string];
  /** Three short facts: a figure or a word, and what it says. */
  facts: [string, string][];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

/** The names the words of some pages are made from (the pages' own names, so nothing is written twice). */
export interface CtaNames {
  services: Record<string, string>;
  /** The projects (public names). A case study has none here: its page gets the general words. */
  projects: Record<string, string>;
  /** The company's e-mail address and where it is (kept here so this file, which the browser loads, stays small). */
  email: string;
  city: string;
  region: string;
}

const audit = { label: "Book a free AI audit", href: "/contact?topic=audit" };
const standardFacts: [string, string][] = [
  ["60 min", "Free audit session"],
  ["14 days", "Structured audit"],
  ["One team", "Plan, build and handover"],
];

/** The home page's words: also what any page without words of its own shows. */
const home: FooterCta = {
  kicker: "Start with clarity",
  title: ["Know exactly what to automate,", "before you pay to build it"],
  facts: standardFacts,
  primary: audit,
  secondary: { label: "The three ways to start", href: "/ai-audit" },
};

/**
 * The words of the footer's call to action for a page. Each kind of page says what its visitor is likely to want next:
 * a service page talks about that service, a project page about a system like it, the contact page about writing, and so on.
 * Only facts the site already states are used (the free hour, the 14-day audit, one team, the handover, where we are, the
 * reply time).
 */
export function footerCta(pathname: string, names: CtaNames): FooterCta {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return home;

  if (path === "/services")
    return {
      kicker: "Not sure where to start?",
      title: ["Tell us the problem,", "and we will point you to the right service"],
      facts: [
        ["60 min", "Free audit session"],
        [`${Object.keys(names.services).length} services`, "AI, software and cloud"],
        ["One team", "Plan, build and handover"],
      ],
      primary: audit,
      secondary: { label: "See case studies", href: "/work" },
    };

  const service = path.match(/^\/services\/([a-z0-9-]+)$/)?.[1];
  if (service && names.services[service]) {
    const name = names.services[service];
    return {
      kicker: `Start with ${name}`,
      title: [`Put ${name} to work for your business,`, "starting with a free hour"],
      facts: [
        ["60 min", "Free audit session"],
        ["Fixed quote", "For the build"],
        ["Documented", "Handover included"],
      ],
      primary: { label: `Talk about ${name}`, href: `/contact?topic=${service}` },
      secondary: { label: "All services", href: "/services" },
    };
  }

  if (path === "/work")
    return {
      kicker: "Your project next",
      title: ["Have a system like these in mind?", "Start with a free audit"],
      facts: standardFacts,
      primary: audit,
      secondary: { label: "How we work", href: "/about" },
    };

  const work = path.match(/^\/work\/([a-z0-9-]+)$/)?.[1];
  if (work) {
    const name = names.projects[work];
    return {
      kicker: "Start your own",
      title: [name ? `Want something like ${name}?` : "Want a system like this one?", "Start with a free audit"],
      facts: standardFacts,
      primary: audit,
      secondary: { label: "More case studies", href: "/work" },
    };
  }

  if (path === "/ai-audit")
    return {
      kicker: "Book your hour",
      title: ["Book your free hour,", "and leave with a clear next step"],
      facts: [
        ["60 min", "Free working session"],
        ["Next step", "Clear, either way"],
        ["One team", "Plan, build and handover"],
      ],
      primary: audit,
      secondary: { label: "See case studies", href: "/work" },
    };

  if (path === "/about")
    return {
      kicker: "Work with us",
      title: ["See how we work", "in a free one-hour session"],
      facts: [
        [names.city, `${names.region}, U.S.`],
        ["Written down", "For you to keep"],
        ["One team", "Plan, build and handover"],
      ],
      primary: audit,
      secondary: { label: "Contact us", href: "/contact" },
    };

  if (path === "/contact")
    return {
      kicker: "Prefer to write?",
      title: ["Email us any time,", "we typically reply within one business day"],
      facts: [
        ["1 business day", "Typical first reply"],
        ["60 min", "Free audit session"],
        [names.city, `${names.region}, U.S.`],
      ],
      primary: { label: `Email ${names.email}`, href: `mailto:${names.email}` },
      secondary: { label: "About the free audit", href: "/ai-audit" },
    };

  if (path === "/privacy")
    return {
      kicker: "Questions about your data?",
      title: ["Ask us before you share anything,", "we will answer plainly"],
      facts: [
        ["Plain words", "What we collect and why"],
        ["1 business day", "Typical first reply"],
        [names.city, `${names.region}, U.S.`],
      ],
      primary: { label: "Contact us", href: "/contact" },
      secondary: { label: "The free AI audit", href: "/ai-audit" },
    };

  return home;
}
