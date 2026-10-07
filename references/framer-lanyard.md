# Interactive Lanyard

- Reference URL: https://framer.com/m/Lanyard-Prod-D22s.js
- Resource: https://framer.university/resources/interactive-lanyard-component-for-framer
- Live interaction reference: https://lanyard.learnframer.site/
- Exact element: suspended 3D badge, metal clasp, and flexible printed strap. The conference page's surrounding text/buttons are outside this component.
- Inspected: 2026-10-04, Chrome desktop 1440×1000 and touch 390×844.
- Status: ready

## Observations

The source exposes a Three.js canvas, three rope joints (one unit each), a spherical card joint, and gravity of 60. The card and clasp share a rigid body with angular/linear damping of 4. The visible mesh is scaled 2.25; the joint meets its top ring. The strap uses 33 curve samples with bend relaxation, instead of rigid straight segments. Lightformer strips create the moving highlights on the dark card and metallic clasp. Source material values: clearcoat 1, roughness .9, metalness .8; metal clip roughness .3 / metalness .8.

Mouse inspection: grabbing the card moves it with the pointer; the strap bends toward the ring. Release produces inertia, rotation, and a damped return. Pointer hover changes to a grab cursor. Background scroll does not drag the card. The source projects the card outline into a DOM hit area, leaving the rest of its canvas click-through.

Touch inspection used Chrome's actual CDP touch events. The card captures the drag; pointer cancellation must release it. The live conference page overflows/crops the badge on a narrow screen. The local component intentionally fits within the preview instead.

Reduced motion: the source starts from a hanging pose rather than dropping in. The recreation follows that approach; explicit user input can still move the card. No ambient idle rotation is added.

## Implementation and sources

- `src/components/lanyard/Lanyard.tsx`: independent typed API, lazy scene, visibility, static fallback.
- `LanyardScene.tsx`: native React Three Fiber + Rapier, local GLB, original material/lighting setup, pointer capture and keyboard input.
- `ribbon.ts`: bend-limited sampling adapted from the supplied source.
- `textures.ts`: source UV atlas layout (front/back halves, .757 image height), local or supplied images.
- Asset URLs and provenance: `public/assets/lanyard/SOURCES.md`.
- The remote Framer wrapper/vendor bundle is not a runtime dependency. Physics and Three.js code load only when this component is selected and visible.

## Intentional differences

- The demo uses the source module's “Your Design” placeholder and Framer-mark strap. The live conference page customizes these to a Koen Bok pass and “Framer University” strap.
- Lab-specific header, customization panel, and mobile framing replace the reference page layout. The reusable component remains transparent by default and has no lab dependency.
- Demo camera distance is 12 for a larger card; reusable API defaults to the source's 15, with a narrow-frame minimum to keep the card in view.
- Arrow keys swing; Space turns; Home/Escape reset. A native button provides keyboard focus and instructions.
- Dragging clamps maximum reach as well as the reference minimum distance, limiting extreme stretching during a fast pointer jump.
- Pixel ratio caps at 1.5 rather than 2. Lighting environment is generated locally, with no HDR download.
- WebGL unavailable or scene-load failure gives a static image preview.

## Captures and checks

Initial automatic desktop/mobile captures: `artifacts/references/lanyard-1791099215827/`, created with `npm run inspect -- https://lanyard.learnframer.site/ lanyard`.

Interactive reference screenshots, source inspection artifacts, local desktop/mobile, dragging, keyboard, and customization captures: `artifacts/references/lanyard/`. Screenshots compare shape, materials, strap deformation and image placement; differing page content and framing are intentional as described above.

Playwright checks cover gallery lazy loading, rendering without external requests/runtime errors, keyboard movement/reset, real mouse/touch dragging and cancellation, colors/uploads, fallback, reduced-motion entrance, and actual WebGL draw counts stopping at rest/offscreen then resuming. Existing leather/gallery checks remain part of the full suite. Build and lint are required. The lazy 3D chunk is large (physics WASM included), so Vite reports its normal chunk-size warning.

Final verification: `npm run build` and `npm run lint` passed; `npm run test:e2e -- --workers=2` passed all 48 tests across desktop, Pixel 7 touch, and reduced-motion projects. Desktop/mobile reference and local screenshots were visually reviewed, including custom materials and the scrollable settings panel at 390×650. No runtime errors or remote asset requests occurred in the local rendering checks.

## Device tilt extension (2026-10-04)

- User-requested enhancement; not a behavior of the Framer reference.
- Opt-in Enable/Disable tilt, Calibrate, and 0–100% strength controls. Reusable API: `tilt`, `tiltStrength`, status callback, and imperative sensor controls.
- First valid reading sets neutral; capped beta/gamma changes map into screen-relative gravity. A one-degree dead zone and eased physics prevent jitter; steady tilt can settle without ambient render loops.
- Permission is requested only from a user gesture on browsers requiring it. Denied/unsupported/missing readings preserve normal dragging and keyboard interaction. Async permission completion respects current visibility and disposal.
- Sensors suspend while offscreen/hidden/reduced-motion or noninteractive; screen rotation/resume recalibrates. Dragging takes priority.
- Camera framing eases outward with tilt to leave room on narrow screens; neutral returns to the configured distance. Horizontal keyboard impulses were increased from .2 to .35 to make a single arrow press visibly useful on mobile.
- Browser checks exercise Chromium CDP orientation events, actual projected card movement, saturation, calibration, idle draw counts, denial, no readings, reduced motion, visibility, screen rotation, and mouse/touch drag priority.
- Captures: `artifacts/handoff-review/lanyard-tilt-*.png`. Physical-device Safari permission UX and sensor feel remain to be checked on a phone; emulation is not claimed to replace that check.
- Reviewed default/tilted views and scrollable settings at 1440×1000, 390×844, and 390×650. `lanyard-tilted-*.png` confirms default-strength framing; automated projected-outline bounds also verify the maximum tilt strength. Warmup frames are allowed to flush before measuring idle WebGL draw counts, including software-GPU environments.

Extension handoff verification: build/lint pass; all 72 gallery/leather/lanyard/Rays checks verified across desktop, Pixel 7 touch, and reduced motion. The final full run passed 71; its remaining artwork-upload test passed on the targeted rerun after allowing 60 seconds for the complete 3D workflow on a software GPU. Both the calibration test and maximum-strength projected-outline check passed with a fresh dev server. All local capture-sweep runtime errors: none (`artifacts/handoff-review/local-errors.json`).
