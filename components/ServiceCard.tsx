import Link from "next/link";
import type { Service } from "@/lib/content";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="service-card"
      data-reveal="rise"
    >
      <div className="service-card-top">
        <span className="service-no">{service.number} // 06</span>
        {service.badge && <span className="service-badge">{service.badge}</span>}
        <span className="service-icon" aria-hidden="true">
          {service.icon}
        </span>
      </div>

      <div className="service-card-body">
        <p className="service-eyebrow">{service.eyebrow}</p>
        <h3>{service.title}</h3>
        <p>{service.intro}</p>
      </div>

      <div className="service-card-footer">
        <span className="service-link">
          Explore Architecture &amp; Deliverables
          <span className="service-link-arrow" aria-hidden="true">
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}
