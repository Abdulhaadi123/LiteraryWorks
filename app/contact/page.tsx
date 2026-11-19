import { ContactForm } from "@/components/ContactForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Start a Project", "Tell LiteraryWorks about your AI, software, digital transformation or construction-technology project and let's explore what's possible.", "/contact");

export default function ContactPage() {
  return <><section className="page-hero page-hero-navy contact-hero"><div className="container"><p className="eyebrow gold-text"><span className="tiny-diamond"/> LET'S START WITH A CONVERSATION</p><h1>Tell us the challenge.<br/><em>We’ll find the way forward.</em></h1><p>Whether you need an AI roadmap, a new platform or a way to connect your existing systems, it starts with a clear conversation.</p></div><span className="page-hero-decoration" aria-hidden="true">↗</span></section>
  <section className="section-pad contact-section"><div className="container contact-grid"><div className="contact-intro"><p className="eyebrow"><span className="tiny-diamond"/> START A PROJECT</p><h2>What would you like <em>to work better?</em></h2><p>Whether you&apos;re exploring AI, planning a software platform, modernizing operations or evaluating a construction-related need, a clear description is the best place to begin.</p><div className="contact-note"><span className="contact-note-icon">✳</span><div><strong>A thoughtful first step</strong><p>No overcomplicated briefing required. Share what you know, and we can work through the rest together.</p></div></div></div><ContactForm/></div></section></>;
}
