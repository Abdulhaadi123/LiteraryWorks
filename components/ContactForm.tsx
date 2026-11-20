"use client";

import { useEffect, useState, type FormEvent } from "react";
import { topics } from "@/lib/topics";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The inquiry form. It posts to /api/inquiry, which validates the fields and sends the message with Resend. It only
 * reports success once the email provider has accepted the message. The "website" field is a honeypot for bots.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState<string>(topics[0].value);

  // /contact?topic=construction-technology opens the form with that service chosen
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("topic");
    const hit = topics.find((t) => t.key === key);
    if (hit) setTopic(hit.value);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          interest: data.get("interest"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(json.message || "Something went wrong. Please try again.");
        return;
      }
      setStatus("sent");
      setMessage("Thank you. We have your message and will reply by email.");
      form.reset();
      setTopic(topics[0].value);
    } catch {
      setStatus("error");
      setMessage("We could not reach the server. Please try again in a moment.");
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <div className="row">
        <div className="field">
          <label htmlFor="f-name">Your name</label>
          <input id="f-name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="f-email">Work email</label>
          <input id="f-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="f-company">Company</label>
          <input id="f-company" name="company" type="text" autoComplete="organization" maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="f-interest">What do you need help with?</label>
          <select id="f-interest" name="interest" value={topic} onChange={(e) => setTopic(e.target.value)} required>
            {topics.map((t) => (
              <option key={t.key} value={t.value}>
                {t.value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-message">Tell us about the work</label>
        <textarea
          id="f-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          placeholder="What does your team repeat every day? Where does work get stuck?"
        />
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-foot">
        <button type="submit" className="btn btn-navy" disabled={status === "sending"}>
          {status === "sending" ? "Sending" : "Send message"}
        </button>
        <p className="form-status" role="status" aria-live="polite" data-state={status}>
          {message}
        </p>
      </div>
    </form>
  );
}
