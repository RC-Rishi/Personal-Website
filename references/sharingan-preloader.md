# Sharingan-inspired paper preloader

- Reference: user-supplied local frames `assets/loading sharingan.png` and `assets/loading awakened.png`.
- Exact elements: teal fibrous matte paper, black pupil, three comma shapes 120 degrees apart, dotted progress circumference, awakened curved ink blades with long split tips, widely tracked serif loading/continue text.
- Status: ready; desktop, mobile, reduced-motion, recorded motion, and production verification complete.
- Captures: `artifacts/references/sharingan-preloader/`.

## Direction and intentional differences

The frames communicate material and silhouette, not fixed screen spacing or animation timing. The approved plan established spiral departures, true readiness, compact/cinematic timing, and a scroll-triggered circular reveal. Subsequent user feedback explicitly superseded the original small 340/230 px proportions and restrained in-place awakening: enlarge the dot and comma orbit, prevent commas piling up during formation, explode the commas, and let a threatening tornado sweep in from outside the screen and remain full-screen.

The user then approved the full-screen awakening but rejected the individual comma entrances and the forced wait on fast loads. The final loading design keeps the already-spaced symbol rotating as one form and fades its ink in together. There are no individual popping/scaling/spiral births. The loading symbol is `min(660px, 70svh, 90vw)` on desktop; phones use `min(500px, 64svh, 94vw)`. The core diameter is 80/340 of that width. The 158-unit dotted circumference stays stationary while the solid arc fills clockwise.

On readiness, the commas tighten, stretch outward and fade through compatible cubic outlines. One expanding ink ring accompanies the burst. Separate tapered SVG blades sweep anticlockwise from beyond the viewport, settle at `max(120vw, 160svh)` canvas size, and rotate once per 48 seconds. Fine split tips echo the awakened drawing. The progress ring disappears. No white flash, particles, WebGL or animated grain is used. The ready caption uses difference blending to stay legible as black blades pass underneath.

## Loading and interaction

The reusable visual accepts progress/readiness independently. The demo prepares decoded critical images, fonts and first layout below an inert/aria-hidden overlay. Five real milestones drive monotonic progress. Cached assets can complete during the intro; the progress bar is exposed from the first formation frame rather than delayed to match the animation. Labeled slow/failure simulations exercise waiting and a plain prepared fallback. Failures do not deadlock the gate.

Compact: 650 ms opening fade + the unchanged 1.1 s awakening. Cinematic: 1 s fade + the unchanged 1.8 s awakening. Slow loading extends the holding phase. Cached loads are no longer held behind a long forming choreography, and the caption says Ready once content is genuinely prepared. Normal entrance: 900 ms, with portal radius measured against the furthest viewport corner, then opacity reveal. ResizeObserver updates coverage on orientation/size changes. Early scroll is discarded and entry can fire only once. After reveal, the heading receives focus.

Paper and ink colors are editable live through color pickers or hex values; invalid incomplete hex never changes the current rendering. Matte strength controls static grain opacity from 0 to 100%. Reset restores the original appearance. Appearance persists across replay within the current demo session and never restarts an active timeline.

Desktop: wheel accumulation rejects small accidental deltas; Continue and ArrowDown/PageDown work. Touch: upward swipe or Continue tap. Keyboard: native button focus/Enter/Space, with visible focus. Reduced motion: static symbol, real progress and an 180 ms fade, no spiral/burst/vortex rotation. Intersection and visibility observers pause decorative motion. Replay disposes animations/listeners/asset waits and remounts a fresh destination.

## Assets

User frames remain references only. The 24,116-byte generated paper tile and its exact generation prompt are documented in `public/assets/sharingan-preloader/SOURCES.md`. Ink shapes are code. The destination uses the existing leather component and falls back to a basic dark background on failure. No third-party remote requests are needed.

## Verification artifacts

Behavior checks cover both pacing presets, cached/slow/failed assets, monotonic actual progress, independent readiness, ignored early input, touch/wheel/button/keyboard entry, repeated input, focus, resize coverage, hidden pause, reduced motion, scenario changes, and replay cleanup. Motion-specific checks sample the actual burst, shockwave, incoming vortex, and circle coverage between frames.

Desktop and phone loading/ready/entered screenshots are recorded. `final-loading-mobile.webm` and `final-filmstrip.png` document the final fade-in, loading steps, burst, incoming blades, appearance changes, portal and revealed destination. Earlier cinematic recordings are retained under `video/`. Mobile interactions use Playwright touch emulation; this does not substitute for physical phone performance measurements.

Final preloader checks: 29 passed, one decorative-animation case intentionally skipped for reduced motion. Build and lint pass. The production preloader demo chunk is approximately 24.2 KB gzip, CSS 2.6 KB gzip, and paper 24.1 KB WebP: about 51 KB total. This conservative total includes the Motion code bundled with this demo; shared React and the existing leather destination assets are excluded. No new npm dependency was added. Full-project review is recorded in `verification-2026-10-06.md`.
