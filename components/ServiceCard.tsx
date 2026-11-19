import Link from "next/link";
import type { Service } from "@/lib/content";

export function ServiceCard({ service }: { service: Service }) {
  return <Link className="service-card" href={`/services/${service.slug}`} data-reveal="rise">
    <div className="service-card-top"><span className="service-no">/{service.number}</span><span className="service-icon" aria-hidden="true">{service.icon}</span></div>
    <p className="service-eyebrow">{service.eyebrow}</p>
    <h3>{service.title}</h3>
    <p>{service.intro}</p>
    <span className="service-link">Explore service <span aria-hidden="true">↗</span></span>
  </Link>;
}
