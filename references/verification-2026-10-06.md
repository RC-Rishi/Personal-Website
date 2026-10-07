# Component collection verification — 2026-10-06

Reviewed the current workspace, including the user's changes made through other AI sessions. Git has no tracked baseline in this workspace, so this verifies the current files and behavior rather than attributing earlier edits to particular authors.

## Results

- `npm run build`: passed. The existing lazy lanyard/Three/Rapier bundle still produces Vite's large-chunk advisory; the preloader does not load it.
- `npm run lint`: passed without warnings.
- `npx playwright test --workers=2`: 139 passed, one intentionally skipped, one obsolete mobile Rays gallery assumption failed.
- Corrected that test to scroll its selected iframe into view before expecting a WebGL frame. Offscreen suspension was working correctly; the additional gallery entry had moved the preview below the phone viewport. No Rays rendering behavior was changed.
- `npx playwright test tests/rays.spec.ts tests/lab.spec.ts --workers=2`: all 21 passed after the correction, covering all three device projects. Across the full review and targeted rerun, all 140 applicable test cases pass; one burst-animation test remains intentionally skipped under reduced motion.
- Production smoke check using `vite preview`: Leather, Rays, Signature Moments, Lanyard, and Sharingan Preloader all rendered, with no page errors or failed HTTP responses. The prepared destination received heading focus after the preloader reveal.

## Sharingan preloader

The user's preferred full-screen awakening was preserved. Loading now uses a simultaneous ink fade and continuous rotation, not staggered popping commas. Cached opening is 650 ms in Compact / 1 s in Cinematic, followed by the existing 1.1 / 1.8 s awakening. Actual progress comes from decoded essential assets, font readiness, and the first render. It is not an animation timer or a backend simulation. Slow/failure modes are explicitly labeled.

Live controls cover paper/ink colors, editable hex, invalid input, matte strength endpoints and keyboard adjustment, reset, and persistence across replay. Verification also covers independent readiness, monotonic progress, actual arc values, early scroll rejection, touch/wheel/button/keyboard entry, repeated input, focus, failed assets, short/landscape viewports, offscreen pause and reduced motion.

Reviewed desktop/phone screenshots and a recorded frame sequence at `artifacts/references/sharingan-preloader/final-loading-mobile.webm` / `final-filmstrip.png`. The final demo adds approximately 51 KB of compressed code/CSS and WebP paper, counting the Motion code bundled into its lazy chunk. Shared React and already-existing leather destination assets are excluded.

Paper texture: `public/assets/sharingan-preloader/paper.webp`; generation prompt and built-in image generation provenance: `public/assets/sharingan-preloader/SOURCES.md`.

## Lanyard tilt correction

Replaced raw beta/gamma subtraction with earth-down gravity projected into the screen frame. This fixes reversal past upright and removes large discontinuities between equivalent Euler-angle representations. Conversion follows the [W3C orientation model](https://www.w3.org/TR/orientation-event/#a-2-alternate-device-orientation-representations). Existing permission handling, neutral calibration, bounded response, eased gravity, drag priority, camera fitting, reduced motion, offscreen pause and cleanup remain intact.

All 15 tilt checks passed across desktop, emulated phone and the reduced-motion project (sensor-specific tests deliberately enable motion). Tests exercise both synthetic orientation events and Chromium's sensor override against the real physics scene.

A recorded phone-sized review at beta 120 degrees produced horizontal gravity values of 0, -0.1249, +0.1249, 0 for gamma 0, +30, -30, 0 respectively. The badge visibly followed the expected direction and returned to neutral. Video: `artifacts/handoff-review/tilt-direction-mobile.webm`; stills: `tilt-direction-30.png` and `tilt-direction--30.png`. This is browser sensor emulation; physical-device feel remains unverified.

## Collection regression coverage

The review includes gallery navigation and iframe sizing, both leather finishes and palette editing, Rays controls and context-loss fallback, lanyard dragging/keyboard/materials/WebGL fallback, Signature Moments entrance/navigation/video controls/media errors, idle/hidden render scheduling, and mobile layouts. The missing favicon request was also fixed with a small local SVG.

Embossing, scaffolding, and diagnostics remain deferred. The preloader is a standalone collected component; the normal gallery entrance is unchanged.
