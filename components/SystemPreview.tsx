/** A deliberately illustrative, not live, workflow interface. No invented customer data or metrics. */
export function SystemPreview() {
  return <div className="system-preview" aria-label="Illustration of an AI-assisted business workflow with a human approval step">
    <div className="preview-frame">
      <div className="preview-toolbar"><span className="preview-window-dots"><i/><i/><i/></span><span>WORKFLOW / OVERVIEW</span><span className="preview-status"><b/> SYSTEM DESIGN</span></div>
      <div className="preview-content">
        <div className="preview-eyeline"><span className="preview-serial">LW / 001</span><span>INTELLIGENT OPERATIONS</span></div>
        <div className="preview-heading">One connected workflow.<br/><strong>Every decision in context.</strong></div>
        <div className="preview-flow">
          <div className="flow-node flow-intake"><span className="flow-node-icon">↙</span><span className="flow-caption">01 / INPUT</span><strong>Customer request</strong><small>Captured and categorized</small></div>
          <div className="flow-connector" aria-hidden="true"><span/></div>
          <div className="flow-node flow-ai"><span className="flow-node-icon ai-icon">✳</span><span className="flow-caption">02 / INTELLIGENCE</span><strong>AI understands</strong><small>Context, rules and knowledge</small></div>
          <div className="flow-connector" aria-hidden="true"><span/></div>
          <div className="flow-node flow-approval"><span className="flow-node-icon">✓</span><span className="flow-caption">03 / CONTROL</span><strong>Human approves</strong><small>Review before action</small></div>
        </div>
        <div className="preview-foot"><div className="preview-foot-icon">⌁</div><div><strong>Designed around your process</strong><span>Secure integrations · Clear ownership · Observable outcomes</span></div><span className="preview-foot-tag">ILLUSTRATIVE</span></div>
      </div>
    </div>
    <div className="preview-floating-tag tag-top"><span className="tag-spark">✧</span><span>Design systems<br/><strong>that work together.</strong></span></div>
    <div className="preview-floating-tag tag-bottom"><span className="tag-dot"/> <span>Architecture before automation</span></div>
  </div>;
}
