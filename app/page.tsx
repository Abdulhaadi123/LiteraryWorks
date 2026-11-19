import Link from "next/link";
import { services, industries, approach } from "@/lib/content";
import { ServiceCard } from "@/components/ServiceCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Stage3D } from "@/motion/Stage3D";

export default function HomePage() {
  return <>
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-grain" aria-hidden="true"/>
      <div className="hero-orbit hero-orbit-one" aria-hidden="true"/><div className="hero-orbit hero-orbit-two" aria-hidden="true"/>
      <div className="container hero-layout">
        <div className="hero-copy">
          <p className="eyebrow gold-text hero-kicker"><span className="tiny-diamond"/> INTELLIGENCE. ENGINEERED.</p>
          <h1 id="hero-heading">Engineering<br/><em>intelligence.</em><br/>Building <span>what&apos;s next.</span></h1>
          <p className="hero-description">We turn ambitious ideas into intelligent systems — from AI agents and custom software to connected enterprise experiences and practical engineering solutions.</p>
          <div className="hero-actions"><Link className="button button-gold" href="/services">Explore our expertise <span aria-hidden="true">↗</span></Link><Link className="text-link hero-secondary" href="/contact">Let&apos;s build together <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-grid"/><div className="hero-frame frame-outer"/><div className="hero-frame frame-middle"/><div className="hero-frame frame-inner"/><div className="art-center"><div className="art-glyph">LW</div></div><span className="art-coordinate coordinate-one">42° / FUTURE</span><span className="art-coordinate coordinate-two">01 — INNOVATION</span><span className="art-dot dot-one"/><span className="art-dot dot-two"/></div>
      </div>
      <div className="container hero-bottom"><span>SCROLL TO DISCOVER <span className="scroll-line"/></span><span>TECHNOLOGY FIRST. THINKING FORWARD.</span><span className="hero-bottom-no">/ 01</span></div>
    </section>

    <section className="intro-section section-pad">
      <div className="container intro-grid"><div><p className="eyebrow"><span className="tiny-diamond"/> THE LITERARYWORKS PERSPECTIVE</p></div><div><h2 data-reveal="rise">Complex challenges need more than technology. <em>They need a way forward.</em></h2><div className="intro-below" data-reveal="rise"><p>We combine strategic thinking, hands-on engineering and a deep respect for real-world operations. The result is technology that serves a purpose — not technology for its own sake.</p><Link href="/about" className="inline-arrow">Get to know us <span aria-hidden="true">↗</span></Link></div></div></div>
    </section>

    <Stage3D scene="aiSystem" eyebrow="THE INTELLIGENCE LAYER" title={<>Intelligence, <em>made tangible.</em></>} description="See how an intelligent platform comes together: core systems, connected workflows and human-guided automation — engineered as one." steps={[{title:"A strong foundation",text:"Data, architecture and security form the base."},{title:"Systems in sync",text:"Connect tools and workflows across the business."},{title:"Intelligence with oversight",text:"Put AI to work with human decision-making in control."}]} labels={[{key:"core",label:"AI CORE",detail:"Intelligent orchestration"},{key:"data",label:"DATA",detail:"Connected knowledge"},{key:"workflows",label:"WORKFLOWS",detail:"Integrated operations"}]}/>

    <section className="services-section section-pad" id="expertise">
      <div className="container"><div className="services-title-row"><SectionHeading eyebrow="WHAT WE DO" title={<>Built around <em>your next big move.</em></>} description="A connected set of capabilities, from first strategic question to production-ready systems."/><Link href="/services" className="text-link dark-link">View all services <span aria-hidden="true">↗</span></Link></div><div className="services-grid" data-stagger>{services.map(service => <ServiceCard service={service} key={service.slug}/>)}</div></div>
    </section>

    <section className="construction-feature" aria-labelledby="construction-heading"><div className="construction-image" aria-hidden="true"><div className="building-shape"><span/><span/><span/><span/></div><div className="blueprint-grid"/><span className="image-annotation">BUILT ENVIRONMENTS / 07</span></div><div className="construction-copy"><p className="eyebrow gold-text"><span className="tiny-diamond"/> AN ADJACENT CAPABILITY</p><h2 id="construction-heading">Digital thinking.<br/><em>Real-world building.</em></h2><p>Alongside our core technology practice, we explore construction and renovation project solutions through qualified, appropriately licensed professionals where required — and technology that helps the built world work smarter.</p><div className="construction-tags"><span>Construction coordination</span><span>Renovation planning</span><span>Construction technology</span></div><Link href="/construction" className="button button-outline">Explore construction solutions <span aria-hidden="true">↗</span></Link></div></section>

    <section className="industries-section section-pad"><div className="container"><SectionHeading eyebrow="WHERE WE CREATE VALUE" title={<>Solutions for people <em>doing important work.</em></>} description="Every industry has its own operational reality. We begin there."/><div className="industry-list">{industries.map(industry=><div className="industry-row" key={industry.number} data-reveal="rise"><span className="industry-number">{industry.number}</span><h3>{industry.name}</h3><p>{industry.detail}</p><span className="industry-arrow" aria-hidden="true">↗</span></div>)}</div></div></section>

    <section className="process-section section-pad"><div className="container"><div className="process-heading"><SectionHeading eyebrow="THE WAY WE WORK" title={<>Clarity first. <em>Momentum always.</em></>} description="Good execution starts long before the first line of code."/><div className="process-symbol" aria-hidden="true">✳</div></div><div className="process-grid" data-stagger>{approach.map(item=><div className="process-item" data-reveal="rise" key={item.number}><div className="process-line"><span>{item.number}</span><span className="process-node"/></div><h3>{item.title}</h3><p>{item.detail}</p></div>)}</div><Link href="/contact" className="button button-gold">Tell us your challenge <span aria-hidden="true">↗</span></Link></div></section>

    <section className="insight-strip"><div className="container insight-inner"><span className="insight-star" aria-hidden="true">✳</span><div><p className="eyebrow gold-text">OUR FOCUS</p><p>Useful AI. Thoughtful software. Measurable progress.</p></div><Link href="/services/ai-strategy-advisory" className="inline-arrow">Start with strategy <span aria-hidden="true">↗</span></Link></div></section>
  </>;
}
