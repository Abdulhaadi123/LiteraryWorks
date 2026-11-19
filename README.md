# LiteraryWorks — US-focused technology website

A technology-first, responsive LiteraryWorks site using Next.js App Router, TypeScript, and code-generated Three.js 3D storytelling. Brand palette: midnight navy `#101E30`, champagne gold `#C69A58`, warm ivory `#F5F1E9`.

## Positioning

- **Primary:** AI agents, automation, custom software and SaaS, integrations, cloud, web/mobile engineering and AI advisory — targeting US businesses.
- **Secondary:** exploratory physical construction coordination and construction technology. Actual regulated work depends on verified partners, licensing, insurance and geographic availability.
- Written to avoid fabricated clients, unverifiable performance claims or assertions of US licenses/offices.

## Start locally

```bash
npm install
npm run dev
# open http://localhost:3000
npm run typecheck
npm run build
```

Requirements: Node 20.9+ and an npm connection for installing dependencies.

## Skill implementation: scroll-driven 3D storytelling

The attached `SKILL: Scroll-driven 3D storytelling (Next.js + three.js + GSAP + Lenis)` is implemented through:

1. `app/layout.tsx`: inline opt-in `html.motion` bootstrap for `min-width:64rem` and reduced-motion preference. 8-second watchdog restores static content when motion does not boot.
2. `motion/loadMotion.ts`: dynamic GSAP + ScrollTrigger + Lenis import **only for opted-in desktop**, sync Lenis with GSAP ticker; supports scroll locking.
3. `motion/MotionEngine.tsx`: reusable attribute-driven animations (`data-reveal`, `data-stagger`, `data-wipe`, `data-parallax`, `data-split`, `data-counter`, `data-marquee`, `data-progress`).
4. `motion/stage.ts`: shared Three.js renderer, ACES tonemapping, sRGB, lighting, code-only RoomEnvironment PMREM, pixel ratio <=2, camera offset, projection and disposal.
5. `motion/scenes/aiSystem.ts`: procedural platform, 3D AI core, systems/modules, animated connectivity, projected model anchors. `setProgress(p)` is deterministic for forward/backward scrubbing.
6. `motion/Stage3D.tsx`: reusable lazy scene boundary, 150% viewport prefetch and idle startup, `compileAsync` prewarming, single ScrollTrigger, sticky runway (no GSAP pin), label tracking, render only in viewport, failure/static fallback.
7. `app/globals.css`: no-JS, mobile, reduced-motion and WebGL-failure fallbacks are plain visible HTML/CSS. Mobile and tablet should not download three, GSAP or Lenis.

The static experience is complete in ordinary HTML; visual polish is progressive enhancement. No downloaded 3D model files.

## Inquiry delivery — configuration required

The `/contact` form posts to `/api/inquiry`, which validates fields and uses Resend's API to deliver **plain-text** emails. It does **not** report success until the email provider accepts the message. Copy `.env.example` to `.env.local`, supply:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` (verified destination)
- `CONTACT_FROM_EMAIL` (verified sender in Resend)
- `NEXT_PUBLIC_SITE_URL` (verified website domain for SEO/sitemap)

Without these, the endpoint responds with HTTP 503 and a transparent message: the inbox is not configured. Before production: add IP-rate limiting, bot protection if needed, security logging without sensitive form content, verified service/territory information, a full privacy policy and approved legal business details.

## Pre-launch checklist

- [ ] Run `npm install`, `npm run typecheck`, `npm run build` in a network-enabled environment.
- [ ] Test a production build on desktop WebGL, phone/tablet, no WebGL, JavaScript disabled and `prefers-reduced-motion`.
- [ ] Verify no three.js, GSAP or Lenis chunks load on mobile.
- [ ] Check Back/Forward navigation and contact form with a configured inbox.
- [ ] Set website domain, real business identity, contact address, policies and service territory.
- [ ] Verify construction licensing, actual partners, insurance and project eligibility before marketing actual contracting work.
- [ ] Revisit US state-specific disclosure requirements with counsel.

This is the first implementation, not a live production deployment.
