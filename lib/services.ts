export type ServiceGroup = "AI" | "Software" | "Cloud" | "Construction";

export interface ServiceIndexItem {
  slug: string;
  name: string;
  group: ServiceGroup;
  /** One line, for lists and cards. */
  short: string;
  isNew?: boolean;
}

/** The services, in the order the site lists them. The detail of each lives in lib/service-pages.ts. */
export const services: ServiceIndexItem[] = [
  { slug: "ai-automation", name: "AI and automation", group: "AI", short: "Agents and workflows that read, route, answer and act." },
  { slug: "ai-voice-systems", name: "AI voice systems", group: "AI", short: "Voice agents that answer calls, book, qualify and follow up." },
  { slug: "saas-platforms", name: "SaaS platforms", group: "Software", short: "Multi-tenant products, built to scale and to bill." },
  { slug: "enterprise-software", name: "Enterprise software", group: "Software", short: "Internal systems, portals and assistants that fit how you work." },
  { slug: "ai-web-apps", name: "AI web apps", group: "Software", short: "Web applications with machine learning built into the workflow." },
  { slug: "ai-mobile-apps", name: "AI mobile apps", group: "Software", short: "iOS and Android apps that adapt to the people using them." },
  { slug: "ui-ux-design", name: "UI/UX design", group: "Software", short: "Interfaces people understand the first time they use them." },
  { slug: "cloud-devops", name: "Cloud and DevOps", group: "Cloud", short: "Deployment, migration and monitoring on AWS, Azure or Google Cloud." },
  {
    slug: "construction-technology",
    name: "Construction technology",
    group: "Construction",
    short: "Estimating, project controls and field software for builders.",
    isNew: true,
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
