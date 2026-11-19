export type Service = {
  slug: string;
  number: string;
  eyebrow: string;
  title: string;
  intro: string;
  detail: string;
  deliverables: string[];
  idealFor: string;
  icon: string;
};

export const services: Service[] = [
  {
    slug: "ai-agents-automation",
    number: "01",
    eyebrow: "INTELLIGENT SYSTEMS",
    title: "AI Agents & Automation",
    intro: "Put intelligent workflows to work across the repetitive and the complex.",
    detail: "From internal copilots to task-focused AI agents, we design systems that connect to your tools, respect your data, and keep people in control of consequential decisions.",
    deliverables: ["Workflow discovery and automation maps", "Knowledge-grounded assistants and agent workflows", "Human approval steps, logs and quality controls", "Integration with your existing business systems"],
    idealFor: "Operations, support, finance and teams with high-volume processes",
    icon: "✳"
  },
  {
    slug: "custom-software-saas",
    number: "02",
    eyebrow: "PRODUCT ENGINEERING",
    title: "Custom Software & SaaS",
    intro: "Software built around the way your business actually works.",
    detail: "We help shape, architect and deliver custom platforms: customer portals, operational dashboards, multi-tenant products and complex internal applications.",
    deliverables: ["Product strategy and technical discovery", "API-first web platforms and SaaS applications", "Authentication, roles and organization workspaces", "Testing, deployment and iterative delivery"],
    idealFor: "Founders, growth companies and established organizations",
    icon: "⌘"
  },
  {
    slug: "enterprise-ai-integrations",
    number: "03",
    eyebrow: "CONNECTED ENTERPRISE",
    title: "Enterprise AI & Integrations",
    intro: "Bring your data, software and teams into one coherent system.",
    detail: "Unlock useful intelligence from disconnected tools through thoughtful integration, secure data access and clear operational guardrails.",
    deliverables: ["API integrations and workflow orchestration", "Search and retrieval across approved knowledge", "Data pipelines and permission-aware information access", "Monitoring, evaluation and operational handover"],
    idealFor: "Teams operating across CRMs, ERPs, databases and legacy applications",
    icon: "◇"
  },
  {
    slug: "cloud-platform-engineering",
    number: "04",
    eyebrow: "FOUNDATIONS THAT SCALE",
    title: "Cloud & Platform Engineering",
    intro: "Reliable infrastructure underneath your next move.",
    detail: "We design cloud-native foundations, modernize existing deployments and put observability, security and maintainability at the center of platform decisions.",
    deliverables: ["Cloud architecture and migration planning", "CI/CD and environment automation", "Monitoring, reliability and cost visibility", "Security-minded deployment patterns"],
    idealFor: "Teams preparing for growth, modernization or operational resilience",
    icon: "▧"
  },
  {
    slug: "web-mobile-experiences",
    number: "05",
    eyebrow: "DIGITAL EXPERIENCES",
    title: "Web & Mobile Experiences",
    intro: "Experiences that feel effortless and perform under pressure.",
    detail: "From polished customer-facing websites to intuitive apps and internal interfaces, we combine thoughtful design with resilient front-end engineering.",
    deliverables: ["UX strategy, wireframes and design systems", "Responsive websites and web applications", "Mobile application interfaces and back-end integration", "Accessibility and performance optimization"],
    idealFor: "Brands and businesses that value clarity, usability and conversion",
    icon: "↗"
  },
  {
    slug: "ai-strategy-advisory",
    number: "06",
    eyebrow: "FROM POSSIBILITY TO PLAN",
    title: "AI Strategy & Advisory",
    intro: "Find the right use case before investing in the wrong technology.",
    detail: "We assess business workflows, identify high-value opportunities and turn uncertainty into a practical, accountable technology roadmap.",
    deliverables: ["AI readiness and workflow assessments", "Opportunity and risk prioritization", "Architecture and implementation roadmaps", "Prototype definition and measurable success criteria"],
    idealFor: "Decision-makers exploring AI with a focus on tangible outcomes",
    icon: "◎"
  }
];

export const industries = [
  { number: "01", name: "Professional services", detail: "Knowledge workflows, client portals and operations automation." },
  { number: "02", name: "Healthcare & wellness", detail: "Thoughtful software experiences and human-centered automation." },
  { number: "03", name: "Logistics & operations", detail: "Connected workflows, visibility, dashboards and optimization." },
  { number: "04", name: "Real estate & construction", detail: "Project software, documents, estimating and delivery coordination." },
  { number: "05", name: "Retail & customer experience", detail: "Smarter service journeys and connected digital channels." },
  { number: "06", name: "SaaS & emerging ventures", detail: "Launch-ready foundations and scalable product engineering." }
];

export const approach = [
  { number: "01", title: "Understand", detail: "We start with your business problem, the people it affects, and the outcome that matters." },
  { number: "02", title: "Architect", detail: "We define a clear scope, responsible data flows, design choices and delivery milestones." },
  { number: "03", title: "Build", detail: "We deliver in focused increments, validate with users, and keep decisions visible." },
  { number: "04", title: "Evolve", detail: "We measure what works, support adoption and improve the system as needs grow." }
];
