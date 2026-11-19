"use client";

import { useState } from "react";

export function SystemPreview() {
  const [activeTab, setActiveTab] = useState<"construction" | "agents" | "integration">("construction");

  return (
    <div className="system-preview" aria-label="Interactive preview of an enterprise AI and ConTech operational system">
      <div className="preview-frame">
        {/* Top Window Bar */}
        <div className="preview-toolbar">
          <div className="preview-window-dots">
            <span className="dot red" />
            <span className="dot amber" />
            <span className="dot green" />
          </div>
          <div className="preview-tabs">
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "construction" ? "active" : ""}`}
              onClick={() => setActiveTab("construction")}
            >
              BIM & Jobsite AI
            </button>
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "agents" ? "active" : ""}`}
              onClick={() => setActiveTab("agents")}
            >
              Multi-Agent Swarm
            </button>
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "integration" ? "active" : ""}`}
              onClick={() => setActiveTab("integration")}
            >
              ERP / Procore Sync
            </button>
          </div>
          <div className="preview-status">
            <span className="live-pulse" />
            <span>US-EAST · 99.99% HEALTH</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="preview-content">
          <div className="preview-eyeline">
            <div className="preview-serial-tag">
              <span className="serial-icon">⚡</span>
              <span>LITERARYWORKS ENGINE v4.2</span>
            </div>
            <span className="preview-timestamp">LATENCY: 12ms · SOC2 MONITORED</span>
          </div>

          <div className="preview-heading">
            {activeTab === "construction" && (
              <>
                Automated Takeoffs &amp; BIM Coordination.
                <strong> Zero field guesswork.</strong>
              </>
            )}
            {activeTab === "agents" && (
              <>
                Autonomous Multi-Agent Workflow Execution.
                <strong> Governed at every step.</strong>
              </>
            )}
            {activeTab === "integration" && (
              <>
                Unified Legacy &amp; Cloud ERP Synchronization.
                <strong> Real-time data pipeline.</strong>
              </>
            )}
          </div>

          {/* 3-Step Interactive Process Simulation */}
          <div className="preview-flow">
            <div className="flow-node">
              <div className="flow-node-header">
                <span className="node-step">01</span>
                <span className="node-type">INGESTION</span>
              </div>
              <div className="flow-node-body">
                <strong>
                  {activeTab === "construction"
                    ? "CAD / Blueprints & RFIs"
                    : activeTab === "agents"
                    ? "Enterprise Knowledge Store"
                    : "Procore & SAP Data Stream"}
                </strong>
                <p>
                  {activeTab === "construction"
                    ? "Vectorized PDF takeoffs & clash detection"
                    : activeTab === "agents"
                    ? "RAG embeddings across secure documents"
                    : "Bi-directional event webhook triggers"}
                </p>
              </div>
              <div className="flow-node-metric">
                <span>Verified</span>
                <span className="metric-badge green">100% Ingested</span>
              </div>
            </div>

            <div className="flow-connector">
              <span className="connector-laser" />
            </div>

            <div className="flow-node flow-ai">
              <div className="flow-node-header">
                <span className="node-step">02</span>
                <span className="node-type highlight">AI REASONING</span>
              </div>
              <div className="flow-node-body">
                <strong>
                  {activeTab === "construction"
                    ? "Estimating & Schedule AI"
                    : activeTab === "agents"
                    ? "Agent Swarm Evaluation"
                    : "Automated Reconciliation"}
                </strong>
                <p>
                  {activeTab === "construction"
                    ? "Calculates materials, cost variance & risks"
                    : activeTab === "agents"
                    ? "Generates proposed actions with audit citations"
                    : "Resolves schema anomalies & validates GL codes"}
                </p>
              </div>
              <div className="flow-node-metric">
                <span>Inference</span>
                <span className="metric-badge amber">14.2ms High Acc.</span>
              </div>
            </div>

            <div className="flow-connector">
              <span className="connector-laser" />
            </div>

            <div className="flow-node flow-approval">
              <div className="flow-node-header">
                <span className="node-step">03</span>
                <span className="node-type">EXECUTIVE GATE</span>
              </div>
              <div className="flow-node-body">
                <strong>Human-in-the-Loop Check</strong>
                <p>
                  {activeTab === "construction"
                    ? "PM approves change-order & takeoff packet"
                    : activeTab === "agents"
                    ? "Stakeholder 1-click authorization required"
                    : "Automated sign-off routed to lead engineer"}
                </p>
              </div>
              <div className="flow-node-metric">
                <span>Governance</span>
                <span className="metric-badge blue">Air-tight</span>
              </div>
            </div>
          </div>

          {/* Footer Bar inside terminal */}
          <div className="preview-foot">
            <div className="preview-foot-icon">⬡</div>
            <div className="preview-foot-copy">
              <strong>Enterprise Operating System Architecture</strong>
              <span>
                Engineered for General Contractors, Developers, and US High-Growth Enterprises
              </span>
            </div>
            <div className="preview-cta-tag">READY FOR DEPLOYMENT</div>
          </div>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="preview-floating-tag tag-top">
        <span className="floating-badge-icon">🏗️</span>
        <div>
          <strong>BIM &amp; ConTech Ready</strong>
          <small>Automated Takeoff &amp; RFI Pipelines</small>
        </div>
      </div>

      <div className="preview-floating-tag tag-bottom">
        <span className="floating-badge-pulse" />
        <div>
          <strong>US Enterprise Standard</strong>
          <small>SOC2 · Zero-Trust · 99.98% SLA</small>
        </div>
      </div>
    </div>
  );
}
