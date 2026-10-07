# Light Rays

- Supplied module: https://framer.com/m/Rays-Prod-o7ad.js
- Resolved source: https://framerusercontent.com/modules/lrLFKsmJ1z5FXTa9Ej4k/QmxZAGZo0U04mjLegBGM/Rays_Prod.js
- Live reference: https://rays.learnframer.site/
- Exact target: full-viewport animated light-ray canvas, excluding foreground typography, grid, buttons, and the lower-page glow.
- Inspected: 2026-10-04, Chromium desktop 1440×1000 and touch 390×844.
- Status: ready; live interactions, shader comparison, and desktop/mobile visuals verified.

## Observations and measured construction

- Two ray sources sit above the container at `(position × width, −0.4 × height)` and `((position + .02) × width, −0.5 × height)`.
- Active beam calculation uses directional sine/cosine bands, diagonal-distance falloff, and vertical attenuation. The source's many noise/color-space helpers are unused by this calculation.
- Render resolution is one pixel per CSS pixel, independent of device DPR. The premultiplied output renders with blending disabled; colors and alpha match the source calculation.
- Live-page uniforms: both colors `#639aff`, intensity 13, rays 32, reach 16, position 50. Module defaults: white, 50/30/40/80; animation speed 10.
- Desktop pointer moves, touch input, and scroll do not update the beam uniforms. Time drives the motion. The mobile canvas fits 390×844 and retains the same parameters.
- The original continuously requests frames even when its animation flag is false; no source reduced-motion behavior was found in the supplied module.

## Implementation and intentional differences

- `src/components/rays/` contains a typed reusable component, lazy native WebGL renderer, and lab-only controls. The remote Framer wrapper and Three.js are not runtime dependencies.
- Active fragment calculation and numeric mappings are retained. Foreground content and controls are original lab content; no image assets are needed.
- Two hex colors replace Framer's random/single/multi control wrapper. Equal colors reproduce single-color mode.
- A stable seed replaces the reference's random initial phase, allowing reproducible comparisons. Time advances at the source rate with a bounded frame delta after interruptions.
- Added responsive resizing, reduced motion, pause/zero-speed idle behavior, offscreen/document-visibility suspension, and CSS fallback/context restoration.
- The fallback approximates the atmosphere; it does not reproduce the shader exactly.

## Evidence

- New initial captures: `artifacts/references/rays-handoff-1791105900117/`.
- Mouse/touch/scroll inspection and measured uniforms: `artifacts/handoff-review/rays-reference-*.json` and `*.png`.
- Earlier source/capture archive: `artifacts/references/rays/`.
- Local default/control captures at 1440×1000, 390×844, and 390×650: `artifacts/handoff-review/rays-default-*.png`, `rays-controls-*.png`, and `rays-custom-*.png`.

Fixed-phase GPU readback comparison at seed 217: all 6,400 desktop and 7,216 mobile sampled RGBA channels match exactly (mean and maximum difference zero). This samples the shader output and does not claim full-page or universal pixel equality. Report: `artifacts/handoff-review/rays-comparison.json`; isolated source/local captures: `rays-isolated-*.png`.

## Acceptance

Build/lint pass. Browser checks verify loaded local rendering, actual control-driven pixel changes, keyboard/native inputs, both presets, pause/reduced-motion/zero-speed/zero-ray idling, hidden/offscreen suspension, lazy gallery loading, resize, fallback, and real WebGL context loss/restoration across desktop, Pixel 7, and reduced-motion projects. The complete collection includes 72 browser checks; final handoff results are recorded alongside the lanyard extension.

Final handoff: all 72 checks verified. The full run passed 71 checks; one existing artwork-upload check exceeded the original 30-second software-GPU budget. After increasing the lanyard workflow budget to 60 seconds, `npm run test:e2e -- --last-failed --workers=2` passed that remaining check. Actual load/physics/idle assertions remain in place. Desktop/mobile/short-screen captures were reviewed, with no local runtime errors in the capture sweep.
