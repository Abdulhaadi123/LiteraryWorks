import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {return services.map(service => ({slug: service.slug}));}
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const service = services.find(s=>s.slug === slug);
  return service ? pageMeta(service.title, service.intro, `/services/${slug}`) : {};
}
export default async function ServiceDetailPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const service = services.find(s=>s.slug === slug);
  if (!service) notFound();
  const index = services.findIndex(s=>s.slug === slug);
  const next = services[(index+1)%services.length];
  return <><section className="page-hero page-hero-navy service-detail-hero"><div className="container"><Link href="/services" className="back-link">← All services</Link><p className="eyebrow gold-text"><span className="tiny-diamond"/>{service.eyebrow} / {service.number}</p><h1>{service.title.split(" & ")[0]}{service.title.includes(" & ") && <><br/><em>& {service.title.split(" & ").slice(1).join(" & ")}</em></>}</h1><p>{service.intro}</p></div><span className="page-hero-decoration" aria-hidden="true">{service.number}</span></section>
  <section className="detail-body section-pad"><div className="container detail-grid"><aside><p className="eyebrow"><span className="tiny-diamond"/> THE OPPORTUNITY</p><span className="detail-symbol" aria-hidden="true">{service.icon}</span></aside><div><h2>Purpose-built for <em>the way you work.</em></h2><p className="detail-lead">{service.detail}</p><h3>How we can help</h3><div className="deliverable-grid">{service.deliverables.map((deliverable,i)=><div className="deliverable" key={deliverable}><span>0{i+1}</span><p>{deliverable}</p></div>)}</div><div className="ideal-for"><span>RELEVANT FOR</span><p>{service.idealFor}</p></div><Link href="/contact" className="button button-navy">Explore a project together <span aria-hidden="true">↗</span></Link></div></div></section>
  <section className="next-service"><div className="container"><span>CONTINUE EXPLORING</span><Link href={`/services/${next.slug}`}>{next.title} <span aria-hidden="true">↗</span></Link></div></section></>;
}
