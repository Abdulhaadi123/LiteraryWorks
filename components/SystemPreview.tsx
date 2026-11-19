"use client";

import { useState } from "react";

export function SystemPreview() {
  const [activeTab, setActiveTab] = useState<"operations" | "construction" | "software">("operations");

  return (
    <div className="relative w-full max-w-xl select-none" aria-label="Illustration of an intelligent business workflow">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-15px_rgba(15,36,56,0.12)]">
        {/* Top Window Bar */}
        <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "operations"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("operations")}
            >
              Enterprise AI
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "construction"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("construction")}
            >
              ConTech &amp; Blueprints
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "software"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("software")}
            >
              Connected Stack
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Active Flow</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>LW // REFERENCE ARCHITECTURE</span>
            <span className="text-[#b48d55] font-semibold">HUMAN-IN-THE-LOOP</span>
          </div>

          <div className="mb-6 font-display text-xl font-bold text-slate-900">
            {activeTab === "operations" && (
              <>
                One unified workflow.<br />
                <span className="text-slate-500 font-normal">Every decision verified in context.</span>
              </>
            )}
            {activeTab === "construction" && (
              <>
                From plans to progress.<br />
                <span className="text-slate-500 font-normal">Blueprints and field reporting coordinated.</span>
              </>
            )}
            {activeTab === "software" && (
              <>
                Connected tools &amp; data.<br />
                <span className="text-slate-500 font-normal">APIs and software working as one system.</span>
              </>
            )}
          </div>

          {/* 3-Step Process Flow */}
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* Step 1 */}
            <div className="flex min-h-[150px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>01</span>
                  <span>INTAKE</span>
                </div>
                <strong className="block text-xs font-bold text-slate-900">
                  {activeTab === "operations"
                    ? "Document / Request"
                    : activeTab === "construction"
                    ? "Blueprints & Specs"
                    : "ERP & App Ingestion"}
                </strong>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {activeTab === "operations"
                    ? "Captured and structured from approved business sources"
                    : activeTab === "construction"
                    ? "Vector PDFs and schedule data extracted"
                    : "Event webhooks received securely"}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Structured Data</span>
            </div>

            {/* Connector */}
            <span className="hidden text-slate-300 sm:block">→</span>

            {/* Step 2 */}
            <div className="flex min-h-[150px] flex-col justify-between rounded-xl border border-[#c29b61]/40 bg-[#fbf9f5] p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-[#b48d55]">
                  <span>02</span>
                  <span>INTELLIGENCE</span>
                </div>
                <strong className="block text-xs font-bold text-slate-900">
                  {activeTab === "operations"
                    ? "AI Understands"
                    : activeTab === "construction"
                    ? "Takeoff & Conflict Check"
                    : "Automated Routing"}
                </strong>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {activeTab === "operations"
                    ? "Retrieves rules, history and context deterministically"
                    : activeTab === "construction"
                    ? "Calculates quantities and flags schedule clashes"
                    : "Validates business rules and transforms records"}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-[#b48d55]">Grounding &amp; Logic</span>
            </div>

            {/* Connector */}
            <span className="hidden text-slate-300 sm:block">→</span>

            {/* Step 3 */}
            <div className="flex min-h-[150px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>03</span>
                  <span>OVERSIGHT</span>
                </div>
                <strong className="block text-xs font-bold text-slate-900">
                  Human Approves
                </strong>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {activeTab === "operations"
                    ? "Clear checkpoint review before downstream execution"
                    : activeTab === "construction"
                    ? "Project manager signs off before field dispatch"
                    : "Audit logging and stakeholder confirmation"}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">Accountability</span>
            </div>
          </div>

          {/* Footer Bar inside terminal */}
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <span className="text-base text-[#c29b61]">✳</span>
            <div className="flex-1">
              <strong className="block font-semibold text-slate-800">
                Designed around your operational reality
              </strong>
              <span className="block text-slate-500">
                Secure integrations · Clear ownership · Observable outcomes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
