"use client";

import { useState } from "react";

export function SystemPreview() {
  const [activeTab, setActiveTab] = useState<"construction" | "agents" | "integration">("construction");

  return (
    <div className="relative w-full max-w-2xl select-none" aria-label="Interactive preview of an enterprise AI and ConTech operational system">
      <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#0a101d] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_40px_rgba(0,240,255,0.06)] transition-all hover:border-[#00f0ff]/40">
        {/* Top Window Bar */}
        <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#060911]/90 px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition-all ${
                activeTab === "construction"
                  ? "border border-[#00f0ff]/40 bg-[#0f172a] text-[#00f0ff]"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("construction")}
            >
              BIM &amp; Jobsite AI
            </button>
            <button
              type="button"
              className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition-all ${
                activeTab === "agents"
                  ? "border border-[#00f0ff]/40 bg-[#0f172a] text-[#00f0ff]"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("agents")}
            >
              Multi-Agent Swarm
            </button>
            <button
              type="button"
              className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition-all ${
                activeTab === "integration"
                  ? "border border-[#00f0ff]/40 bg-[#0f172a] text-[#00f0ff]"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("integration")}
            >
              ERP / Procore Sync
            </button>
          </div>

          <div className="hidden items-center gap-2 font-mono text-[10px] text-[#22c55e] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
            <span>US-EAST · 99.99%</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex items-center justify-between font-mono text-[11px]">
            <div className="flex items-center gap-2 text-[#ff6b00]">
              <span>⚡</span>
              <span className="font-semibold tracking-wider">LITERARYWORKS ENGINE v4.2</span>
            </div>
            <span className="text-slate-500">LATENCY: 12ms · SOC2 MONITORED</span>
          </div>

          <div className="mb-6 font-display text-lg font-semibold text-white sm:text-xl">
            {activeTab === "construction" && (
              <>
                Automated Takeoffs &amp; BIM Coordination.
                <strong className="font-bold text-[#00f0ff]"> Zero field guesswork.</strong>
              </>
            )}
            {activeTab === "agents" && (
              <>
                Autonomous Multi-Agent Workflow Execution.
                <strong className="font-bold text-[#00f0ff]"> Governed at every step.</strong>
              </>
            )}
            {activeTab === "integration" && (
              <>
                Unified Legacy &amp; Cloud ERP Synchronization.
                <strong className="font-bold text-[#00f0ff]"> Real-time data pipeline.</strong>
              </>
            )}
          </div>

          {/* 3-Step Process Flow */}
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* Step 1 */}
            <div className="flex min-h-[160px] flex-col justify-between rounded-lg border border-white/10 bg-[#0f172a] p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-[#ff6b00]">01</span>
                  <span className="text-slate-400">INGESTION</span>
                </div>
                <strong className="block text-xs font-semibold text-white">
                  {activeTab === "construction"
                    ? "CAD / Blueprints & RFIs"
                    : activeTab === "agents"
                    ? "Enterprise Knowledge Store"
                    : "Procore & SAP Data Stream"}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {activeTab === "construction"
                    ? "Vectorized PDF takeoffs & clash detection"
                    : activeTab === "agents"
                    ? "RAG embeddings across secure documents"
                    : "Bi-directional event webhook triggers"}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                <span className="text-slate-500">Verified</span>
                <span className="rounded bg-[#22c55e]/15 px-1.5 py-0.5 font-mono text-[#22c55e]">
                  100% Ingested
                </span>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden h-0.5 w-4 bg-white/20 sm:block">
              <span className="block h-full w-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
            </div>

            {/* Step 2 */}
            <div className="flex min-h-[160px] flex-col justify-between rounded-lg border border-[#ff6b00]/30 bg-[#ff6b00]/[0.03] p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-[#ff6b00]">02</span>
                  <span className="font-bold text-[#ff6b00]">AI REASONING</span>
                </div>
                <strong className="block text-xs font-semibold text-white">
                  {activeTab === "construction"
                    ? "Estimating & Schedule AI"
                    : activeTab === "agents"
                    ? "Agent Swarm Evaluation"
                    : "Automated Reconciliation"}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {activeTab === "construction"
                    ? "Calculates materials, cost variance & risks"
                    : activeTab === "agents"
                    ? "Generates proposed actions with citations"
                    : "Resolves schema anomalies & validates GL codes"}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                <span className="text-slate-500">Inference</span>
                <span className="rounded bg-[#ff6b00]/15 px-1.5 py-0.5 font-mono text-[#ff6b00]">
                  14.2ms High Acc.
                </span>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden h-0.5 w-4 bg-white/20 sm:block">
              <span className="block h-full w-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
            </div>

            {/* Step 3 */}
            <div className="flex min-h-[160px] flex-col justify-between rounded-lg border border-white/10 bg-[#0f172a] p-4">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-[#ff6b00]">03</span>
                  <span className="text-slate-400">EXECUTIVE GATE</span>
                </div>
                <strong className="block text-xs font-semibold text-white">
                  Human-in-the-Loop Check
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {activeTab === "construction"
                    ? "PM approves change-order & takeoff packet"
                    : activeTab === "agents"
                    ? "Stakeholder 1-click authorization required"
                    : "Automated sign-off routed to lead engineer"}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                <span className="text-slate-500">Governance</span>
                <span className="rounded bg-[#00f0ff]/15 px-1.5 py-0.5 font-mono text-[#00f0ff]">
                  Air-tight
                </span>
              </div>
            </div>
          </div>

          {/* Footer Bar inside terminal */}
          <div className="mt-6 flex items-center gap-3.5 rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
            <span className="text-xl text-[#00f0ff]">⬡</span>
            <div className="flex-1">
              <strong className="block text-xs font-semibold text-white">
                Enterprise Operating System Architecture
              </strong>
              <span className="block text-[11px] text-slate-400">
                Engineered for General Contractors, Developers, and US High-Growth Enterprises
              </span>
            </div>
            <span className="hidden font-mono text-[10px] font-bold tracking-wider text-[#ff6b00] sm:block">
              READY FOR DEPLOYMENT
            </span>
          </div>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute -top-4 -right-4 hidden items-center gap-3 rounded-lg border border-[#00f0ff]/30 bg-[#0f172a]/95 px-4 py-2.5 shadow-xl backdrop-blur-md lg:flex">
        <span className="text-xl">🏗️</span>
        <div>
          <strong className="block text-xs text-white">BIM &amp; ConTech Ready</strong>
          <small className="block font-mono text-[9px] text-slate-400">Automated Takeoff &amp; RFI Pipelines</small>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 hidden items-center gap-3 rounded-lg border border-[#00f0ff]/30 bg-[#0f172a]/95 px-4 py-2.5 shadow-xl backdrop-blur-md lg:flex">
        <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
        <div>
          <strong className="block text-xs text-white">US Enterprise Standard</strong>
          <small className="block font-mono text-[9px] text-slate-400">SOC2 · Zero-Trust · 99.98% SLA</small>
        </div>
      </div>
    </div>
  );
}
