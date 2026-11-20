# LiteraryWorks

The LiteraryWorks website: AI, software and cloud engineering for U.S. businesses. Built with Next.js (App Router), React, Tailwind CSS v4, TypeScript, and scroll-driven 3D scenes made with three.js, GSAP and Lenis. Every 3D object is built in code: there are no model files.

## Run it

```bash
npm ci --ignore-scripts     # or: npm install
npm run dev                 # http://localhost:3000
npm run typecheck
npm run build && npm run start
```

Node 20.9 or newer. The build needs no network access: the typeface is in the repository.

**To see the 3D scenes, use the production build (`npm run build && npm run start`).** `npm run dev` compiles each piece on first use, which can take longer than the page's safety timer allows, and the page then falls back to its static layout.

## What is on the site

| Page | What it is |
| --- | --- |
| `/` | A pinned 3D story: six kinds of software float loose, gather around an AI core, are wired together by beams and pulses, then close up into one product dashboard. Then the sectors, the approach, the services as a rotating 3D deck, the four phases, the three ways to start, work, clients' words and questions |
| `/services`, `/services/[slug]` | A 3D deck that turns one place for each of the nine services; each service page opens with its own scene (its own cards around the AI core). Construction technology is one of the nine |
| `/work`, `/work/[slug]` | A 3D deck of the six case studies, then the wider portfolio; each case study on its own page |
| `/ai-audit` | The free 1-hour audit, the 14-day plan, pricing, guarantee and FAQ, under its own 3D scene |
| `/about`, `/contact`, `/privacy` | About (with a scene), the inquiry form, a short privacy notice |

All words live in `lib/content.ts`, `lib/service-pages.ts` and `lib/services.ts`; which cards each page's scene draws, and their tags, are in `lib/scenes.ts`; the home page's story is in `app/page.tsx`.

## Look and feel

- **Type: Inter**, the typeface Sparkix and FAYD use. One variable file in `app/fonts/` (27 kB: weights 400 to 800 and the Western European characters; how it was made is in `app/fonts/README.txt`), loaded with `next/font/local`, so it is preloaded, self-hosted and has a size-matched fallback (no layout shift). Inter is under the SIL Open Font License (`app/fonts/LICENSE-Inter-OFL.txt`).
- **Colour:** white is the main colour. One clear blue (`#2563EB`, deeper `#1D4ED8`) carries actions, emphasis and the 3D scenes; a deep blue (`#0B2A5B`) carries the dark bands (the services deck, the footer); ink `#0B1B33` and slate for text. The brand green `#73C94A` is kept for the logo's "W" and small "live" details only.
- **Shapes:** friendly and modern. Pill buttons (no arrows, no chips; a light sweeps across them on hover), 26 px card radii with soft blue shadows, gradient icon chips (`components/icons.tsx`), numbered steps joined by a dashed line, a featured pricing card, case cards with a gradient head, testimonials with avatars. The emphasised words in a headline are a blue gradient.
- **Header:** a floating pill bar inset from the edges with the links centred (the same idea as FAYD's), which gets a little more solid once the page moves. On phones a round menu button opens a panel under the bar, and a booking button appears at the bottom once the opening screen is left.
- **Logo:** a navy "L" holding a green "W" with a two-line "Literary / Works" wordmark: `components/Logo.tsx`; files in `public/brand/`.
- **Outside the page:** a 1200x630 share picture (`public/og/literaryworks.jpg`), the iPhone icon (`app/apple-icon.png`), `favicon.ico` and `icon.svg`, plus structured data (Organization and WebSite) on the home page. `scripts/make-brand-assets.mjs` makes the first three.

## The scroll-driven 3D scenes

Two scene modules, one shared renderer.

- **`motion/scenes/system.ts` — "one connected system".** An AI core (a glossy blue sphere with a fine mesh, two orbits and a glowing rim) and the cards of what we build: web and mobile apps, an AI assistant, voice, workflows, data, cloud. Each card is a rounded glass panel with an interface drawn on its face (`motion/ui.ts`, 13 drawings: apps, assistant, voice, flows, data, cloud, saas, phone, wireframe, blueprint, browser, servers, report; skeleton lines instead of words, so nothing on them is a claim). The story: the cards float loose (the separate tools in most businesses), gather into a ring around the core, beams grow to each card and pulses run along them, then the cards close up into one dashboard with the core docked in its corner as the assistant, green lights coming on and waves going out. Each page picks its own cards (`lib/scenes.ts`, `systemVariants`): the home page has six, a service page three or four.
- **`motion/scenes/deck.ts` — a rotary deck.** One card per item on a drum; each place of scroll turns it one card, the card in front comes forward and the AI core above sends a beam to it, while the copy beside it describes it. The cards first fly in from all sides. Used for the nine services (`/`, `/services`) and the six case studies (`/work`), on a deep-blue runway.
- **One renderer for the whole site.** `motion/gl.ts` creates one WebGL renderer, one canvas and one studio-lighting environment; `motion/mountStage.ts` moves the canvas into whichever scene's stage is on screen. So the browser holds one graphics context however many scenes a page has (checked by the verify script: never zero, never two). `motion/kit.ts` holds the shared parts (glass panels with a soft shadow, the core, beams) and `motion/engine.ts` the stage (camera, light, projection).
- **Everything is a pure function of the scroll progress `p`**, so scrubbing forwards and backwards is exact. The shapes keep the same fixed topology and only their transforms change.
- **Pages with a scene.** `components/Xp.tsx` is a tall section with a sticky stage (no GSAP pin); one ScrollTrigger with `scrub: 1.5` feeds `setProgress(p)`; inside a scene a wheel notch moves the page 0.68 of its usual distance (`data-pace`). The copy of each beat fades in and out beside the picture (`Phase`), a fine progress track on the left shows the chapter, and the pointer tilts the camera a few degrees on desktop. Tags (numbered pills with a leader line) follow the cards. Inner pages use `components/SceneHero.tsx` (a short 320vh scene with the headline, two chapters and a closing call to action); the decks are `components/ServicesDeck.tsx`.
- **The layout adapts.** The copy is on the left; the scene takes the room to its right, below the floating header (`layout({ left, right, top, bottom })`); the camera distance is fitted to that room, so the picture is as large as it can be at 1024, 1280x640, 1440 and 2560 px. On a very wide screen everything stays within 1680 px. The verify script checks the picture never runs over the copy or the header.
- **Motion is opt-in.** A tiny script in `<head>` (`motion/head.ts`) sets `html.motion` only on wide screens (64rem and up) when the visitor has not asked for reduced motion, is not saving data or on 2G, and is not on a device with 2 GB of memory or less. It removes the class again after 8 seconds if the engine has not started. Everything that is hidden until animated lives under `html.motion:not(.motion-ready)`.
- **Phones, tablets and reduced motion** get plain markup and real still pictures of the scene (`public/scene/*.webp`, rendered from the scene itself by `scripts/make-posters.mjs`), plus light CSS animation. A deck gives way to the plain card list; an inner page's scene gives way to its headline block. They download no three.js, GSAP, Lenis or scene runtime (checked by the verify script). If WebGL is missing, each scene steps aside the same way, at once, before anything is built.
- **Lazy loading.** `motion/gsap.ts` imports GSAP only where `html.motion` is set; `motion/mountStage.ts` and each scene are separate chunks fetched in an idle moment, about a screen and a half before the scene is reached. A scene builds in steps with a pause between them, so scrolling is never blocked by the whole build, compiles its shaders before the first frame, and draws only while its section is on screen and the scroll has moved.
- **Drawing quality adapts.** The picture is drawn at the screen's pixel ratio (at most 1.75). If the graphics card cannot keep up while scrolling (ten frames in a row slower than about 28 a second) it steps down a quarter at a time, to 1.
- **Declarative layer** (`motion/MotionEngine.tsx`): `data-reveal`, `data-stagger`, `data-wipe`, `data-parallax`, `data-split`, `data-pace`.
- **Developer switches.** `/?stats` makes the page print what the 3D scene costs (read `window.__lw3d()` after scrolling); `/?still` switches off the pointer and the adaptive quality so the stills are exact. Run `node scripts/make-posters.mjs http://127.0.0.1:3000` against a running production build to refresh the stills whenever the scene changes, then `node scripts/make-brand-assets.mjs`.

## Speed

Measured with `node scripts/perf-report.mjs` (headless Chrome on a laptop; the phone profile is slow 4G and a 4x slower processor), production build. See the report for current numbers; the design rules that keep it small and quick are:

no three.js, GSAP or Lenis on phones; the scenes load only where motion is on, never before the page is usable; one 27 kB variable font; hand-written CSS; no third-party requests of any kind (verified); pictures with fixed sizes and `srcset` (the first-frame still is lazy, so a phone never fetches it); the home link is not prefetched, so no other page downloads the hero picture; static pages everywhere except the inquiry API; no backdrop blur on phones; one WebGL context shared by every scene. Response headers (`next.config.ts`): `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, HSTS, and a day of caching for the stills and brand files. ScrollTrigger keeps its own 60 Hz timer running while it is loaded (about 0.2% of one processor); that is how the library works.

Honest limits: the numbers come from one laptop and a software renderer for the 3D (a "blocking time" for a desktop page that the report shows is the software renderer at work, not a real graphics card). Check on a real machine and with PageSpeed Insights once deployed.

## Inquiry form

`/contact` posts to `/api/inquiry`, which validates the fields and sends a plain-text email with Resend. It reports success only when Resend accepts the message. It also limits one address to 8 requests in ten minutes (in memory: a real limit on a long-running server; on a serverless host each instance counts for itself, so add the platform's rate limiting too). Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL`. Without them the API answers 503 and says the inbox is not configured. Set real keys on the hosting platform, not on a shared or untrusted machine.

## Verify a build

```bash
npm run build && npm run start -- -p 3000        # one terminal
node scripts/verify-production.mjs http://127.0.0.1:3000
node scripts/perf-report.mjs http://127.0.0.1:3000
```

The scripts need only Node 22 and Chrome (set `CHROME_PATH` if it is not found; set `SOFTWARE_GL=1` or `CI=true` when there is no GPU). `verify-production.mjs` checks: every page in the sitemap (title, one `h1`); on desktop every pinned 3D scene on the site (it builds, the copy changes as you scroll, the tags show, the picture is drawn and moves with the scroll, one shared canvas sits in the scene on screen, no failed requests, nothing requested from another site); that the picture stays clear of the copy and the header at four window sizes; that moving between pages rebuilds the scenes without leaking canvases or WebGL contexts, and that resizing keeps the picture the size of its stage; the phone and reduced-motion fallbacks (no 3D or animation libraries downloaded, the hero picture loads, the plain list takes a deck's place, a script budget, no sideways scroll); JavaScript off; a browser with WebGL switched off (the static layout takes over at once); and the API's validation and rate limit. It saves screenshots to `previews/`. `.github/workflows/production-verify.yml` runs it and the speed report on every push and pull request.

## Before launch

- [ ] Set the real domain (`NEXT_PUBLIC_SITE_URL`) and the Resend variables.
- [ ] Confirm the claims: the prices and the money-back guarantee on `/ai-audit` and the home page, the case-study figures, and the client names and quotes (they come from the Sparkix and FAYD work). Replace or remove anything that LiteraryWorks may not show under its own name.
- [ ] Add the business's legal name, contact details and a reviewed privacy notice (`app/privacy/page.tsx` is a short draft).
- [ ] Construction is one of nine services and the site describes software and technology services for it only. Do not present on-site contracting until licensing, insurance and partners are confirmed.
- [ ] Add the hosting platform's rate limiting in front of `/api/inquiry`.
- [ ] Test on a real phone and a real GPU: scroll feel, the pinned scenes, Back and Forward.
