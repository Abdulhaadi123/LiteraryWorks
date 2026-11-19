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
  badge?: string;
};

export const services: Service[] = [
  {
    slug: "ai-agents-automation",
    number: "01",
    eyebrow: "AUTONOMOUS OPERATIONS",
    title: "Enterprise AI Agents & Workflow Swarms",
    intro: "Eliminate repetitive manual overhead with governed, multi-agent AI systems built for mission-critical reliability.",
    detail: "We engineer production-grade AI agents that understand approved enterprise knowledge, execute across connected software stacks, and keep humans firmly in control for critical decision checkpoints. Built to handle complex multi-step workflows with deterministic accuracy, audit logs, and SOC2-ready governance.",
    deliverables: [
      "Workflow bottleneck discovery and automated efficiency modeling",
      "RAG-grounded task agents and multi-agent coordination swarms",
      "Bidirectional integrations with ERP, CRM, and internal databases",
      "Human-in-the-loop review queues, safety guardrails, and audit logging",
    ],
    idealFor: "US enterprises seeking to automate knowledge-heavy operations, client onboarding, and back-office pipelines.",
    icon: "⚡",
    badge: "Core AI",
  },
  {
    slug: "contech-built-environment",
    number: "02",
    eyebrow: "CONTECH & HEAVY ASSETS",
    title: "Construction Intelligence & Digital Twins",
    intro: "Modern software, automated takeoffs, and real-time coordination for commercial builders and engineering firms.",
    detail: "Bridging the gap between physical job sites and digital precision. We build specialized solutions for commercial contractors, developers, and engineering firms—from AI-assisted blueprint takeoffs and BIM schedule sync to submittal workflows, field-to-office dashboards, and equipment telematics.",
    deliverables: [
      "AI-driven blueprint parsing, automated takeoffs, and cost-variance modeling",
      "BIM and CAD data pipelines with real-time jobsite schedule tracking",
      "Submittal, RFI, and change-order automated routing and risk flagging",
      "Field mobile applications with offline-first synchronization",
    ],
    idealFor: "General contractors, commercial builders, specialty trades, AEC firms, and real estate developers.",
    icon: "🏗️",
    badge: "Industry Focus",
  },
  {
    slug: "custom-software-saas",
    number: "03",
    eyebrow: "SCALABLE PLATFORMS",
    title: "Custom Software & Cloud SaaS Platforms",
    intro: "Replace fragile spreadsheets and disjointed tools with high-concurrency, purpose-built cloud platforms.",
    detail: "When off-the-shelf software restricts your competitive edge, we architect tailored digital platforms engineered around your exact operational logic. From customer-facing SaaS products to high-security internal portals, our systems scale effortlessly under demanding enterprise workloads.",
    deliverables: [
      "Product architecture, UX design systems, and rapid prototyping",
      "High-performance Next.js and Node/Python cloud applications",
      "Multi-tenant architectures, role-based access control (RBAC), and billing",
      "Automated CI/CD pipelines, unit/integration testing, and SLA monitoring",
    ],
    idealFor: "Enterprises scaling bespoke workflows and venture-backed founders launching category-defining platforms.",
    icon: "⌘",
    badge: "Engineering",
  },
  {
    slug: "enterprise-ai-integrations",
    number: "04",
    eyebrow: "ECOSYSTEM CONNECTIVITY",
    title: "Legacy Systems Integration & API Pipelines",
    intro: "Unify siloed enterprise software, ERPs, and databases into a synchronized, intelligent data pipeline.",
    detail: "Crucial business intelligence is often trapped in disconnected databases, legacy systems, and legacy desktop applications. We engineer robust, event-driven integration layers that connect modern AI capabilities directly into Procore, Autodesk, Salesforce, SAP, Oracle, and custom SQL backends.",
    deliverables: [
      "Secure REST and GraphQL API gateways with real-time webhooks",
      "Bi-directional synchronization between legacy on-prem and cloud systems",
      "Data ingestion pipelines with schema validation and automated cleansing",
      "Encrypted data-at-rest and in-transit with comprehensive access logs",
    ],
    idealFor: "Organizations operating across fragmented ERP, CRM, document storage, and proprietary databases.",
    icon: "⬡",
    badge: "Integration",
  },
  {
    slug: "cloud-platform-engineering",
    number: "05",
    eyebrow: "INFRASTRUCTURE & SECURITY",
    title: "Cloud Infrastructure & Edge Systems",
    intro: "Resilient cloud architecture designed for 99.99% uptime, strict compliance, and predictable operating costs.",
    detail: "World-class software demands an unshakeable foundation. We architect and maintain AWS, Azure, and Google Cloud environments built for extreme fault tolerance, zero-downtime rolling deployments, automated disaster recovery, and strict US regulatory compliance.",
    deliverables: [
      "Infrastructure as Code (Terraform/Pulumi) and automated container orchestration",
      "Zero-trust security perimeters, IAM hardening, and SOC2/HIPAA compliance",
      "Real-time telemetry, APM monitoring, and automated incident recovery",
      "FinOps optimization to eliminate cloud infrastructure waste",
    ],
    idealFor: "Companies needing hardened cloud environments, high availability, and airtight enterprise security.",
    icon: "☁️",
    badge: "Cloud / DevOps",
  },
  {
    slug: "ai-strategy-advisory",
    number: "06",
    eyebrow: "STRATEGIC ROADMAPS",
    title: "Technical AI Audits & Executive Roadmaps",
    intro: "Validate feasibility, quantify ROI, and chart an accountable technical roadmap before writing a single line of code.",
    detail: "Avoid expensive false starts and speculative tech experiments. Our technical advisory team conducts rigorous operational audits, identifying the exact bottlenecks where AI and automation deliver immediate margin expansion and measurable operational velocity.",
    deliverables: [
      "End-to-end operational audit and high-friction process mapping",
      "Technical feasibility matrix and quantitative ROI estimation",
      "Data readiness assessment, governance protocol, and risk profiling",
      "Step-by-step phased execution blueprint with milestones and budget models",
    ],
    idealFor: "CEOs, CTOs, and Operations Executives preparing for strategic digital and AI modernization.",
    icon: "◎",
    badge: "Strategy",
  },
];

export const industries = [
  {
    number: "01",
    name: "Commercial Construction & AEC",
    detail: "BIM integration, automated takeoffs, field reporting, submittal workflows, and clash detection.",
    tag: "High Volume",
  },
  {
    number: "02",
    name: "Heavy Industry & Supply Chain",
    detail: "Fleet telematics, inventory optimization, equipment predictive maintenance, and dispatch routing.",
    tag: "Operational",
  },
  {
    number: "03",
    name: "Real Estate & Asset Management",
    detail: "Lease document extraction, tenant portals, portfolio financial modeling, and facility digital twins.",
    tag: "Commercial",
  },
  {
    number: "04",
    name: "Financial Services & Private Equity",
    detail: "Deal flow automation, due-diligence data rooms, compliance audits, and portfolio telemetry.",
    tag: "Security-Critical",
  },
  {
    number: "05",
    name: "Healthcare & Life Sciences",
    detail: "HIPAA-compliant document intelligence, clinical encounter automation, and operational dashboards.",
    tag: "Compliance",
  },
  {
    number: "06",
    name: "Enterprise Tech & Scale-ups",
    detail: "Multi-tenant SaaS architecture, high-concurrency APIs, AI feature integration, and modern cloud DevOps.",
    tag: "High Growth",
  },
];

export const approach = [
  {
    number: "01",
    phase: "Discovery",
    title: "Architectural Diagnosis",
    detail: "We audit your operational reality, shadow workflows, and pinpoint exact points of data friction and manual waste.",
  },
  {
    number: "02",
    phase: "Design",
    title: "Systems Blueprinting",
    detail: "We define precise technical architecture, data schemas, security perimeters, and measurable KPI benchmarks.",
  },
  {
    number: "03",
    phase: "Execution",
    title: "Precision Engineering",
    detail: "We build and deploy production-ready systems in tight, milestone-driven sprints with continuous verification.",
  },
  {
    number: "04",
    phase: "Scale",
    title: "Governance & Scaling",
    detail: "We institute automated monitoring, human-in-the-loop oversight, team onboarding, and continuous optimization.",
  },
];

export const metrics = [
  { value: "$1.8B+", label: "Capital & Project Flow", note: "Supported across enterprise clients" },
  { value: "42%", label: "Cycle Time Reduction", note: "Average operational velocity increase" },
  { value: "99.98%", label: "System Availability", note: "Enterprise cloud SLA benchmark" },
  { value: "100%", label: "US Market Focus", note: "Engineered to US regulatory & security standards" },
];
