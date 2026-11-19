import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="eyebrow gold-text"><span className="tiny-diamond"/> THE NEXT CHAPTER STARTS HERE</div>
            <h2>Let&apos;s build something <em>meaningful.</em></h2>
            <Link href="/contact" className="button button-gold">Start a conversation <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="footer-aside"><span className="footer-orbit" aria-hidden="true">✳</span><p>Engineering what&apos;s next, through technology first and practical execution always.</p></div>
        </div>
        <div className="footer-bottom">
          <Link className="footer-wordmark" href="/">LITERARY<span>WORKS</span><small>Ideas into impact.</small></Link>
          <div className="footer-links">
            <Link href="/services">Services</Link><Link href="/industries">Industries</Link><Link href="/construction">Construction</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link>
          </div>
          <div className="footer-credits">© {new Date().getFullYear()} LiteraryWorks. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
