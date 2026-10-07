# Personal Website — Component Lab

A local workspace for collecting reference-inspired components before assembling a personal website. Its styling is a temporary lab theme.

## Collected components

- **Leather Background** — cream pebble and dark leather finishes from JJettas, with responsive texture sizes and desktop pointer lighting. Open `/?component=leather-background`, use the Cream/Dark controls, and hide the sample labels to inspect the material. Open **Colors** for the preset slider, pebble/crevice color pickers, hex values, and reset. Palette choices persist until the preview reloads. The reusable component lives in `src/components/leather-background/`; inspection notes are in `references/jjettas-leather.md`.

**Interactive Lanyard** is the second collected component. Open `/?component=lanyard` or select it in the gallery. Drag and release the card, use keyboard arrows/Space, and open **Customize** for colors, gravity, and front/back artwork. Its reusable API lives in `src/components/lanyard/`; reference and asset notes are in `references/framer-lanyard.md`.

The lanyard also has opt-in **Device tilt** inside Customize: Enable tilt, Calibrate, Disable tilt, and a strength slider. It uses a neutral phone pose and bounded, eased gravity changes. Browser sensor access may require a user gesture and HTTPS/localhost. Reduced motion and offscreen/hidden instances pause sensing; dragging takes priority. Physical-device sensor feel still needs a phone check.

**Light Rays** is the third component. Open `/?component=rays` and **Shape the light** to adjust two colors, intensity, ray amount, reach, position, speed, and animation. The demo begins with the live reference's softer blue preset; Source defaults restores the supplied module's settings. It uses a lazy native WebGL shader, reduced-motion/static rendering, and a CSS fallback. API: `src/components/rays/README.md`; inspection notes: `references/framer-rays.md`.

**Signature Moments** is the fourth component, now Ready after 36 desktop/mobile/reduced-motion behavioral checks and desktop, phone, landscape, and touch-tablet visual inspection. Open `/?component=signature-moments` or select it in the gallery. Scroll from the cream intro to fly the first card into a textured field, then scroll or drag through all five cards. Open one to flip into its video. Phones have a dedicated scroll-driven layout, horizontal swipes, and fitted flip playback. Use Left/Right, Home/End, pagination, and Escape by keyboard. API: `src/components/signature-moments/README.md`; reference and deliberate mobile/font differences: `references/jjettas-signature-moments.md`.

**Sharingan Preloader** is the fifth component. Open `/?component=sharingan-preloader` for a large paper-and-ink formation, genuine loading progress, exploding commas, a full-screen awakened vortex, and a circular entrance into a prepared leather landing screen. Preview settings offers Compact/Cinematic pacing and labeled slow/failure simulations; Replay starts again. Scroll, swipe up, or use Continue once ready. API and integration: `src/components/sharingan-preloader/README.md`; source/motion notes: `references/sharingan-preloader.md`. It is an independent demo and does not replace the gallery entrance.

Deferred embossing, the component generator, and diagnostics overlay remain recorded in `references/BACKLOG.md`.

## Commands

```powershell
npm run dev
npm run build
npm run lint
npm run test:e2e
npm run test:e2e:ui
npm run inspect -- https://example.com component-name
```

Open http://127.0.0.1:5173 while the dev server is running. Desktop, tablet, and mobile controls size an iframe, so component CSS media queries use the actual preview width. A standalone route (`/?component=id`) allows browser testing outside the gallery.

## Foundation

React + TypeScript + Vite; Motion for UI animation; Three.js + React Three Fiber + Drei for 3D; Lucide icons; shared CSS tokens; ESLint; Playwright browser testing and reference captures. `package-lock.json` pins dependency versions. Plain CSS is the default, and final website branding can be chosen later.

## Collecting a component

1. Copy `references/TEMPLATE.md` to a descriptive reference note and record the URL and exact target.
2. Inspect the real site at desktop and mobile sizes. Capture interactions and measure timing, typography, layout, and material details. The capture script saves initial screenshots and style metadata; it does not automatically analyze all animations.
3. Build inside `src/components/<name>/`, keeping the component independent of the gallery.
4. Register a demo in `src/lab/registry.ts`. Use public assets under `public/assets/` and document their sources.
5. Check visual fidelity, touch and keyboard behavior, reduced motion, loading, and WebGL fallback where relevant. Run build, lint, and browser tests before marking it ready.

## Browser tools

Playwright uses the installed Google Chrome for local tests and reference capture. Playwright MCP is configured in Codex's user configuration for interactive browsing and was verified by opening the lab. Restart the Codex session if the new MCP tools are not yet visible. No paid service or API key is required for this foundation.

On another machine, install Node.js 22.12+ and Chrome, then run `npm ci`. Alternatively, run `npx playwright install chromium` and set `$env:LAB_BROWSER_CHANNEL = 'chromium'` to use Playwright's managed browser for tests and capture. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. A new terminal may be needed after installing Node.js.

## Publishing with Vercel

`vercel.json` configures this project as a Vite static site: install with `npm ci`, build with `npm run build`, and publish `dist`. Vercel's default Node.js 24.x satisfies the project's Node.js 22.12+ requirement. No backend or environment variables are required for the current lab.

Push the project to your GitHub repository, then import that repository at https://vercel.com/new. Choose your personal Hobby account, keep the root directory at the repository root, and deploy. Once connected, pushes to the production branch rebuild the live site; other branches can have preview deployments. Share the production `.vercel.app` address so visitors can open the lab without a Vercel login.

Required component files under `public/assets/` are included in Git. Only the root `/assets/` reference folder is ignored, along with local reports, dependencies, build output, and `.vercel/` account/project metadata.

`.vercelignore` also excludes those local-only folders and environment files from CLI uploads. For a manual production update, run `npx vercel deploy --prod` after signing in and linking the project.

The fifth Signature Moments card uses a copy of the smaller second-card clip as a demo placeholder. Reference media provenance is documented in `public/assets/signature-moments/SOURCES.md`; replace demo reference artwork and clips with your own content when assembling the final personal website.
