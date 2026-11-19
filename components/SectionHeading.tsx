import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, className = "" }: {eyebrow: string; title: ReactNode; description?: string; className?: string}) {
  return <div className={`section-heading ${className}`}>
    <p className="eyebrow" data-reveal="rise"><span className="tiny-diamond"/>{eyebrow}</p>
    <h2 data-reveal="rise">{title}</h2>
    {description && <p className="section-description" data-reveal="rise">{description}</p>}
  </div>;
}
