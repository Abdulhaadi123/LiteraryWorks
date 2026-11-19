"use client";

import { useState, type FormEvent } from "react";

type Status = { kind: "idle" | "sending" | "success" | "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({kind: "idle", message: ""});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setStatus({kind: "sending", message: "Sending your inquiry…"});
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(fields)
      });
      const result: { message?: string } = await response.json();
      if (!response.ok) throw new Error(result.message || "We couldn't send this inquiry right now.");
      form.reset();
      setStatus({kind: "success", message: "Thank you. Your inquiry has been received."});
    } catch (error) {
      setStatus({kind: "error", message: error instanceof Error ? error.message : "An unexpected error occurred."});
    }
  }

  return <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
    <div className="form-grid">
      <label>Full name <span>*</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your full name"/></label>
      <label>Work email <span>*</span><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@company.com"/></label>
      <label>Company / organization<input name="company" maxLength={120} autoComplete="organization" placeholder="Company name (optional)"/></label>
      <label>What can we help with? <span>*</span><select name="interest" required defaultValue=""><option value="" disabled>Select a service</option><option>AI Agents & Automation</option><option>Custom Software & SaaS</option><option>Enterprise AI & Integrations</option><option>Cloud & Platform Engineering</option><option>Web & Mobile Experiences</option><option>AI Strategy & Advisory</option><option>Construction & Project Solutions</option><option>Something else</option></select></label>
    </div>
    <label>Tell us about the project <span>*</span><textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder="What are you trying to achieve? Helpful details include your timeline, current challenges, and project goals."/></label>
    <div className="honeypot" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="form-bottom"><p>Only share information you are comfortable sending. Please avoid passwords or sensitive personal data.</p><button className="button button-gold" type="submit" disabled={status.kind === "sending"}>{status.kind === "sending" ? "Sending…" : "Send inquiry"}<span aria-hidden="true">↗</span></button></div>
    {status.kind !== "idle" && <p className={`form-status ${status.kind}`} role="status" aria-live="polite">{status.message}</p>}
  </form>;
}
