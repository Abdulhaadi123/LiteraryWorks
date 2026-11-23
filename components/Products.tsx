import { SectionHead } from "@/components/ui";
import { products } from "@/lib/content";

/** Our own products (home page): a product sheet per product, linking out to its own site. */
export function Products() {
  return (
    <section className="section on-mist products" id="products">
      <div className="wrap">
        <SectionHead
          kicker="Our products"
          title={
            <>
              Products we <em>build and run</em>
            </>
          }
          lead="Alongside client work, we design and ship AI products of our own. The first, Balosys, launches in 2026. More are in the pipeline."
        />
        {products.map((p, i) => (
          <article className="product" key={p.name} aria-labelledby={`product-${i}`} data-reveal>
            <div className="product-bar">
              <span className="product-index">Product {String(i + 1).padStart(2, "0")}</span>
              <span className="product-status">
                <i aria-hidden="true" />
                {p.status}
              </span>
            </div>
            <div className="product-body">
              <div className="product-main">
                <p className="product-cat">{p.category}</p>
                <h3 className="product-name" id={`product-${i}`}>
                  {p.name}
                </h3>
                <p className="product-text">{p.text}</p>
                <p className="product-label">Coverage includes</p>
                <ul className="product-tags">
                  {p.domains.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                  <li className="is-more">+ {p.moreDomains} more domains</li>
                </ul>
              </div>
              <div className="product-side">
                <dl className="product-facts">
                  {p.facts.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <a className="btn product-cta" href={p.url} target="_blank" rel="noopener noreferrer">
                  Visit {p.name}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p className="product-url">{p.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
