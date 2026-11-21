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
| `/` | A pinned 3D story whose object changes with each beat of the copy (our projects on a laptop, a tablet and a phone; an audit report; a robot arm; browser windows; a system handbook; a product dashboard), a scrolling band of what we build, the approach, the problem, the services as a 3D deck (one object per service), the four phases in full, before and after, results from our own projects, the sectors, the free hour, the three ways to start, the case studies as a pinned sideways reel, clients' words and questions |
| `/services`, `/services/[slug]` | A 3D deck with one real object for each of the nine services; each service page opens with that object, then a second one for the work in detail, then the book of our case studies open at the one that shows it in practice, then the audit report for the call to action; the work in detail, what changes, its own path as a timeline, a case study and related services follow. Construction technology is one of the nine (software for builders, shown as a pipeline board and a schedule, not a building) |
| `/work`, `/work/[slug]` | The six case studies as a book that turns to each one in turn (its story and results on the left page, its picture on the right), then the wider portfolio; each case study on its own page, with pictures |
| `/ai-audit` | The free 1-hour audit, the 14-day plan, before and after, pricing, guarantee and FAQ, under a 3D sequence: the audit report, a robot arm, a pipeline board, our projects on devices |
| `/about`, `/contact`, `/privacy` | About (a 3D sequence: a book of our principles, the written plan, our web apps, our projects on devices; then the principles and how we work with you), the inquiry form with the questions people ask first, a short privacy notice |

All words live in `lib/content.ts`, `lib/service-pages.ts` and `lib/services.ts`; the tags and the screen-reader description of each page's scene are in `lib/scenes.ts`; the home page's story is in `app/page.tsx`.

## Look and feel

- **Brand:** the colours of the brand guidelines: blue `#22425F`, green `#73C94A`, slate `#2B303F`, black `#191716`, on white pages with soft grey bands. Buttons are green pills with black text; a short green rule leads each kicker; a thin green line under the header shows how far down the page you are. The green "W" monogram pattern is in the footer. The look follows the Black Pearls site, which is built to the same guidelines.
- **Type: Inter**, one variable file in `app/fonts/` (27 kB: weights 400 to 800 and the Western European characters; how it was made is in `app/fonts/README.txt`), loaded with `next/font/local`, so it is preloaded, self-hosted and has a size-matched fallback (no layout shift). Inter is under the SIL Open Font License (`app/fonts/LICENSE-Inter-OFL.txt`). The brand font (Cabinet Grotesk) is licensed by Fontshare and its files cannot go in a public repository; if you add it, change one variable in `app/layout.tsx`.
- **Case studies** are shown like FAYD's: a picture, the tags, the three results and a link (`components/ui.tsx`, `CaseCards`, `components/CaseReel.tsx`). The pictures are in `public/cases/` and the project screens used inside the 3D scenes in `public/shots/`; they are our own projects, so some carry the Sparkix mark (and one case picture a FAYD logo): swap them for LiteraryWorks-only pictures before launch if that is not wanted.
- **Header:** a floating pill bar inset from the edges with the links centred, which gets a little more solid once the page moves. On phones a round menu button opens a panel under the bar, and a booking button appears at the bottom once the opening screen is left.
- **Logo:** a navy "L" holding a green "W" with a two-line "Literary / Works" wordmark: `components/Logo.tsx`; files in `public/brand/`.
- **Outside the page:** a 1200x630 share picture (`public/og/literaryworks.jpg`), the iPhone icon (`app/apple-icon.png`), `favicon.ico` and `icon.svg`, plus structured data (Organization and WebSite) on the home page. `scripts/make-brand-assets.mjs` makes the first three.

## The scroll-driven 3D scenes

Every beat of a pinned section has its own object, and every object is something real that belongs to what the copy beside it says: no abstract shapes. Each is a **model** in `motion/models/`, built in code (no model files), with our own projects on its screens and pages. They stand in one plain photo studio (a glossy white floor, three soft lights, soft shadows), and each does a little work as the page scrolls:

| Model | File | What it is |
| --- | --- | --- |
| Devices | `hero.ts` | a laptop, a tablet and a phone on stands, our projects on their screens, moving on to the next project as the page scrolls |
| Audit report | `report.ts` | a printed AI audit report in a navy folder; its checklist (workflow review, inefficiency map, AI opportunities, direction) is ticked one by one under a magnifying glass |
| Robot arm | `robot.ts` | a collaborative robot arm (inverse kinematics) moving requests from an inbox to a done tray, each checked, with our assistant on the screen behind (AI and automation) |
| Headset | `headset.ts` | a call-centre headset on its stand turning slowly beside a phone with a live call (AI voice systems) |
| Dashboard | `dashboard.ts` | a product dashboard (our SaaS projects) with usage bars, plans, accounts and a donut standing out of it as cards (SaaS platforms) |
| Warehouse | `warehouse.ts` | a shelf of stock whose labels a handheld scanner reads, beside a rugged tablet with our operations platforms (enterprise software, ERP) |
| Browsers | `windows.ts` | three browser windows, one behind the other, with web apps we built (AI web apps) |
| Phones | `phones.ts` | three of our apps on phones fanning out on a podium (AI mobile apps) |
| UI kit | `uikit.ts` | a wireframe that fills in beside a phone with the finished design, with a switch, a slider, a button, the colours and the type (UI and UX design) |
| Servers | `servers.ts` | four rack servers closing into one stack beside a build, test, deploy, monitor pipeline (cloud and DevOps) |
| Pipeline | `pipeline.ts` | a pipeline board on a stand, jobs moving from lead to estimate to contract to project, and a tablet with the schedule (construction technology: software for builders) |
| Book | `book.ts` | a hardcover lying open whose leaves turn and bend: the case studies (story and results left, picture right), the system handbook a client gets, or our principles |

`motion/scenes/system.ts` is the stage every page's scene shares (camera, tags, glow, dust): it loads the page's model, calls `model.set(a, l, p)` (`a`: how built it is, `l`: how much it is running, `p`: the scroll) and frames the box the model says it fills. `motion/scenes/deck.ts` is the sequence: a list of objects (`data.items`) with the points in the scroll where each takes over (`data.at`), one at a time, the camera moving on to the next as the copy moves on; each object works through its own beat. The first is built before the first frame, the rest in the background.ts` (colours, soft lights and shadows, outlines, pale glass, chrome and white metal, the nine service icons, tiles and screens, the plasma core, light columns, turning rings), `motion/models/real.ts` (materials, rounded boxes, turned parts, tubes, stands, soft shadows, the screen cross-fade) and `motion/stage.ts` (the dressing of every scene: a floor that mirrors the model and fades with distance, a faint grid and an instrument ring on it, coloured rim lights, soft out-of-focus colour). Soft floor shadows sit on a separate layer so they stay out of the mirror, and `fit.ts` leaves them out when it measures a model. `motion/models/fit.ts` frames each model by measuring what it really fills in the states it passes through. `motion/devices.ts` holds the phone used by the mobile model.

- **One renderer for the whole site.** `motion/gl.ts` creates one WebGL renderer, one canvas and one studio-lighting environment; `motion/mountStage.ts` moves the canvas into whichever scene's stage is on screen. So the browser holds one graphics context however many scenes a page has (checked by the verify script: never zero, never two). `motion/kit.ts` holds the shared parts (glass panels with a soft shadow, the core, beams) and `motion/engine.ts` the stage (camera, light, projection). `motion/models/parts.ts` has the helpers the models are made from and `motion/screens.ts` turns a project picture into a screen texture.
- **Everything is a pure function of the scroll progress `p`**, so scrubbing forwards and backwards is exact. Randomness is seeded (`motion/models/env.ts`), so a scene is the same on every visit.
- **Pages with a scene.** `components/Xp.tsx` is a tall section with a sticky stage (no GSAP pin); one ScrollTrigger with `scrub: 1.5` feeds `setProgress(p)`; inside a scene a wheel notch moves the page 0.68 of its usual distance (`data-pace`). The copy of each beat fades in and out beside the picture (`Phase`), and the pointer tilts the camera a few degrees on desktop. Each beat of the copy brings its own object; nothing is labelled with floating tags. Inner pages use `components/SceneHero.tsx` (a short 320vh scene with the headline, two chapters and a closing call to action); the decks are `components/ServicesDeck.tsx`.
- **The layout adapts.** The copy is on the left; the scene takes the room to its right, below the floating header (`layout({ left, right, top, bottom })`); the camera distance is fitted to that room, so the picture is as large as it can be at 1024, 1280x640, 1440 and 2560 px. On a very wide screen everything stays within 1680 px. The verify script checks the picture never runs over the copy or the header.
- **Motion is opt-in.** A tiny script in `<head>` (`motion/head.ts`) sets `html.motion` only on wide screens (64rem and up) when the visitor has not asked for reduced motion, is not saving data or on 2G, and is not on a device with 2 GB of memory or less. It removes the class again after 8 seconds if the engine has not started. Everything that is hidden until animated lives under `html.motion:not(.motion-ready)`.
- **Phones, tablets and reduced motion** get plain markup and a real still picture of the home scene (`public/scene/system-ring.webp` and `system-dash.webp`, about 40 kB each at phone size, rendered from the scene itself on its own light ground by `scripts/make-posters.mjs`), plus light CSS animation. A deck gives way to the plain card list; an inner page's scene gives way to its headline block. They download no three.js, GSAP, Lenis or scene runtime (checked by the verify script). If WebGL is missing, each scene steps aside the same way, at once, before anything is built.
- **Lazy loading.** `motion/gsap.ts` imports GSAP only where `html.motion` is set; `motion/mountStage.ts`, each scene and each model are separate chunks fetched in an idle moment, about a screen and a half before the scene is reached (a service page fetches only its own model). A scene builds in steps with a pause between them, so scrolling is never blocked by the whole build, compiles its shaders before the first frame, and draws only while its section is on screen and the scroll has moved.
- **Drawing quality adapts.** The picture is drawn at the screen's pixel ratio (at most 1.75). If the graphics card cannot keep up while scrolling (ten frames in a row slower than about 28 a second) it steps down a quarter at a time, to 1.
- **Declarative layer** (`motion/MotionEngine.tsx`): `data-reveal`, `data-stagger`, `data-wipe`, `data-parallax`, `data-split`, `data-pace`.
- **Developer switches.** `/?stats` makes the page print what the 3D scene costs (read `window.__lw3d()` after scrolling); `/?still` switches off the pointer and the adaptive quality so the stills are exact. Run `node scripts/make-posters.mjs http://127.0.0.1:3000` against a running production build to refresh the stills whenever the home scene changes, then `node scripts/make-brand-assets.mjs`.
- **Light scenes only.** Every runway is light (`xp xp-light`): a pale ground in CSS and, in the scene, the dressing from `motion/stage.ts`. There is no dark scene and no `tone` option. The services deck keeps one floor under whichever scene is in front and fades it while the camera travels between two.
- **Adding a model:** write `motion/models/<name>.ts` (copy a small one such as `layers.ts`), register it in `modelLoaders` in `motion/models/env.ts` under the page's variant (a service's slug, "audit", "about" or "hero"), and add its tags and description in `lib/scenes.ts`.

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

The scripts need only Node 22 and Chrome (set `CHROME_PATH` if it is not found; set `SOFTWARE_GL=1` or `CI=true` when there is no GPU). `verify-production.mjs` checks: every page in the sitemap (title, one `h1`); on desktop every pinned 3D scene on the site (it builds, the copy changes as you scroll, the tags show, the picture is drawn and moves with the scroll, one shared canvas sits in the scene on screen, no failed requests, nothing requested from another site); the case studies reel on the home page; that the picture stays clear of the copy and the header at four window sizes; that moving between pages rebuilds the scenes without leaking canvases or WebGL contexts, and that resizing keeps the picture the size of its stage; the phone and reduced-motion fallbacks (no 3D or animation libraries downloaded, the hero picture loads, the plain list takes a deck's place, a script budget, no sideways scroll); JavaScript off; a browser with WebGL switched off (the static layout takes over at once); and the API's validation and rate limit. It saves screenshots to `previews/`. `.github/workflows/production-verify.yml` runs it and the speed report on every push and pull request.

## Before launch

- [ ] Set the real domain (`NEXT_PUBLIC_SITE_URL`) and the Resend variables.
- [ ] Confirm the claims: the prices and the money-back guarantee on `/ai-audit` and the home page, the case-study figures, and the client names and quotes (they come from the Sparkix and FAYD work). Replace or remove anything that LiteraryWorks may not show under its own name.
- [ ] Check the pictures in `public/shots/` and `public/cases/`: they are our own projects, but some show the Sparkix mark and one a FAYD logo.
- [ ] Add the business's legal name, contact details and a reviewed privacy notice (`app/privacy/page.tsx` is a short draft).
- [ ] Construction is one of nine services and the site describes software and technology services for it only. Do not present on-site contracting until licensing, insurance and partners are confirmed.
- [ ] Add the hosting platform's rate limiting in front of `/api/inquiry`.
- [ ] Test on a real phone and a real GPU: scroll feel, the pinned scenes, Back and Forward.
