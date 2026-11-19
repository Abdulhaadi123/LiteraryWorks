import Link from "next/link";
import { industries } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Industries", "Discover how LiteraryWorks approaches AI, software, automation and technology solutions for industries across the US.", "/industries");

export default function IndustriesPage() {
  return <><section className="page-hero page-hero-navy"><div className="container"><p className="eyebrow gold-text"><span className="tiny-diamond"/> INDUSTRIES & OPPORTUNITIES</p><h1>Built around <em>your reality.</em></h1><p>An AI workflow for a service firm should not look like an operations platform for a logistics team. Context comes first.</p></div><span className="page-hero-decoration" aria-hidden="true">∞</span></section>
  <section className="industries-section section-pad"><div className="container"><p className="section-intro-text">These are examples of where software and AI can remove friction. We do not assume every challenge needs the same tool — we learn the process, identify constraints and propose a practical solution.</p><div className="industry-list">{industries.map(industry=><div className="industry-row" key={industry.number}><span className="industry-number">{industry.number}</span><h3>{industry.name}</h3><p>{industry.detail}</p><span className="industry-arrow" aria-hidden="true">↗</span></div>)}</div></div></section>
  <section className="service-bridge section-pad"><div className="container bridge-grid"><div><p className="eyebrow"><span className="tiny-diamond"/> YOUR INDUSTRY, YOUR CHALLENGE</p><h2>We make space for <em>specifics.</em></h2></div><div><p>Don&apos;t see your field listed? We work from business problems, not fixed industry templates.</p><Link className="button button-navy" href="/contact">Discuss your use case <span aria-hidden="true">↗</span></Link></div></div></section></>;
}
