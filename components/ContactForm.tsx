"use client";

import { useState, type FormEvent } from "react";

type Status = { kind: "idle" | "sending" | "success" | "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setStatus({ kind: "sending", message: "Transmitting your engineering consultation inquiry…" });
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result: { message?: string } = await response.json();
      if (!response.ok) throw new Error(result.message || "We couldn't send this inquiry right now.");
      form.reset();
      setStatus({ kind: "success", message: "Inquiry received. A senior systems architect will respond within 24 business hours." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "An unexpected error occurred." });
    }
  }

  return (
    <form
      className="relative grid gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-100 sm:p-10"
      onSubmit={handleSubmit}
      noValidate={false}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
          <span>Full name <strong className="text-[#b48d55]">*</strong></span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Sarah Jenkins"
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0f2438] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2438]"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
          <span>Work email <strong className="text-[#b48d55]">*</strong></span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="sarah@enterprise.com"
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0f2438] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2438]"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
          <span>Company / Organization</span>
          <input
            name="company"
            maxLength={120}
            autoComplete="organization"
            placeholder="Apex Builders / Corp (optional)"
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0f2438] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2438]"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
          <span>Primary Area of Interest <strong className="text-[#b48d55]">*</strong></span>
          <select
            name="interest"
            required
            defaultValue=""
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-[#0f2438] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2438]"
          >
            <option value="" disabled>Select a capability</option>
            <option>ConTech: Automated AI Blueprint Takeoffs</option>
            <option>ConTech: BIM &amp; Schedule Conflict Engine</option>
            <option>Enterprise AI Agents &amp; Workflow Swarms</option>
            <option>Custom Cloud Platform / SaaS Development</option>
            <option>Legacy ERP, Procore &amp; API Integration</option>
            <option>Hardened Cloud Infrastructure &amp; DevOps</option>
            <option>Technical Architecture Audit (1-Hour Complimentary)</option>
            <option>Other Custom Scope</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
        <span>Project Overview &amp; Operational Bottleneck <strong className="text-[#b48d55]">*</strong></span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="Briefly describe your current workflows, operational bottlenecks, software stack (e.g. Procore, SAP, Salesforce), and timeline goals."
          className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#0f2438] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2438]"
        />
      </label>

      {/* Honeypot anti-spam */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          All consultations and inquiries are protected under strict mutual confidentiality and non-disclosure standards.
        </p>
        <button
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-lg bg-[#0f2438] px-7 font-display text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#183652] hover:shadow-md disabled:opacity-50"
          type="submit"
          disabled={status.kind === "sending"}
        >
          {status.kind === "sending" ? "Transmitting…" : "Transmit Inquiry"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      {status.kind !== "idle" && (
        <div
          className={`rounded-lg p-4 text-xs font-medium ${
            status.kind === "success"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
              : status.kind === "error"
              ? "border border-rose-300 bg-rose-50 text-rose-800"
              : "border border-slate-300 bg-slate-100 text-slate-700"
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
