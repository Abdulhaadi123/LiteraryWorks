"use client";

import { useState, type FormEvent } from "react";

type Status = { kind: "idle" | "sending" | "success" | "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setStatus({ kind: "sending", message: "Encrypting and transmitting your engineering inquiry…" });
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result: { message?: string } = await response.json();
      if (!response.ok) throw new Error(result.message || "We couldn't send this inquiry right now.");
      form.reset();
      setStatus({ kind: "success", message: "Inquiry received. A senior systems architect will respond within 24 hours." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "An unexpected error occurred." });
    }
  }

  return (
    <form className="relative grid gap-6 rounded-xl border border-white/15 bg-[#0a101d] p-6 shadow-2xl sm:p-10" onSubmit={handleSubmit} noValidate={false}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
          <span>Full name <strong className="text-[#ff6b00]">*</strong></span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Sarah Jenkins"
            className="rounded-md border border-white/15 bg-[#0f172a] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
          <span>Work email <strong className="text-[#ff6b00]">*</strong></span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="sarah@enterprise.com"
            className="rounded-md border border-white/15 bg-[#0f172a] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
          <span>Company / General Contractor</span>
          <input
            name="company"
            maxLength={120}
            autoComplete="organization"
            placeholder="Apex Builders / Corp (optional)"
            className="rounded-md border border-white/15 bg-[#0f172a] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
          <span>Primary Area of Interest <strong className="text-[#ff6b00]">*</strong></span>
          <select
            name="interest"
            required
            defaultValue=""
            className="rounded-md border border-white/15 bg-[#0f172a] px-4 py-3 text-sm text-white transition-colors focus:border-[#00f0ff] focus:outline-none"
          >
            <option value="" disabled>Select a capability</option>
            <option>ConTech: Automated AI Blueprint Takeoffs</option>
            <option>ConTech: BIM & Schedule Conflict Engine</option>
            <option>Enterprise AI Agents & Workflow Swarms</option>
            <option>Custom Cloud Platform / SaaS Development</option>
            <option>Legacy ERP, Procore & API Integration</option>
            <option>Hardened Cloud Infrastructure & DevOps</option>
            <option>Technical Architecture Audit (1-Hour Free)</option>
            <option>Other Custom Scope</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-300">
        <span>Project Overview &amp; Operational Bottleneck <strong className="text-[#ff6b00]">*</strong></span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="Briefly describe your current workflows, challenges, software stack (e.g. Procore, SAP, Salesforce), and timeline goals."
          className="rounded-md border border-white/15 bg-[#0f172a] px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-[#00f0ff] focus:outline-none"
        />
      </label>

      {/* Honeypot anti-spam */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
        <p className="max-w-sm text-xs leading-relaxed text-slate-400">
          All submissions are protected under mutual non-disclosure and SOC2 data privacy guidelines.
        </p>
        <button
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-md bg-[#ff6b00] px-7 font-display text-xs font-bold text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all hover:bg-[#ff8c33] disabled:opacity-50"
          type="submit"
          disabled={status.kind === "sending"}
        >
          {status.kind === "sending" ? "Transmitting…" : "Transmit Inquiry"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      {status.kind !== "idle" && (
        <div
          className={`rounded-md p-3.5 text-xs font-semibold ${
            status.kind === "success"
              ? "border border-[#22c55e] bg-[#22c55e]/15 text-[#22c55e]"
              : status.kind === "error"
              ? "border border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444]"
              : "border border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]"
          }`}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
