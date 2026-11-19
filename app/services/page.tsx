import Link from "next/link";
import { services } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Technology Services", "Explore LiteraryWorks' AI agents, custom software, SaaS engineering, cloud platforms, enterprise integrations, digital experiences and AI strategy.", "/services");

export default function ServicesPage() {
  return <><section className="page-hero page-hero-navy"><div className="container"><p className="eyebrow gold-text"><span className="tiny-diamond"/> CAPABILITIES / 01 — 06</p><h1>The right technology.<br/><em>For the real problem.</em></h1><p>Explore the capabilities behind better workflows, connected data, purposeful software and responsible AI adoption.</p></div><span className="page-hero-decoration" aria-hidden="true">06</span></section>
  <section className="section-pad services-page-section"><div className="container"><div className="services-grid">{services.map(service=><ServiceCard key={service.slug} service={service}/>)}</div><div className="service-addon"><div><p className="eyebrow"><span className="tiny-diamond"/> COMPLEMENTARY EXPERTISE / 07</p><h3>Construction & <em>Built Environment</em></h3><p>Project planning, construction coordination and technology for the built world — scoped separately from our core digital services and subject to applicable licensing and availability.</p></div><Link href="/construction" className="button button-navy">Explore construction <span aria-hidden="true">↗</span></Link></div></div></section>
  <section className="service-bridge section-pad"><div className="container bridge-grid"><div><p className="eyebrow"><span className="tiny-diamond"/> NOT SURE WHERE TO START?</p><h2>A good partnership begins with <em>the right question.</em></h2></div><div><p>Tell us what is slowing you down or what you want to make possible. We&apos;ll help frame the challenge, identify opportunities and decide what comes next.</p><Link href="/contact" className="button button-navy">Discuss your project <span aria-hidden="true">↗</span></Link></div></div></section></>;
}
