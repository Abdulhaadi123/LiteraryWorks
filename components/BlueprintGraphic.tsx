export function BlueprintGraphic() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#0f2438] p-6 shadow-xl" aria-label="Illustration of an architectural building and construction planning grid">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[11px] text-slate-300">
        <span>ARCHITECTURAL &amp; MEP COORDINATION</span>
        <span className="text-[#e8d7b8]">DIGITAL PRECISION</span>
      </div>

      <svg
        viewBox="0 0 580 440"
        role="img"
        aria-label="Isometric architectural building design"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
      >
        <defs>
          <pattern id="bp-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="#38546d" strokeWidth="0.6" opacity="0.3" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="580" height="440" fill="url(#bp-grid)" />

        {/* Foundation Grid */}
        <g fill="none" stroke="#52728c" strokeWidth="1.1" opacity="0.7">
          <path d="M80 300 278 400 510 270 311 170 80 300Z" />
          <path d="M105 303 280 388 484 270" />
          <path d="M126 306 279 380 465 270" />
          <path d="M123 336 277 415 510 288" />
          <path d="M277 415V388" />
          <path d="M80 300v20l43 18" />
        </g>

        {/* Isometric Building Volume */}
        <g strokeLinejoin="round" stroke="#e2e8f0" strokeWidth="2">
          <path d="m147 145 159-85 154 84-158 87Z" fill="#ffffff" />
          <path d="m147 145 155 86v138L147 285Z" fill="#e2e8f0" />
          <path d="m302 231 158-87v138l-158 87Z" fill="#cbd5e1" />
        </g>

        {/* Structural Divisions */}
        <g fill="none" stroke="#64748b" strokeWidth="1.4">
          <path d="M147 185 302 271 460 184M147 228 302 313 460 225M147 265l155 86 158-87" />
          <path d="M191 168v139M244 197v140M354 203v140M406 173v140" />
        </g>

        {/* Highlight Accents */}
        <path d="m302 231 158-87" stroke="#c29b61" strokeWidth="3" />
        <path d="M302 231v138" stroke="#c29b61" strokeWidth="3" />

        {/* Drafting Callouts */}
        <g stroke="#c29b61" strokeWidth="1" fill="none">
          <path d="M334 80 422 35h99" />
          <path d="M390 315l95 44h55" />
        </g>

        <g fill="#c29b61">
          <circle cx="334" cy="80" r="4" />
          <circle cx="390" cy="315" r="4" />
        </g>

        <g fill="#e8d7b8" fontFamily="sans-serif" fontSize="11" letterSpacing="1.5">
          <text x="422" y="27">STRUCTURE / 01</text>
          <text x="477" y="350">SYSTEMS / 02</text>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>PHYSICAL PROJECTS</span>
        <span>DIGITAL PRECISION</span>
      </div>
    </div>
  );
}
