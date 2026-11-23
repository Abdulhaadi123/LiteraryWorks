/* The words of the site, in one place. Written for LiteraryWorks from the services and work of the Sparkix and FAYD teams. */

export interface Metric {
  value: string;
  label: string;
}

export interface Quote {
  text: string;
  name: string;
  role: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  tags: string[];
  summary: string;
  problem: string[];
  before: string[];
  solution: string[];
  built: string[];
  results: Metric[];
  timeline: string;
  tech: string[];
  quote?: Quote;
}

export const cases: CaseStudy[] = [
  {
    slug: "ai-medical-scribe",
    title: "An AI medical scribe for clinical documentation",
    client: "Cordial Health",
    tags: ["Healthcare", "AI documentation", "Billing"],
    summary:
      "A secure platform that turns provider and patient conversations into structured notes, suggests billing codes, and keeps encounters, reports and approvals in one place.",
    problem: [
      "Providers spend a large share of every visit on notes, billing codes and reports. The work is slow, uneven from one provider to the next, and a steady source of burnout.",
      "The client needed documentation that was faster without ever replacing clinical judgment.",
    ],
    before: [
      "Notes written by hand after each visit",
      "Billing codes chosen from the note, then billing records prepared separately",
      "Administrators reviewing provider activity manually",
    ],
    solution: [
      "We built the platform around the provider's time, not around the software. It listens to the conversation, drafts the structured note, suggests codes with the reasoning visible, and leaves every decision with the clinician.",
      "It connects to the tools the practice already used, including its CRM.",
    ],
    built: [
      "Real-time transcription of the visit",
      "Structured SOAP note generation",
      "AI-assisted CPT code suggestions",
      "Encounter management",
      "Provider and administrator dashboards",
      "Billing preparation and reporting",
      "Role-based permissions and secure sign-in",
      "Workflow automation and Zoho CRM integration",
      "Cloud hosting on AWS",
    ],
    results: [
      { value: "70%", label: "less time spent on documentation" },
      { value: "80%", label: "faster billing preparation" },
      { value: "100%", label: "digital encounter management" },
      { value: "24/7", label: "AI documentation assistance" },
    ],
    timeline: "3 months",
    tech: ["OpenAI", "Whisper speech-to-text", "GPT-5", "Next.js", "PostgreSQL", "Node.js", "AWS", "Zoho CRM", "REST APIs", "JWT authentication"],
    quote: {
      text: "Excellent job on Phase 3 of our project. They were responsive, easy to work with, and delivered the requested functionality while being receptive to feedback and revisions. The project is progressing well, and we appreciate their commitment to making improvements along the way. We look forward to continuing our work together on future phases.",
      name: "Mordy S.",
      role: "Director of Operations, Cordial Health",
    },
  },
  {
    slug: "ai-voice-system",
    title: "An AI voice system for customer conversations",
    client: "A growing service business",
    tags: ["Customer support", "Sales automation", "Voice AI"],
    summary:
      "AI agents that answer calls, follow up and capture leads around the clock, so the team spends its time on the conversations that need a person.",
    problem: [
      "A growing service business was handling every call, follow-up and lead reply by hand. As volume rose, answers slowed, leads were missed and the customer experience became uneven.",
      "They knew automation could help but had no clear way to start.",
    ],
    before: [
      "Calls handled one by one by the team",
      "Follow-ups left to memory or basic reminders",
      "No structured record of conversations",
      "Leads delayed or lost at busy times",
      "Growth meant hiring more people",
    ],
    solution: [
      "We began with an audit of how calls and follow-ups actually flowed, then designed a system where AI handles the repetitive conversations and the team handles the ones that matter.",
      "The aim was simple: automate the conversations without losing the human touch.",
    ],
    built: [
      "AI agents for inbound and outbound calls",
      "Automated follow-ups by call and SMS",
      "Real-time lead capture and qualification",
      "CRM integration, so every conversation is recorded",
      "Multi-language, configurable conversation flows",
      "24/7 availability",
    ],
    results: [
      { value: "70%", label: "less manual call handling" },
      { value: "3×", label: "faster response" },
      { value: "24/7", label: "customer availability" },
      { value: "+40%", label: "qualified leads captured" },
    ],
    timeline: "6 weeks",
    tech: ["OpenAI", "Twilio voice", "Node.js and Python", "CRM integrations (HubSpot, Salesforce or custom APIs)", "AWS"],
  },
  {
    slug: "ai-sales-coaching",
    title: "An AI sales coach that turns expertise into a product",
    client: "A Washington-based sales training company",
    tags: ["Sales training", "Coaching", "AI SaaS"],
    summary:
      "A sales expert's methods and voice, turned into an AI coach that teams can practice with at any hour, and that the company now sells as a digital product.",
    problem: [
      "The company's revenue was tied to the hours of its trainers. Demand was strong, but every new client meant more live sessions and more trainers.",
      "Their knowledge was valuable and hard to scale.",
    ],
    before: [
      "Live workshops and coaching programs",
      "Static videos, PDFs and frameworks",
      "Little real-time practice for learners",
      "Every engagement needed an expert in the room",
    ],
    solution: [
      "Instead of a generic chatbot, we built a system around their method: their frameworks and materials structured so an AI can use them, a real-time conversation engine for practice, and a cloned voice so the experience still sounds like their coach.",
    ],
    built: [
      "A real-time AI sales coach for practice conversations",
      "Voice cloning of the expert's delivery",
      "Objection handling grounded in the trained methodology",
      "A knowledge engine built on their own content",
      "A multi-tenant SaaS platform for companies",
      "An admin dashboard for users, sessions and performance",
    ],
    results: [
      { value: "300%+", label: "revenue potential" },
      { value: "24/7", label: "availability" },
      { value: "70%", label: "less reliance on live training" },
      { value: "5×", label: "client capacity without hiring" },
    ],
    timeline: "6 weeks",
    tech: ["OpenAI and Claude", "ElevenLabs voice cloning", "LangChain", "Pinecone", "Node.js and Python", "React", "AWS"],
  },
  {
    slug: "internal-ai-assistant",
    title: "A private AI assistant for enterprise operations",
    client: "An enterprise logistics company",
    tags: ["Logistics", "Internal operations", "Knowledge management"],
    summary:
      "An assistant that answers operational questions from the company's own documents and systems, hosted inside its own infrastructure.",
    problem: [
      "The answers existed, in SOPs, spreadsheets, dashboards and internal systems, but nobody could find them quickly. People waited for the right manager to be free.",
      "In logistics, that waiting costs time on every shipment.",
    ],
    before: [
      "SOPs and guidelines spread across documents and folders",
      "Operational data in separate dashboards and spreadsheets",
      "Employees relying on managers for routine answers",
      "Reports that needed manual lookups and handoffs",
    ],
    solution: [
      "We built a secure assistant trained on the company's own operational data and procedures, and deployed it entirely inside their private infrastructure.",
      "Instead of another search portal, it is a conversation: ask in plain language, get an accurate answer or report grounded in real company data and rules.",
    ],
    built: [
      "Natural-language Q&A over SOPs, guidelines and internal knowledge",
      "Instant access to shipment and performance information",
      "Report generation and decision support from company data",
      "Role-aware access for employees, managers and administrators",
      "Integration with internal systems and knowledge sources",
      "Hosting inside the client's own infrastructure",
    ],
    results: [
      { value: "Seconds", label: "to get an operational answer" },
      { value: "70%", label: "less dependence on key people" },
      { value: "100%", label: "of data kept inside the client's infrastructure" },
      { value: "24/7", label: "knowledge available to teams" },
    ],
    timeline: "6 weeks",
    tech: ["LLM retrieval (OpenAI)", "Vector search and RAG", "Node.js and Python", "React", "Private cloud or on-premises hosting", "Role-based access control"],
    quote: {
      text: "The internal AI assistant has changed how our teams get answers. Information that used to take emails and escalations now comes back in seconds, and knowing everything stays inside our own infrastructure gave us full confidence. Strong technical delivery and clear communication throughout.",
      name: "Operations leadership",
      role: "Enterprise logistics client",
    },
  },
  {
    slug: "predictive-maintenance",
    title: "Predictive maintenance for refrigerated warehouses",
    client: "A mid-sized food distributor",
    tags: ["Food distribution", "Cold chain", "Industrial IoT"],
    summary:
      "Sensors and a failure-prediction model that flag compressor problems weeks ahead and send the alert straight into the team's work-order system.",
    problem: [
      "A distributor with 12 refrigerated warehouses lost stock to compressor failures and paid for emergency call-outs. Each site saw roughly three to four unplanned breakdowns a year.",
      "Failures were reactive. The team found out when temperatures drifted or product spoiled.",
    ],
    before: [
      "Compressors ran until they failed or drifted out of range",
      "Maintenance logs existed but were not used for prediction",
      "No continuous vibration, temperature or power monitoring",
      "Alerts, where they existed, did not reach the tools technicians used",
    ],
    solution: [
      "We proposed a small pilot: two sites, one asset type. Anomaly detection first learned each compressor's normal behavior. Then a simple failure-prediction model scored risk, for example bearing wear likely within two to three weeks, and alerts flowed into the existing work-order system.",
      "We planned for real-world data access, kept access read-only, and raised operational-technology security constraints early. False alarms were tracked honestly, two in the first month, and reduced by tuning thresholds.",
    ],
    built: [
      "Vibration, temperature and power-draw sensors on each compressor",
      "Local gateways sending readings every 10 seconds to a cloud dashboard",
      "Six months of maintenance logs as a baseline",
      "Time-series storage with cleaned, aligned data",
      "Anomaly detection and failure-prediction models",
      "Risk-scored alerts pushed into work orders",
      "An operations dashboard for maintenance visibility",
    ],
    results: [
      { value: "~40%", label: "fewer unplanned breakdowns (pilot)" },
      { value: "2 sites", label: "pilot scope" },
      { value: "2–3 weeks", label: "failure warning window" },
      { value: "10 sec", label: "sensor sampling interval" },
    ],
    timeline: "3-month pilot",
    tech: ["IoT sensors", "Local gateway and cloud dashboard", "Time-series database", "Anomaly detection and failure prediction", "Azure IoT or AWS IoT", "MQTT and Kafka", "OPC UA and Modbus", "Work-order system integration"],
    quote: {
      text: "Starting with two sites and one asset type made the pilot believable for our technicians. The alerts landing in our existing work order system was the difference — and being honest about the early false alarms helped the team trust the model once thresholds were tuned.",
      name: "Maintenance lead",
      role: "Mid-sized food distributor",
    },
  },
  {
    slug: "fleet-logistics-platform",
    title: "A fleet and fuel operations platform",
    client: "Kalibur Resources",
    tags: ["Fuel distribution", "Logistics", "Fleet operations"],
    summary:
      "One platform for store locations, fleet, drivers, fuel volumes and weekly and monthly reporting, for clients and partners.",
    problem: [
      "The data existed, in spreadsheets, internal tools and manual updates, but clients and partners could not see it consistently.",
      "Without one surface, nobody had a clear picture of store coverage, fleet status, driver activity or reporting.",
    ],
    before: [
      "Store and location information hard to present clearly",
      "No central view of fleet and driver activity",
      "Fuel volumes and operational metrics tracked separately",
      "Weekly and monthly reports prepared by hand",
    ],
    solution: [
      "Instead of a generic corporate website, we built a platform that shows real operational capability and doubles as a daily window into performance for clients, partners and internal teams.",
    ],
    built: [
      "Services overview for fuel and logistics",
      "Store location directory and coverage views",
      "Fleet tracking views",
      "Driver management overview",
      "Fuel volume and operational insights",
      "Weekly and monthly reporting",
      "A client and partner information hub",
    ],
    results: [
      { value: "1 platform", label: "for operational visibility" },
      { value: "Real-time", label: "access to fleet and store data" },
      { value: "60%", label: "fewer manual report handoffs" },
      { value: "24/7", label: "self-serve insights for clients and partners" },
    ],
    timeline: "4 weeks",
    tech: ["React and Next.js", "TypeScript", "Tailwind CSS", "Node.js", "REST APIs", "Cloud hosting", "Analytics and reporting dashboards"],
    quote: {
      text: "We had a wonderful experience working this amazing company. Even though we're in the US but the remote collaboration was top-notch in automating our internal workflows with AI. They built an amazing platform to automate the process. Great AI company to work with.",
      name: "Kelsy L.",
      role: "Director of Operational Excellence, RelaDyne LLC",
    },
  },
];

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug);

/** What clients say on the home page: every quote from the case studies, the named clients first. */
export const voices: Quote[] = [
  cases[5].quote!,
  cases[0].quote!,
  cases[4].quote!,
  cases[3].quote!,
];

export interface Offer {
  tag: string;
  name: string;
  price: string;
  unit: string;
  note?: string;
  points: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

export const ladder: Offer[] = [
  {
    tag: "Start here",
    name: "Free AI audit",
    price: "Free",
    unit: "1-hour working session",
    points: [
      "A live walk-through of your workflows",
      "Where time and money are being lost",
      "One or two quick AI opportunities",
      "An honest view of whether AI is right for you",
    ],
    cta: { label: "Book the free audit", href: "/contact?topic=audit" },
  },
  {
    tag: "Most chosen",
    name: "AI audit",
    price: "$2,500",
    unit: "14-day engagement",
    note: "Credited toward the build if you go ahead with us.",
    points: [
      "A full workflow breakdown across operations",
      "An AI system architecture",
      "An ROI estimate for each opportunity",
      "A step-by-step implementation roadmap",
      "A final review session with your team",
    ],
    cta: { label: "Start the audit", href: "/contact?topic=audit" },
    featured: true,
  },
  {
    tag: "Build and run",
    name: "AI system implementation",
    price: "From $10,000",
    unit: "Fixed quote after the audit",
    points: [
      "Automations and AI agents built for your operations",
      "Integrated into the tools you already use",
      "Testing, deployment and team onboarding",
      "Ongoing monitoring and improvement",
      "Direct access to the people building it",
    ],
    cta: { label: "Scope your build", href: "/contact" },
  },
];

export const guarantee =
  "If the audit doesn't give you clarity on what to automate next, you don't pay. It is a 100% money-back guarantee.";

export interface PlanStep {
  days: string;
  title: string;
  text: string;
  gets: string[];
}

export const plan: PlanStep[] = [
  {
    days: "Day 1–2",
    title: "Workflow reality check",
    text: "We break down how your business actually runs: where time is spent, where work gets stuck, and where it is lost.",
    gets: ["A clear view of the bottlenecks", "The top time-wasting workflows, named"],
  },
  {
    days: "Day 3–5",
    title: "Process deep dive",
    text: "We map the key workflows step by step and find where automation makes sense.",
    gets: ["Step-by-step breakdowns of the high-impact workflows", "The exact points where work stalls"],
  },
  {
    days: "Day 6–8",
    title: "Opportunity identification",
    text: "We find where AI can realistically help, not where it only sounds good.",
    gets: ["Two or three high-impact AI opportunities", "Practical automation use cases"],
  },
  {
    days: "Day 9–11",
    title: "Prioritization and return",
    text: "We rank what to do first by impact, effort and business value.",
    gets: ["A ranked list of opportunities", "Priorities based on return"],
  },
  {
    days: "Day 12–14",
    title: "Execution roadmap",
    text: "We turn it all into a plan your team can follow, or that we can build.",
    gets: ["A step-by-step action plan", "A system architecture direction", "A final review session with your team"],
  },
];

export const problems = [
  { title: "Manual workflows slow everything down", text: "Repetitive tasks use up hours that should be running on their own." },
  { title: "Tools are disconnected and data is scattered", text: "Information sits in silos and never reaches the right place at the right time." },
  { title: "Teams spend time on low-value work", text: "People do admin instead of the decisions that move the business forward." },
];

export const faqs = [
  {
    q: "What happens in the free audit?",
    a: "We spend an hour together reviewing how your work flows, where time and money are being lost, and the one or two places where AI could help most. You leave knowing what to do next, whether or not you work with us.",
  },
  {
    q: "Is it a sales call?",
    a: "No. It is a working session. We recommend a paid engagement only when it clearly makes sense for your business, and some audits end without a project.",
  },
  {
    q: "What do I get in the $2,500 audit?",
    a: "A 14-day structured engagement: a full workflow breakdown, an AI system architecture, an ROI estimate and an implementation roadmap. If you build with us, the fee is credited toward the work.",
  },
  {
    q: "How is implementation priced?",
    a: "From $10,000, depending on scope, integrations and complexity. After the audit we give you a fixed quote, so there are no surprises.",
  },
  {
    q: "How long does a build take?",
    a: "Focused systems usually reach production in four to six weeks. Larger or multi-team projects are scoped separately after the audit.",
  },
  {
    q: "Who is this for?",
    a: "Founders and operators of established businesses with at least one repetitive, high-volume process that costs time. If you are pre-revenue, we are probably not the right fit yet.",
  },
];

export const industries = [
  { name: "Healthcare", text: "Patient flow, triage, clinical documentation and billing preparation." },
  { name: "Logistics and distribution", text: "Internal assistants, fleet and warehouse visibility, predictive maintenance." },
  { name: "Professional services", text: "Client intake, knowledge automation and AI-assisted research." },
  { name: "Real estate", text: "Lead intelligence, virtual assistants and automated property workflows." },
  { name: "E-commerce", text: "Personalization, demand forecasting and conversational commerce." },
  { name: "Construction", text: "Estimating support, project controls, document workflows and field apps." },
];

export const engagement = [
  { title: "Discover", text: "We immerse ourselves in your business, map the workflows and find the highest-impact opportunities." },
  { title: "Design", text: "We draw up a strategy and architecture that fits your goals, your systems and your constraints." },
  { title: "Deploy", text: "We build, integrate and launch the solution, with careful testing and change management." },
  { title: "Optimize", text: "We measure, refine and scale, turning early wins into lasting value." },
];

export const principles = [
  { title: "Clarity before code", text: "A plain-language plan comes first: what we will build, why it matters, what it will cost and how we will measure it." },
  { title: "Systems your team can own", text: "We favor practical systems your people can run over impressive demos that need us to keep them alive." },
  { title: "Outcomes, not hours", text: "Every decision starts from a result: hours returned, delays removed, decisions made sooner." },
  { title: "Honest scope", text: "If something is not worth building yet, we say so. A good audit sometimes ends with a smaller plan than you expected." },
];

export const moreBuilt = [
  { name: "Grace AI", text: "A voice-calling platform where businesses build, train and manage their own AI voice agents." },
  { name: "SIQETRA", text: "An AI business operating system: ask the business a question, approve every action before it happens." },
  { name: "Vyral AI", text: "Answers social media comments and direct messages in the brand's own voice." },
  { name: "Dr Scribe", text: "Generates SOAP notes for clinics from the visit." },
  { name: "Aztech AI", text: "An executive-search platform with AI-assisted sourcing, screening and evaluation." },
  { name: "Alltrials AI", text: "Question answering over complex clinical trial documents." },
  { name: "Vendibly", text: "Vendor, contract and procurement management in one place." },
  { name: "Card Grading AI", text: "Grades trading cards from photos, with visual markup of centering, edges and corners." },
  { name: "Civil Security", text: "A legal assistant trained on public legal data from all 50 U.S. states." },
  { name: "AI Language Tutor", text: "A voice-to-voice language-learning platform." },
  { name: "Monetiza", text: "A fintech app that recommends financial products and acts as a planning co-pilot." },
  { name: "OTA-GPT", text: "Automates guest messaging and bookings for online travel agencies." },
];

/** The four phases of an engagement in full: the goal, what we do and what you get. (The short form is `engagement`.) */
export interface Phase {
  n: string;
  title: string;
  goal: string;
  does: string[];
  gets: string[];
}

export const phases: Phase[] = [
  {
    n: "01",
    title: "Discover",
    goal: "Understand how the work really runs.",
    does: [
      "Talk to the people who do the work, not only the people who manage it",
      "Map each workflow step by step, with its handoffs",
      "Find where time, money and attention are lost",
      "Rank the opportunities by impact and effort",
    ],
    gets: ["A map of how your work really runs", "A ranked list of opportunities", "A plain-language plan, yours to keep"],
  },
  {
    n: "02",
    title: "Design",
    goal: "Decide what to build, and how it fits.",
    does: [
      "Choose what to automate and what to leave to people",
      "Draw the architecture around the tools you already use",
      "Design the interface with the people who will use it",
      "Agree the scope, the milestones and how success is measured",
    ],
    gets: ["System architecture and a clickable design", "A fixed scope and a fixed quote", "A delivery plan with milestones"],
  },
  {
    n: "03",
    title: "Deploy",
    goal: "Build it in small releases you can judge.",
    does: [
      "Build in short stages and show you each one",
      "Connect it to your data, your CRM and your tools",
      "Test with real cases, including the awkward ones",
      "Launch with training, monitoring and a way back",
    ],
    gets: ["Working software in your hands early", "Documentation your team can use", "A secure, monitored production system"],
  },
  {
    n: "04",
    title: "Optimize",
    goal: "Measure it, then make it better.",
    does: [
      "Track the results against the plan",
      "Watch what people really use, and what they skip",
      "Tune the models, the prompts and the workflows",
      "Add the next piece only when the last one has paid for itself",
    ],
    gets: ["A results report in plain language", "A backlog ranked by return", "Support from the people who built it"],
  },
];

/** What you leave the free hour with. */
export const auditOutputs = [
  { title: "Workflow review", text: "A walk through how your work really runs, step by step." },
  { title: "Inefficiency map", text: "Where time and money are being lost, named." },
  { title: "AI opportunities", text: "Two or three high-impact automations, with the reasoning." },
  { title: "Direction", text: "A clear next step, even if you do not work with us." },
];

/** How a project runs day to day (the about page). */
export const rhythm = [
  {
    icon: "clipboard" as const,
    title: "What we need from you",
    items: [
      "One person who can decide and answer questions",
      "A few hours with the people who do the work",
      "Access to the tools and data we will connect to",
      "Honest feedback after every release",
    ],
  },
  {
    icon: "package" as const,
    title: "What you get from us",
    items: [
      "A written plan before any build",
      "Working releases you can try, not slide decks",
      "Direct access to the people building it",
      "A documented handover, whether or not we stay on",
    ],
  },
  {
    icon: "book" as const,
    title: "How we communicate",
    items: [
      "Plain language in updates, proposals and invoices",
      "Decisions written down where everyone can find them",
      "Problems raised early, with options attached",
      "One place to see what is done and what is next",
    ],
  },
];

/** The case study that shows each service in practice (a service with no case study of its own is left out). */
export const caseForService: Record<string, string> = {
  "ai-automation": "internal-ai-assistant",
  "ai-voice-systems": "ai-voice-system",
  "saas-platforms": "ai-sales-coaching",
  "enterprise-software": "fleet-logistics-platform",
  "ai-web-apps": "ai-medical-scribe",
  "ui-ux-design": "ai-medical-scribe",
  "cloud-devops": "predictive-maintenance",
};

/** Everything the case studies were built with, once each. */
export const techUsed: string[] = [...new Set(cases.flatMap((c) => c.tech))];

/** The company behind the brand, and where it is (as the literaryworx.com site gives it: a city, no street address). */
export const company = {
  legalName: "Literary Worx LLC",
  email: "info@literaryworx.com",
};

export const location = {
  city: "San Antonio",
  region: "Texas",
  regionCode: "TX",
  country: "US",
  label: "San Antonio, Texas",
  mapEmbed: "https://www.google.com/maps?q=San+Antonio%2C+Texas&z=11&output=embed",
  mapLink: "https://www.google.com/maps/search/?api=1&query=San+Antonio%2C+Texas",
};
