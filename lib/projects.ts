import { projectImages } from "./project-images";

/**
 * The other products and platforms the team has built, each with a page of its own at /work/<slug>. The words are what
 * the team has published about each one (its portfolio pages), kept to the facts: no promotional calls to action, no
 * other company's name, no contact details. Where a page publishes nothing about a part (a challenge, a solution), the
 * part is left out, and the assistant is told that nothing more is known (lib/chat/knowledge.ts).
 */

export interface ProjectBlock {
  /** A small label above the title (the area of a product). */
  label?: string;
  title: string;
  text?: string;
  points?: string[];
  /** A short statement under the block (what it guarantees). */
  callout?: { title: string; text: string };
}

export interface ProjectSection {
  kicker: string;
  title: string;
  lead?: string;
  blocks: ProjectBlock[];
}

export interface Project {
  slug: string;
  name: string;
  /** What kind of thing it is, in a few words. */
  kind: string;
  tags: string[];
  /** The one line shown in the portfolio grid. */
  text: string;
  /** The opening sentence of its page and its description for search results. */
  summary: string;
  overview: string[];
  challenge?: string[];
  solution?: string[];
  /** Its features, where the page lists them. */
  features?: { title: string; text: string }[];
  /** A few facts at a glance. */
  glance?: { value: string; label: string }[];
  sections?: ProjectSection[];
  /** A closing statement about how to start, where the page has one. */
  closing?: { title: string; text: string };
  /** The name of its picture in the portfolio grid (public/shots/<shot>.webp). */
  shot: string;
}

export const projects: Project[] = [
  {
    slug: "grace-ai",
    name: "Grace AI",
    kind: "AI voice calling platform",
    tags: ["AI voice calling", "SaaS platform", "Voice agents", "CRM integration"],
    text: "A voice-calling platform where businesses build, train and manage their own AI voice agents.",
    summary: "A full-featured platform where businesses create, train and manage their own AI voice agents that handle real phone calls.",
    overview: [
      "We built Grace AI, a full-featured AI voice calling platform that allows businesses to create, train, and manage their own AI voice agents. These AI agents can handle real phone calls, speak naturally with customers, book appointments, collect leads, send SMS follow-ups, and sync data with CRM systems.",
      "The platform supports multiple voices, multiple languages, and business-specific training, making it suitable for sales, customer support, appointment booking, and follow-up automation. Each business can manage its AI agents, call flows, and integrations from a centralized dashboard.",
      "This project demonstrates our ability to build scalable, production-ready AI voice automation solutions for real business use cases.",
    ],
    challenge: [
      "The main challenge was building a reliable AI voice system that could handle real-time phone conversations while still sounding natural and human-like. The platform needed to support multiple businesses, each with their own AI agents, data, and call logic, without data mixing or performance issues. Managing low-latency speech processing, multiple languages, and different voice options at the same time added technical complexity. In addition, the system had to integrate smoothly with CRM tools, appointment booking, SMS follow-ups, and lead tracking, all while remaining scalable for both inbound and outbound calling use cases.",
    ],
    solution: [
      "We designed a modular and scalable AI voice architecture that isolates each business and its AI agents while sharing core infrastructure efficiently. Real-time speech-to-text and text-to-speech pipelines were implemented to ensure fast and natural conversations. Configurable call flows were added so businesses could define how their AI agents handle bookings, lead collection, and follow-ups. Support for multiple languages and voices was built into the system, along with CRM integration, call logging, and automated SMS workflows. The overall platform was optimized for stability, low latency, and commercial-scale usage.",
    ],
    shot: "grace",
  },
  {
    slug: "siqetra",
    name: "SIQETRA",
    kind: "AI business operating system",
    tags: ["Governed AI", "Business operations", "Unified inbox", "English and Arabic"],
    text: "An AI business operating system: ask the business a question, approve every action before it happens.",
    summary: "An AI business operating system that puts a company's customers, invoices, projects, conversations, people and databases behind one governed AI layer.",
    overview: [
      "We built SIQETRA, an AI business operating system that puts a company's customers, invoices, projects, conversations, people and databases behind one governed AI layer. Leaders can ask a question in plain language and get an answer with the records behind it, and the AI never changes anything until a person approves it.",
      "Each company works in its own private workspace with its own members, roles and connected accounts. The platform covers five areas: Workspace, Customer Engagement, People & Organization, Data Intelligence and Administration, from a daily AI briefing and a unified inbox for website chat, Messenger, Instagram and WhatsApp to recruitment, payroll, read-only database questions and AI usage budgets.",
      "Customer assistants work in English and Arabic. This project demonstrates our approach to AI that stays governed: grounded in real company records, transparent about its sources and always under human control.",
    ],
    glance: [
      { value: "5", label: "Product areas" },
      { value: "4", label: "Messaging channels" },
      { value: "EN + AR", label: "Assistant languages" },
      { value: "Read-only", label: "Database access" },
    ],
    challenge: [
      "The main challenge was making AI safe to use on real business data. Company information was scattered across spreadsheets, inboxes, HR files and databases, so answers took days, and generic AI tools could not be trusted with real records. The platform needed to ground every answer in a company's own data and show the evidence behind it, while keeping customer replies, record changes and hiring decisions under human control. It also had to keep each company's data separate, protect sensitive information such as payroll, and make AI usage and cost visible.",
    ],
    solution: [
      "We designed SIQETRA as a governed AI layer with one private workspace per company. AI answers only from the company's own records, published knowledge and read-only databases (PostgreSQL today), and shows the records or the read-only query behind every answer. In the default AI draft mode, no customer message is sent and no record is changed until a person approves it. Roles are enforced by the server and the database, payroll is calculated by fixed rules and never by AI, and recruitment screening is advisory only. Monthly workspace budgets and member limits, set in credits, keep AI usage and cost visible.",
    ],
    sections: [
      {
        kicker: "Inside SIQETRA",
        title: "Ask your business anything. Approve what happens next.",
        lead: "Your company at a glance, an AI you can question, and every follow-up with an owner. The screens on this page show the product layout with sample data.",
        blocks: [
          {
            label: "Company Overview",
            title: "The daily briefing for leadership",
            text: "A single landing page that summarises revenue, receivables, projects and customers from your own records, with an AI executive briefing on top.",
            points: [
              "AI executive briefing written from live company records",
              "Headline counts for customers, invoices and projects",
              "Six-month revenue trend with the current month highlighted",
              "One click into Business Records or a follow-up question to SIQETRA",
            ],
            callout: { title: "Grounded in your data", text: "The briefing only uses records stored in your workspace, so every statement can be traced back to a customer, invoice or project." },
          },
          {
            label: "AI Workspace",
            title: "Ask your business in plain language",
            text: "A conversational workspace that answers questions about your business records, shows the supporting records, and proposes actions for you to review.",
            points: [
              "Answers with tables and the exact records they came from",
              "Suggested actions, such as follow-up tasks, that wait for approval",
              "Private conversation history per user inside the workspace",
              "Auto, Eco, Balanced and Deep modes to trade speed against depth",
            ],
            callout: { title: "Human approval", text: "SIQETRA can suggest an action but nothing changes in your records until a person reviews and approves it." },
          },
          {
            label: "My Work",
            title: "Tasks with owners, dates and AI drafts",
            text: "A personal task workspace where tasks created by people, or drafted by SIQETRA and approved by a person, are tracked to completion.",
            points: [
              "Open, overdue, due today and AI-drafted counters",
              "Priority, owner, due date and origin on every task",
              "Filter by assignment, status, priority or origin",
              "Tasks created from AI suggestions are clearly labelled",
            ],
            callout: { title: "Accountability", text: "AI-drafted tasks are labelled as such, so your team always knows what a person created and what the AI proposed." },
          },
          {
            label: "Also in this area",
            title: "Business Records",
            text: "Customers, branches, projects, invoices and revenue, added manually or imported from CSV with a template. The single source of truth for the AI answers.",
          },
        ],
      },
      {
        kicker: "Trust",
        title: "Governance by design",
        lead: "SIQETRA is built for companies that want the benefit of AI without losing control.",
        blocks: [
          { title: "Human approval", text: "In the default AI draft mode, no customer message is sent and no record is changed until a person approves it." },
          { title: "Grounded answers", text: "Customer replies use published knowledge only. Drafts and customer messages are never treated as company knowledge." },
          { title: "Evidence on every answer", text: "Business answers list the records behind them. Database answers show the read-only query that produced them." },
          { title: "Read-only database access", text: "Company databases are connected read-only, with TLS required. You choose which tables the AI can see." },
          { title: "Roles enforced on the server", text: "Owner, Manager, HR and Employee roles are enforced by the server and the database on every request." },
          { title: "Payroll is never AI", text: "Pay is calculated by fixed rules in the database. Recruitment AI is advisory and every hiring decision is made by a person." },
          { title: "Usage budgets", text: "A monthly workspace budget and per-member limits stop uncontrolled AI spend. Credits are reserved before each question." },
          { title: "Privacy in the log", text: "Usage records keep the operation, size and cost. They do not store prompts or answers." },
          { title: "Separate workspaces", text: "Every company works in its own private workspace with its own members and its own connected business accounts." },
        ],
      },
      {
        kicker: "Delivery",
        title: "How we deliver SIQETRA",
        blocks: [
          { label: "01", title: "Discover", text: "Map your processes, records and databases. Agree the first use case and the success measure." },
          { label: "02", title: "Configure", text: "Set up the workspace, roles, channels and knowledge base. Import records from CSV." },
          { label: "03", title: "Connect", text: "Connect company data read-only. PostgreSQL is supported today. Other databases such as Oracle are scoped and confirmed during discovery." },
          { label: "04", title: "Pilot", text: "Run with one team on real data. Review answers, drafts and usage together." },
          { label: "05", title: "Scale and support", text: "Roll out across teams with long-term support and maintenance from our team." },
          { title: "What is included today", text: "Workspace, Customer Engagement, People and Payroll, Data Intelligence, AI usage budgets and Team access, as shown on this page." },
          { title: "On the roadmap", text: "Wider integrations and workspace settings are planned. We will confirm the scope and timing for your needs during discovery." },
        ],
      },
    ],
    closing: {
      title: "See SIQETRA running on your data.",
      text: "We start with a working session on your own records and databases, then configure a pilot workspace for one team. You see real answers on real data before committing to a full rollout.",
    },
    shot: "siqetra",
  },
  {
    slug: "vyral-ai",
    name: "Vyral AI",
    kind: "Social media management software",
    tags: ["AI social media", "Comment automation", "Marketing tech", "Engagement AI", "Brand voice AI"],
    text: "Answers social media comments and direct messages in the brand's own voice.",
    summary: "Social media management software that answers comments and direct messages in real time, to improve customer satisfaction and reduce advertising costs.",
    overview: [
      "We developed Vyral AI, social media management software that answers all your social media comments in a snap. It improves customer satisfaction and reduces your advertising costs.",
      "Vyral AI helps increase profitability: you get quick and accurate responses to comments, directly in real time. This means happier customers, more trust in your brand and a higher chance that prospects will actually buy.",
      "Vyral AI becomes the super brain for your company.",
    ],
    shot: "vyarl",
  },
  {
    slug: "dr-scribe",
    name: "Dr Scribe",
    kind: "AI SOAP notes for clinics",
    tags: ["Medical", "MedTech", "AI voice", "AI SaaS"],
    text: "Generates SOAP notes for clinics from the visit.",
    summary: "An AI platform that simplifies SOAP note generation for clinics, so healthcare professionals can focus on patient care.",
    overview: [
      "Clinical documentation shouldn't be a burden. That's why we built Dr Scribe, an AI platform that simplifies SOAP note generation with AI, so healthcare professionals can focus on what matters most: patient care.",
    ],
    features: [
      { title: "Automated SOAP notes", text: "Reduce documentation time significantly." },
      { title: "AI-powered precision", text: "Ensure accuracy and compliance." },
      { title: "Seamless workflow integration", text: "Works with your existing systems." },
    ],
    shot: "drscribe",
  },
  {
    slug: "aztech-ai",
    name: "Aztech AI",
    kind: "Executive search platform",
    tags: ["Recruitment", "HR solutions", "Executive search"],
    text: "An executive-search platform with AI-assisted sourcing, screening and evaluation.",
    summary: "An executive recruitment and talent acquisition platform that uses AI-driven workflows to source, screen and evaluate leadership candidates.",
    overview: [
      "AZTECH Executive Search is a specialized executive recruitment and talent acquisition platform focused on identifying, qualifying, and placing top leadership talent for organizations. The system streamlines the hiring process by leveraging AI-driven workflows to connect companies with highly skilled professionals for strategic and executive roles. By combining intelligent candidate sourcing, automated screening, and structured evaluation, AZTECH enables faster, more accurate hiring decisions while reducing manual effort and improving overall recruitment efficiency.",
    ],
    challenge: [
      "AZTECH faced multiple challenges in modern executive recruitment and hiring processes, including time-consuming manual candidate sourcing, difficulty in identifying high-quality leadership talent, and lack of a centralized system to manage the hiring workflow. Traditional recruitment methods made it hard to filter candidates based on skills, experience, and role fit, while managing outreach, tracking responses, and maintaining consistent communication across channels added operational complexity. These inefficiencies slowed down the recruitment cycle, reduced scalability, and made it difficult to deliver fast and accurate hiring outcomes for executive roles.",
    ],
    solution: [
      "To overcome these challenges, we developed a custom AI-powered recruitment system that automates candidate sourcing, qualification, and shortlisting within a centralized platform. The solution uses intelligent filtering and data-driven insights to identify the most relevant candidates based on job requirements, while enabling seamless management of the hiring pipeline, outreach, and communication. By reducing manual effort and introducing automation into the recruitment workflow, the platform significantly improves hiring speed, enhances candidate quality, and provides a scalable solution for executive search and talent acquisition.",
    ],
    shot: "aztech",
  },
  {
    slug: "alltrials-ai",
    name: "Alltrials AI",
    kind: "Document question-answering platform (MVP)",
    tags: ["AI SaaS", "Document question answering", "Clinical documents"],
    text: "Question answering over complex clinical trial documents.",
    summary: "An AI-powered question-answering platform for analysing clinical documents, built as an MVP.",
    overview: [
      "Alltrials is an AI-powered question-answering platform designed to streamline the analysis of clinical documents. It leverages advanced natural language processing (NLP) to deliver precise answers to user queries, allowing researchers and healthcare professionals to quickly access relevant information from complex clinical trials and reports. By automating the search and interpretation of clinical data, Alltrials enhances efficiency and supports informed decision-making in medical and pharmaceutical fields.",
    ],
    shot: "alltrials",
  },
  {
    slug: "vendibly",
    name: "Vendibly",
    kind: "Vendor and contract management platform",
    tags: ["Vendor management", "Contract management", "Procurement"],
    text: "Vendor, contract and procurement management in one place.",
    summary: "A platform that simplifies the management of vendors, contracts and procurement workflows for businesses of all sizes.",
    overview: [
      "Vendibly is an advanced platform that simplifies the management of vendors, contracts, and procurement workflows for businesses of all sizes. It provides a centralized hub where organizations can onboard vendors, track performance, manage contracts, and ensure compliance efficiently.",
      "By integrating intelligent tools and intuitive dashboards, Vendibly enables organizations to optimize vendor relationships, reduce administrative overhead, and make data-driven decisions.",
    ],
    shot: "vendibly",
  },
  {
    slug: "card-grading-ai",
    name: "Card Grading AI",
    kind: "Trading card grading platform",
    tags: ["Trading cards", "Grading automation", "SaaS"],
    text: "Grades trading cards from photos, with visual markup of centering, edges and corners.",
    summary: "A web platform that uses AI to analyse, grade and verify trading cards in real time, for collectors, sellers and enthusiasts.",
    overview: [
      "Card Grading AI is a next-generation web platform that leverages artificial intelligence to analyze, grade, and verify trading cards in real time. Designed for collectors, sellers, and enthusiasts, this tool provides fast, accurate, and accessible card grading, eliminating the need for costly and time-consuming manual grading services.",
      "Built using modern web technologies and advanced machine learning models, the system ensures precision, transparency, and ease of use from any device.",
    ],
    features: [
      { title: "AI-powered card grading", text: "Users can upload images of their trading cards (e.g., Pokémon, Yu-Gi-Oh!, sports cards), and the AI instantly assesses centering, edges, corners, and surface to generate a precise grade." },
      { title: "Real-time analysis with scoring", text: "The platform provides detailed scoring for each card condition metric along with an overall grade, giving users full visibility into the evaluation process." },
      { title: "Visual indicators and markup", text: "The AI overlays visual markup (e.g., centering guides, edge detection) to highlight grading criteria, ensuring transparency and trust in results." },
      { title: "Mobile-optimized interface", text: "Built with a responsive design, users can grade cards directly from their phones or tablets with a seamless experience." },
      { title: "Fast and secure uploads", text: "An optimized image processing pipeline and secure cloud storage ensure privacy and performance." },
      { title: "Database and history tracking (optional)", text: "Users can optionally track and store their grading history for reference and portfolio management." },
    ],
    shot: "cardgrading",
  },
  {
    slug: "civil-security",
    name: "Civil Security",
    kind: "Legal AI assistant app",
    tags: ["AI mobile app", "Legal AI", "Public legal data", "U.S. law"],
    text: "A legal assistant trained on public legal data from all 50 U.S. states.",
    summary: "An AI-powered mobile app that gives people across the U.S. instant answers to their legal, business and family questions.",
    overview: [
      "A legal AI assistant in your pocket. We spent several months building something we deeply believe in for the United States.",
      "Civil Security is an AI-powered application we developed for one of our clients. It is designed to help individuals across the U.S. get instant, reliable answers to their legal, business, and family-related questions.",
      "Trained on publicly available legal data from all 50 U.S. states, the app is designed to give people accessible, reliable, and highly accurate legal guidance at any time. Whether it's a question about a contract, a family issue, or state-specific regulations, it's like having a legal assistant in your pocket.",
    ],
    shot: "civil",
  },
  {
    slug: "ai-language-tutor",
    name: "AI Language Tutor",
    kind: "Voice language-learning platform",
    tags: ["EdTech", "Tutoring", "Voice-to-voice", "Multilingual AI", "Conversational AI"],
    text: "A voice-to-voice language-learning platform.",
    summary: "A SaaS platform where language learning meets AI, with a voice-to-voice tutor.",
    overview: [
      "AI Language Tutor is a platform where language learning meets innovation. The startup behind it is dedicated to revolutionizing the way people learn and connect through language.",
      "Its mission is to bridge linguistic gaps and foster meaningful connections between individuals from diverse backgrounds. The team believes that language is the key to understanding, and through this language learning platform it aims to empower users to master any language effortlessly.",
    ],
    shot: "tutor",
  },
  {
    slug: "monetiza",
    name: "Monetiza",
    kind: "Fintech app",
    tags: ["Fintech", "Personal finance", "AI co-pilot", "Predictive analytics"],
    text: "A fintech app that recommends financial products and acts as a planning co-pilot.",
    summary: "An AI financial product recommendation app with an AI Financial Co-Pilot for personal finance management.",
    overview: [
      "We built an AI Financial Product Recommendation App for personal finance management. It uses AI algorithms to give users tailored financial insights that help them make smarter decisions about saving, investing, and budgeting. Whether the goal is to optimize monthly expenses or explore investment opportunities, the app simplifies complex financial data into actionable recommendations that align with the user's goals and lifestyle.",
      "The app also features an AI Financial Co-Pilot, a virtual assistant that brings personalized financial planning to the user. The co-pilot guides users through their financial journey and offers real-time support for setting goals, managing debt, and tracking progress. By integrating natural language processing and predictive analytics, it delivers a seamless and engaging experience, whether the user is a seasoned investor or just starting out.",
    ],
    shot: "monetiza",
  },
  {
    slug: "ota-gpt",
    name: "OTA-GPT",
    kind: "AI mobile app for online travel agencies",
    tags: ["AI for OTAs", "Travel automation", "Customer messaging", "Generative AI", "SaaS for travel"],
    text: "Automates guest messaging and bookings for online travel agencies.",
    summary: "An AI-powered platform that automates guest interactions and bookings for online travel agencies.",
    overview: [
      "OTA-GPT changes the way online travel agencies manage their businesses. It is an AI-powered platform that automates guest interactions, streamlines bookings, and offers personalized responses for listings on platforms like Airbnb, Booking.com, and more, making business automation easy for travel agencies.",
    ],
    shot: "ota",
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);

/** How many pictures a project has (public/projects/<slug>/1.webp ...): the first is its cover. */
export const projectPictures = (slug: string) => projectImages[slug] ?? [];

/** The grid on the work page: name, one line and where its page is. */
export const projectList = projects.map((p) => ({ name: p.name, text: p.text, href: `/work/${p.slug}` }));
