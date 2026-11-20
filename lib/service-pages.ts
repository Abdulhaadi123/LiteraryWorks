export interface ServicePage {
  summary: string;
  features: string[];
  outcomes: string[];
  useCases: string[];
  problems: string[];
  steps: { title: string; text: string }[];
}

/** The detail of each service, keyed by the slugs in lib/services.ts. */
export const servicePages: Record<string, ServicePage> = {
  "ai-automation": {
    summary:
      "We design automations and AI agents around the work your team repeats every day: sorting inbound documents and email, keeping records in sync, answering routine questions, chasing follow-ups. People stay in charge of the decisions that matter. The system handles the handling.",
    features: [
      "Workflow automation across your tools",
      "AI agents grounded in your documents and data",
      "Document processing and data extraction",
      "Conversational assistants with a clean handoff to a person",
      "Machine-learning models for prediction and classification",
      "Rule-based automation where AI is not needed",
    ],
    outcomes: ["Less manual work", "Faster turnaround on routine requests", "Fewer errors from retyping", "Clearer decisions from structured data", "Capacity that grows without hiring in step"],
    useCases: ["Customer-support triage and replies", "HR, payroll and recruiting steps", "Invoice and document intake", "Sales follow-up and lead routing", "Inventory and supply-chain alerts"],
    problems: ["Manual processes slowing growth", "Disconnected systems and silos", "No clear direction on where AI helps"],
    steps: [
      { title: "Workflow analysis", text: "We map current processes and find what is worth automating." },
      { title: "Tool selection", text: "We choose the right models and tools for each task." },
      { title: "Integration build", text: "We connect them to the systems you already run." },
      { title: "Pilot", text: "A controlled pilot proves value and adoption before we scale." },
      { title: "Scale and maintain", text: "We roll out across the organization with ongoing support." },
    ],
  },
  "ai-voice-systems": {
    summary:
      "Voice agents that answer and place calls in natural language: scheduling, FAQs, routing and follow-up, with a handoff to your team whenever a person is needed.",
    features: [
      "Natural language understanding",
      "Multi-language voice support",
      "Real-time sentiment analysis",
      "Intelligent call routing",
      "CRM and helpdesk integration",
      "Call analytics and transcription",
    ],
    outcomes: ["Calls answered at any hour", "Faster, more consistent service", "Leads captured and qualified in the moment", "A lower cost per conversation", "A team free for the calls that need a person"],
    useCases: ["Appointment scheduling", "Customer support and FAQs", "Outbound notifications and reminders", "Lead follow-up", "Multi-language service"],
    problems: ["High call volumes overwhelming the team", "Inconsistent service quality", "The cost of a call center"],
    steps: [
      { title: "Voice audit", text: "We analyze call patterns, volumes and the questions people ask most." },
      { title: "Conversation design", text: "We script natural dialog flows and the edge cases." },
      { title: "Training", text: "We train the model on your terminology and intents." },
      { title: "Integration", text: "We connect it to your telephony, CRM and support tools." },
      { title: "Go live and optimize", text: "We launch with live monitoring and keep improving." },
    ],
  },
  "saas-platforms": {
    summary:
      "We design and build SaaS products that scale: multi-tenant architecture, subscriptions and billing, secure sign-in and analytics, from first release through growth.",
    features: [
      "Multi-tenant architecture",
      "Cloud deployment and scaling",
      "Secure authentication and data protection",
      "Subscription, billing and user management",
      "Real-time analytics and reporting",
      "APIs for partners and integrations",
    ],
    outcomes: ["A faster path to market", "Lower infrastructure overhead", "A product that grows with its users", "Reliable access from anywhere", "A foundation you own"],
    useCases: ["Subscription products for any industry", "Cloud-hosted business applications", "Customer management and engagement", "Analytics dashboards and reporting", "Automated billing and payments"],
    problems: ["An idea that needs a first release, fast", "A product outgrowing its first build", "No billing or customer management yet"],
    steps: [
      { title: "Discovery", text: "We define users, flows and what the first release must do." },
      { title: "Architecture", text: "We design for security, scale and the way you will charge." },
      { title: "Agile build", text: "Short sprints with regular demos and your feedback." },
      { title: "Testing and QA", text: "Automated and manual testing across the scenarios that matter." },
      { title: "Launch and support", text: "We go live with monitoring and stay on for what comes next." },
    ],
  },
  "enterprise-software": {
    summary:
      "Custom internal systems, portals and assistants built around how your organization actually works, and connected to the systems you already own.",
    features: [
      "Custom software built around your processes",
      "Internal portals, dashboards and approvals",
      "Enterprise AI tools: document processing, search and internal assistants",
      "Integration with ERP, CRM and third-party tools",
      "Cloud or on-premises deployment",
      "Access control by role",
    ],
    outcomes: ["Fewer manual handoffs", "One place for the information teams need", "Real-time visibility for decisions", "Software that fits, not the other way round", "Lower running costs over time"],
    useCases: ["HR, payroll and employee management", "Supply chain and inventory", "Customer relationship management", "Finance and accounting integrations", "Project management and collaboration"],
    problems: ["Legacy systems slowing operations", "Off-the-shelf tools that do not fit", "Information locked in documents and spreadsheets"],
    steps: [
      { title: "Requirements discovery", text: "We map workflows, pain points and the measures of success." },
      { title: "Architecture design", text: "We plan the system for scale, security and performance." },
      { title: "Agile development", text: "Iterative sprints with regular demos and stakeholder feedback." },
      { title: "Testing and QA", text: "Automated and manual testing for reliability." },
      { title: "Deployment and support", text: "A calm launch with monitoring, tuning and ongoing support." },
    ],
  },
  "ai-web-apps": {
    summary:
      "Web applications with machine learning built into the workflow: predictions, document understanding, recommendations and dashboards that help people decide faster.",
    features: [
      "Machine-learning model integration",
      "Natural language processing",
      "Real-time predictive analytics",
      "Automated data pipelines",
      "Interactive dashboards and visualizations",
      "Recommendation engines that learn from use",
    ],
    outcomes: ["More engaged users", "Less manual work through automation", "Decisions backed by data", "An application ready to grow", "Fewer errors and more accuracy"],
    useCases: ["Predictive analytics", "Document processing with NLP", "Automated reporting", "Customer engagement", "Personalized recommendations"],
    problems: ["Manual data analysis taking hours", "Patterns missed in large datasets", "Slow response to the market"],
    steps: [
      { title: "Data assessment", text: "We evaluate your data and find the highest-impact opportunities." },
      { title: "Model prototyping", text: "We prototype and validate models on your real data." },
      { title: "Application build", text: "We put validated models into a production-ready web application." },
      { title: "Training and tuning", text: "We fine-tune the models and train your team." },
      { title: "Monitor and iterate", text: "We watch performance and improve it over time." },
    ],
  },
  "ai-mobile-apps": {
    summary:
      "iOS and Android apps with AI features that adapt to the people using them: assistants, personalization, offline-first workflows and secure sign-in.",
    features: [
      "Cross-platform apps for iOS and Android",
      "Native performance and feel",
      "Offline-first architecture",
      "Push notifications and real-time sync",
      "Biometric authentication",
      "Launch support for the app stores",
    ],
    outcomes: ["More engaged users", "Automated mobile workflows", "Insight on the go", "Secure, scalable apps", "Less manual effort and fewer errors"],
    useCases: ["Field service management", "Patient and customer engagement", "Mobile commerce", "Logistics tracking", "Intelligent virtual assistants"],
    problems: ["A fragmented mobile experience", "Poor app performance", "No mobile tools for the business"],
    steps: [
      { title: "UX research", text: "We map user journeys and design mobile-first." },
      { title: "Prototype and validate", text: "Interactive prototypes tested with real users before development." },
      { title: "Cross-platform build", text: "One codebase with native quality on both platforms." },
      { title: "Beta testing", text: "Internal and external betas refine the experience." },
      { title: "Launch and iterate", text: "Store submission, monitoring and feature iteration." },
    ],
  },
  "ui-ux-design": {
    summary:
      "We turn complex ideas into interfaces people understand the first time: research, flows, prototypes and tested screens, designed for web and mobile.",
    features: [
      "User research and personas",
      "Wireframes and prototypes",
      "Interactive UI design",
      "Responsive design for every device",
      "Usability testing and optimization",
      "Design systems your team can extend",
    ],
    outcomes: ["Higher engagement and satisfaction", "Better conversion and retention", "Streamlined user workflows", "Consistent, modern visual design"],
    useCases: ["Website and app redesign", "Enterprise software UX", "E-commerce optimization", "SaaS product design"],
    problems: ["Confusing screens", "Inconsistent design across the product", "Low adoption of tools people were given"],
    steps: [
      { title: "Research", text: "We learn who uses the product and what they are trying to do." },
      { title: "Flows and wireframes", text: "We sketch the journeys and the structure of each screen." },
      { title: "Visual design", text: "We design clear, accessible, on-brand interfaces." },
      { title: "Prototype and test", text: "We test with real people and refine." },
      { title: "Handoff", text: "Specs and a design system your engineers can build from." },
    ],
  },
  "cloud-devops": {
    summary:
      "We deploy and run your applications and AI systems on AWS, Azure or Google Cloud, migrate the systems you already have, and keep them monitored and maintained after launch.",
    features: [
      "Cloud deployment and hosting",
      "CI/CD and containerized builds",
      "Monitoring, alerting and maintenance",
      "Security and access control",
      "Migration of applications, databases and between clouds",
      "Hosting for AI workloads: language models, vector databases, voice services",
    ],
    outcomes: ["Repeatable, safer releases", "Lower risk when you move systems", "Cost and performance you can see", "A system you own, in your own cloud account", "A documented handover"],
    useCases: ["Moving on-premises systems to the cloud", "Moving between cloud providers", "Hosting an AI application", "Setting up CI/CD and monitoring", "A cloud cost and security review"],
    problems: ["Aging servers and legacy hosting", "Slow or risky releases", "No visibility into cost or uptime"],
    steps: [
      { title: "Assess and inventory", text: "We map applications, databases, dependencies and constraints." },
      { title: "Architect", text: "We design the target architecture, access model and security plan." },
      { title: "Deploy and harden", text: "CI/CD, staged environments, load testing and access review." },
      { title: "Migrate and validate", text: "Where you are moving a system: staged moves, tested against the source, with a rollback plan." },
      { title: "Operate and support", text: "Monitoring, maintenance, documentation and team training." },
    ],
  },
  "construction-technology": {
    summary:
      "Software, data and automation for builders, developers and owners, from estimate to handover. We bring the same method we use everywhere else: map the work, design the system, build it into the tools the team already uses.",
    features: [
      "AI-assisted takeoff and estimating support",
      "Project controls: schedule, cost and progress reporting",
      "Document workflows for RFIs, submittals and change orders",
      "Field apps for crews, with offline-first sync",
      "Site photo and drawing analysis for progress and safety",
      "Owner and client portals with live reporting",
    ],
    outcomes: ["Fewer manual handoffs between site and office", "Problems caught earlier", "Clearer reporting for owners and partners", "Less time lost searching for documents", "Estimates built on faster, better data"],
    useCases: ["General contractors and commercial builders", "Specialty trades", "Developers and owners", "Engineering and architecture firms"],
    problems: ["Site and office running on different information", "Document chasing and slow approvals", "Cost and schedule drift found too late"],
    steps: [
      { title: "Workflow analysis", text: "We follow a job from estimate to handover and find where information gets stuck." },
      { title: "System design", text: "We design the smallest system that removes the worst handoffs." },
      { title: "Build and integrate", text: "We connect it to the tools your teams already use on site and in the office." },
      { title: "Pilot on one project", text: "We prove it on a live job before it goes wider." },
      { title: "Roll out and support", text: "We extend it across projects and keep it running." },
    ],
  },
};
