"use client";

import { useState } from "react";

export function BlueprintGraphic() {
  const [activeLayer, setActiveLayer] = useState<"structural" | "mep" | "telemetry">("structural");

  return (
    <div className="blueprint-graphic" aria-label="Interactive architectural CAD schematic and digital twin visualization">
      <div className="blueprint-hud-header">
        <div className="hud-title">
          <span className="hud-icon">📐</span>
          <span>BIM / CAD DIGITAL SCHEMATIC · PROTOTYPE 04</span>
        </div>
        <div className="hud-toggles">
          <button
            type="button"
            className={`hud-toggle ${activeLayer === "structural" ? "active" : ""}`}
            onClick={() => setActiveLayer("structural")}
          >
            Structural Frame
          </button>
          <button
            type="button"
            className={`hud-toggle ${activeLayer === "mep" ? "active" : ""}`}
            onClick={() => setActiveLayer("mep")}
          >
            MEP Conduits
          </button>
          <button
            type="button"
            className={`hud-toggle ${activeLayer === "telemetry" ? "active" : ""}`}
            onClick={() => setActiveLayer("telemetry")}
          >
            IoT Telemetry
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 640 460"
        role="img"
        aria-label="Isometric CAD model with structural framing and laser scan lines"
        xmlns="http://www.w3.org/2000/svg"
        className="blueprint-svg"
      >
        <defs>
          <pattern id="cad-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="0.75" />
          </pattern>
          <linearGradient id="laserBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ff6b00" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Blueprint background grid */}
        <rect x="0" y="0" width="640" height="460" fill="url(#cad-grid)" />

        {/* Base Foundation Slab Isometric Grid */}
        <g fill="none" stroke="#1d3b5c" strokeWidth="1.2">
          <path d="M70 330 L320 440 L570 300 L320 190 Z" />
          <path d="M110 334 L320 422 L530 300" strokeDasharray="3 3" />
          <path d="M150 338 L320 404 L490 300" strokeDasharray="3 3" />
          <path d="M70 330 V350 L320 460 L570 320 V300" />
          <path d="M320 440 V460" />
        </g>

        {/* 3D Structural Frame (Towers & Cross Trusses) */}
        <g fill="#0c182c" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round">
          {/* Main Tower Central Core */}
          <path d="M190 200 L320 130 L450 200 L320 270 Z" fill="#0f223d" />
          <path d="M190 200 L320 270 V380 L190 310 Z" fill="#0b1b33" />
          <path d="M320 270 L450 200 V310 L320 380 Z" fill="#081426" />
        </g>

        {/* Diagonal Cross-Bracing Trusses */}
        {activeLayer === "structural" && (
          <g stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="4 2">
            <line x1="190" y1="200" x2="320" y2="380" />
            <line x1="190" y1="310" x2="320" y2="270" />
            <line x1="320" y1="270" x2="450" y2="310" />
            <line x1="320" y1="380" x2="450" y2="200" />
          </g>
        )}

        {/* MEP Conduit Lines */}
        {activeLayer === "mep" && (
          <g fill="none" stroke="#00f0ff" strokeWidth="2.5">
            <path d="M130 360 L230 310 L320 350 L420 300 L510 340" />
            <path d="M230 310 V220 L320 170 V120" />
            <circle cx="230" cy="310" r="5" fill="#ff6b00" />
            <circle cx="320" cy="350" r="5" fill="#00f0ff" />
            <circle cx="420" cy="300" r="5" fill="#ff6b00" />
          </g>
        )}

        {/* IoT Telemetry Nodes & Heatmap */}
        {activeLayer === "telemetry" && (
          <g>
            <circle cx="320" cy="130" r="14" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1.5" />
            <circle cx="320" cy="130" r="4" fill="#00f0ff" />
            <circle cx="190" cy="200" r="12" fill="rgba(255, 107, 0, 0.2)" stroke="#ff6b00" strokeWidth="1.5" />
            <circle cx="190" cy="200" r="4" fill="#ff6b00" />
            <circle cx="450" cy="200" r="12" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="450" cy="200" r="4" fill="#22c55e" />
          </g>
        )}

        {/* Architectural Dimension Callouts & Coordinate Labels */}
        <g stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" fill="none">
          <line x1="70" y1="330" x2="70" y2="170" />
          <line x1="190" y1="200" x2="190" y2="120" />
          <line x1="70" y1="170" x2="190" y2="120" />
        </g>

        {/* Technical Callout Badges */}
        <g fill="#f8fafc" fontFamily="monospace" fontSize="10">
          <rect x="40" y="145" width="120" height="22" rx="3" fill="#08101e" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="50" y="160" fill="#38bdf8">ELEV: +142.50 FT</text>

          <rect x="475" y="170" width="130" height="22" rx="3" fill="#08101e" stroke="#ff6b00" strokeWidth="0.8" />
          <text x="485" y="185" fill="#ff6b00">BIM CLASH: 0 DETECTED</text>

          <rect x="235" y="425" width="170" height="22" rx="3" fill="#08101e" stroke="#22c55e" strokeWidth="0.8" />
          <text x="245" y="440" fill="#22c55e">FOUNDATION: REINFORCED</text>
        </g>
      </svg>

      <div className="blueprint-graphic-footer">
        <div className="meta-item">
          <span>COORDINATES</span>
          <strong>37.7749° N, 122.4194° W</strong>
        </div>
        <div className="meta-item">
          <span>TOLERANCE</span>
          <strong>±0.012 INCHES (LASER VERIFIED)</strong>
        </div>
        <div className="meta-item">
          <span>DATA COMPLIANCE</span>
          <strong>AEC / PROCORE READY</strong>
        </div>
      </div>
    </div>
  );
}
