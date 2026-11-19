import Link from "next/link";
import { industries } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Industries", "Discover how LiteraryWorks approaches AI, software, automation and technology solutions for industries across the US.", "/industries");

export default function IndustriesPage() {
  return <><section className="page-hero page-hero-navy"><div className="container"><p className="eyebrow gold-text"><span className="tiny-diamond"/> INDUSTRIES & OPPORTUNITIES</p><h1>Every industry has <em>its own reality.</em></h1><p>We believe technology becomes valuable when it understands the people, processes and pressures of the work.</p></div><span className="page-hero-decoration" aria-hidden="true">∞</span></section>
  <section className="industries-section section-pad"><div className="container"><p className="section-intro-text">These are areas where we see meaningful opportunities for custom software, connected data, AI-assisted workflows and digital experiences. Every engagement begins with specific business needs.</p><div className="industry-list">{industries.map(industry=><div className="industry-row" key={industry.number}><span className="industry-number">{industry.number}</span><h3>{industry.name}</h3><p>{industry.detail}</p><span className="industry-arrow" aria-hidden="true">↗</span></div>)}</div></div></section>
  <section className="service-bridge section-pad"><div className="container bridge-grid"><div><p className="eyebrow"><span className="tiny-diamond"/> YOUR INDUSTRY, YOUR CHALLENGE</p><h2>We make space for <em>specifics.</em></h2></div><div><p>Don&apos;t see your field listed? We work from business problems, not fixed industry templates.</p><Link className="button button-navy" href="/contact">Discuss your use case <span aria-hidden="true">↗</span></Link></div></div></section></>;
}
