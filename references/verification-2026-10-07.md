# Publishing preparation — 2026-10-07

- Included the required `public/assets/` files in Git while keeping the root reference `/assets/`, build output, reports, dependencies, and Vercel account metadata ignored.
- Replaced the original 68,098,861-byte `moment-05.mp4` with a byte-identical copy of the 3,579,887-byte `moment-02.mp4`, preserving the fifth card and its existing media URL. The deployed demo uses four distinct clips across five cards. Asset sources and intentional differences record the substitution.
- Added explicit Vercel Vite settings: `npm ci`, `npm run build`, output `dist`. The current lab requires no environment variables or backend.
- Added `.vercelignore` because CLI uploads require their own exclusions for local captures, reports, root reference images, environment files, dependencies, and build output. Required `public/assets/` files remain included.
- Build and lint passed using Node.js 24.19.0.
- Full Playwright run: 137 passed, three failed, one intentionally skipped reduced-motion animation check. Two desktop video-time assertions timed out during the two-worker run; the third failure was a stopped development server (`ERR_CONNECTION_REFUSED`). A fresh single-worker run of playback controls, failure/retry, and pointer/close scenarios passed all nine desktop/mobile/reduced-motion cases. All 140 applicable scenarios passed across the full run and targeted rerun; no component code changes were needed.
- Production-build smoke checks passed for all five standalone components on desktop and mobile, including actual time-advancing playback of the replacement fifth-card clip. No runtime errors or HTTP failure responses were observed.
- Inspected desktop/mobile gallery, card-field, and replacement-video screenshots. Evidence is stored locally in ignored `artifacts/publishing/` and `artifacts/signature-validation/`; the smoke report is `artifacts/publishing/smoke.json`.
- Public GitHub repository: https://github.com/RC-Rishi/Personal-Website. Vercel production address: https://personal-website-peach-omega-49.vercel.app. The production deployment contains 118 source files after CLI exclusions, compared with 432 in the initial upload. The initial deployment was removed after the clean replacement became ready.

## GitHub integration and shorter address

- Confirmed the Vercel project is connected to `RC-Rishi/Personal-Website`, with `main` as its production branch.
- Added https://rishi-component-lab.vercel.app as a verified project domain for production deployments and updated the README's live demo link. The initial address remains available.
