# LiteraryWorks

The LiteraryWorks website: AI, software and cloud engineering for U.S. businesses. Built with Next.js (App Router), React, Tailwind CSS v4, TypeScript, and a scroll-driven 3D story made with three.js, GSAP and Lenis. Every 3D model is built in code: there are no model files.

## Run it

```bash
npm ci --ignore-scripts     # or: npm install
npm run dev                 # http://localhost:3000
npm run typecheck
npm run build && npm run start
```

Node 20.9 or newer. The build needs no network access: the typeface is in the repository.

**To see the 3D story, use the production build (`npm run build && npm run start`).** `npm run dev` compiles each piece on first use, which can take longer than the page's safety timer allows, and the page then falls back to its static layout.

## What is on the site

| Page | What it is |
| --- | --- |
| `/` | The story. One system, built like a precision instrument, opens into seven layers (web and mobile apps, UI/UX, AI and voice, workflow automation, data, integrations, cloud and security) and closes again exactly as it was. Then the approach, the services as an index, the four phases, the three ways to start, work, clients' words and questions |
| `/ai-audit` | The free 1-hour audit, the 14-day plan, pricing, guarantee, FAQ |
| `/services`, `/services/[slug]` | Nine services, all on the same template (construction technology is one of them) |
| `/work`, `/work/[slug]` | Six case studies and a wider portfolio |
| `/about`, `/contact`, `/privacy` | About, the inquiry form, a short privacy notice |

All words live in `lib/content.ts`, `lib/service-pages.ts` and `lib/services.ts`; the 3D labels are in `lib/scenes.ts`; the home page's story is in `app/page.tsx`.

## Look and feel

- **Type: Inter**, the typeface Sparkix and FAYD use. One variable file in `app/fonts/` (27 kB: weights 400 to 800 and the Western European characters; how it was made is in `app/fonts/README.txt`), loaded with `next/font/local`, so it is preloaded, self-hosted and has a size-matched fallback (no layout shift). Inter is under the SIL Open Font License (`app/fonts/LICENSE-Inter-OFL.txt`), which allows keeping it, and reducing it, in the repository.
- **Colour:** white is the main colour. Navy `#22425F` (the brand blue) carries headings and actions, one clear blue `#2563C4` marks emphasis, slate and ink for text. The brand green `#73C94A` is kept for the logo's "W" and small "live" details only. The axe accessibility rules find no contrast failures (the few areas over gradients and translucent bars, which axe cannot judge, were checked by hand).
- **Shapes:** calm. Small radii, hairline rules, editorial layouts instead of boxes (the services are an index, not a card grid). Buttons have no arrows or chips; a light sweeps across them on hover.
- **Header:** a floating bar inset from the edges with the links centred (the same idea as FAYD's), which gets a little more solid once the page moves. On phones a round menu button opens a panel under the bar, and a booking button appears at the bottom once the opening screen is left.
- **Logo:** a navy "L" holding a green "W" with a two-line "Literary / Works" wordmark: `components/Logo.tsx`; files in `public/brand/`.
- **Outside the page:** a 1200x630 share picture (`public/og/literaryworks.jpg`), the iPhone icon (`app/apple-icon.png`), `favicon.ico` and `icon.svg`, plus structured data (Organization and WebSite) on the home page. `scripts/make-brand-assets.mjs` makes the first three.

## The scroll-driven 3D story

The idea comes from the watch story in the brief ("The Precision Assembly"): the finished object separates into clean parallel layers along one axis, nothing flies away, the middle of the scroll is the fully opened view, and then every part retraces its own path so the last frame is the first frame. Here each layer is one of the things we build.

- **The scene** is `motion/scenes/assembly.ts`: crystal with a drawn app on it (web and mobile), a bezel (design), a core with a ring that listens (AI and voice), five meshing gears (workflow automation), a machined plate with bridges and databases (data), the case with a crown and pushers that slide out (integrations), and a base with a shield (cloud and security). A thin ring of light passes down through the layers as they open (the audit).
- **It closes exactly.** Everything is a pure function of the scroll progress `p`; the opening is a function of `min(p, 1 - p)`, so the second half is the first half played backwards. Gears turn a whole number of teeth and their spokes repeat within that, so they end where they began. `scripts/verify-production.mjs` compares the last frame with the first (mean difference under 0.3 of 255).
- **Motion is opt-in.** A tiny script in `<head>` (`motion/head.ts`) sets `html.motion` only on wide screens (64rem and up) when the visitor has not asked for reduced motion, is not saving data or on 2G, and is not on a device with 2 GB of memory or less. It removes the class again after 8 seconds if the engine has not started. Everything that is hidden until animated lives under `html.motion:not(.motion-ready)`.
- **Phones, tablets and reduced motion** get plain markup and real still pictures of the model (`public/scene/*.webp`, rendered from the scene itself by `scripts/make-posters.mjs`), plus light CSS animation. They download no three.js, GSAP, Lenis or scene runtime (checked by the verify script). If WebGL is missing the section steps aside the same way.
- **Lazy loading.** `motion/gsap.ts` imports GSAP only where `html.motion` is set; `motion/mountStage.ts` (the scene's runtime) and the scene itself are separate chunks fetched in an idle moment. The model builds in steps with a pause between them, so scrolling is never blocked by the whole build, compiles its shaders before the first frame, and draws only while its section is on screen and the scroll has moved.
- **Drawing quality adapts.** The picture is drawn at the screen's pixel ratio (at most 1.75). If the graphics card cannot keep up while scrolling (ten frames in a row slower than about 28 a second) it steps down a quarter at a time, to 1.
- **The layout adapts.** The copy is on the left, the labels in a column on the right, and the model takes the room between them: more while it is closed, less while it is open and the labels show. On a very wide screen everything stays within 1680 px so the labels do not drift away. The verify script checks that the model never runs over the copy at 1024, 1440 and 2560 px.
- **The runway.** `components/Xp.tsx` is a tall section with a sticky stage (no GSAP pin). One ScrollTrigger with `scrub: 1.5` feeds `setProgress(p)`; inside the scene a wheel notch moves the page 0.68 of its usual distance (`data-pace`). A fine progress track on the left (after a watch's minute track) shows the chapter; a small reticle follows the pointer over the model on desktop.
- **Declarative layer** (`motion/MotionEngine.tsx`): `data-reveal`, `data-stagger`, `data-wipe`, `data-parallax`, `data-split`, `data-pace`.
- **Developer switches.** `/?stats` makes the page print what the 3D scene costs (read `window.__lw3d()` after scrolling); `/?still` hides the floor's pool of light so the stills have clean edges. Run `node scripts/make-posters.mjs http://127.0.0.1:3000` against a running production build to refresh the stills whenever the scene changes, then `node scripts/make-brand-assets.mjs`.

## Speed

Measured with `node scripts/perf-report.mjs` (headless Chrome on a laptop; the phone profile is slow 4G and a 4x slower processor), production build:

| | Phone, home | Phone, other pages | Desktop, home |
| --- | --- | --- | --- |
| Largest paint | about 1.7 to 2.2 s | about 1.0 to 1.35 s | about 0.3 to 0.7 s |
| Layout shift | 0 | 0 | 0 |
| Script | 144 kB | 142 kB | 347 kB (includes the 3D scene, 150 kB) |
| Images | 120 kB (two stills, loaded as needed) | none | 58 kB |
| Fonts / CSS | 27 kB / 10 kB | 27 kB / 10 kB | 27 kB / 10 kB |
| Everything | 332 kB | 185 to 215 kB | 497 kB |

The 3D scene draws 163 calls and about 129,000 triangles a frame (shadow pass included), at most 90 geometries and 10 textures; building the model takes about 130 ms of work, in steps.

What keeps it small and quick: no three.js, GSAP or Lenis on phones; the scene loads only where motion is on, never before the page is usable; one 27 kB variable font; hand-written CSS; no third-party requests of any kind (verified); pictures with fixed sizes and `srcset`; the home link is not prefetched, so no other page downloads the hero picture; static pages everywhere except the inquiry API; no backdrop blur on phones. Response headers (`next.config.ts`): `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, HSTS, and a day of caching for the stills and brand files. ScrollTrigger keeps its own 60 Hz timer running while it is loaded (about 0.2% of one processor); that is how the library works.

Honest limits: these numbers come from one laptop and a software renderer for the 3D (a "blocking time" for the desktop home page that the report shows is the software renderer at work, not a real graphics card). Check on a real machine and with PageSpeed Insights once deployed.

## Inquiry form

`/contact` posts to `/api/inquiry`, which validates the fields and sends a plain-text email with Resend. It reports success only when Resend accepts the message. It also limits one address to 8 requests in ten minutes (in memory: a real limit on a long-running server; on a serverless host each instance counts for itself, so add the platform's rate limiting too). Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL`. Without them the API answers 503 and says the inbox is not configured. Set real keys on the hosting platform, not on a shared or untrusted machine.

## Verify a build

```bash
npm run build && npm run start -- -p 3000        # one terminal
node scripts/verify-production.mjs http://127.0.0.1:3000
node scripts/perf-report.mjs http://127.0.0.1:3000
```

The scripts need only Node 22 and Chrome (set `CHROME_PATH` if it is not found; set `SOFTWARE_GL=1` or `CI=true` when there is no GPU). `verify-production.mjs` makes 60-odd checks: every page in the sitemap; on desktop the 3D scene (it builds, the copy changes, all seven labels show when opened, the last frame matches the first, no failed requests, nothing requested from another site); that the model stays clear of the copy at three window sizes; that going away from the home page and back, twice, rebuilds the scene without leaking canvases or WebGL contexts, and that resizing keeps the picture the size of its stage; the phone and reduced-motion fallbacks (no 3D or animation libraries downloaded, the hero picture loads, a script budget, no sideways scroll); a browser with WebGL switched off (the static layout takes over); JavaScript off; and the API's validation and rate limit. It saves screenshots to `previews/`. `.github/workflows/production-verify.yml` runs it and the speed report on every push and pull request.

Also run during the audit (with tools kept outside the repository): the axe accessibility rules (WCAG 2.x A and AA plus best practice) on the main pages on a phone, on a desktop with reduced motion and in the 3D layout, with no failures; every page's markup, metadata, headings and all 430 internal links and anchors, with no issues; overflow and clipped text on every page at 13 widths from 320 to 2560 px, with none.

## Before launch

- [ ] Set the real domain (`NEXT_PUBLIC_SITE_URL`) and the Resend variables.
- [ ] Confirm the claims: the prices and the money-back guarantee on `/ai-audit` and the home page, the case-study figures, and the client names and quotes (they come from the Sparkix and FAYD work). Replace or remove anything that LiteraryWorks may not show under its own name.
- [ ] Add the business's legal name, contact details and a reviewed privacy notice (`app/privacy/page.tsx` is a short draft).
- [ ] Construction is one of nine services and the site describes software and technology services for it only. Do not present on-site contracting until licensing, insurance and partners are confirmed.
- [ ] Add the hosting platform's rate limiting in front of `/api/inquiry`.
- [ ] Test on a real phone and a real GPU: scroll feel, the pinned scene, Back and Forward.
