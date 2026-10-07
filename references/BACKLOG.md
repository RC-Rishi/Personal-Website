# Component collection backlog

Recorded from the original conversation; these ideas were explicitly deferred, not requested for the Rays/tilt pass.

## Embossing / debossing

Optional stamped logo/text/child API for the leather surface. Highlights/shadows should share the surface's moving light coordinates, with subtle depth, static reduced-motion behavior, and readable foreground content. Arbitrary images/SVGs need an alpha mask; text-shadow alone is not enough for every child. Await the user's decision and desired artwork before implementation.

## Component scaffolding CLI

`npm run generate <name>` to scaffold component/demo/CSS, copy `references/TEMPLATE.md`, create meaningful behavior-test starters, and add a lazy registry entry. Validate names, preserve existing files, and avoid replacing hand-written registry content.

## Performance overlay

Optional lab-only diagnostics: actual component render FPS/draw counts (including iframe previews), idle/offscreen state, and production lazy-chunk sizes. Keep display FPS separate from GPU frame timing; report shared dependency chunks and compressed/raw sizes clearly. Development-server requests are not production bundle sizes.

## Preloader templates

The first template is now implemented as the independent Sharingan paper preloader demo (`/?component=sharingan-preloader`). It coordinates essential destination readiness, fallback, and a single reveal; see `sharingan-preloader.md`. Integrating it into the eventual composed personal website remains separate work. The gallery's normal entrance is unchanged.

## Leather ideas for consideration

The high-contrast grooves in custom Forest/Cognac palettes can compete with foreground text. An optional grain/relief-contrast control could make custom palettes more understated while preserving Original mode exactly. A small debossed monogram could reinforce the material effect once personal artwork is chosen. Both are suggestions awaiting approval; no leather rendering changes were made in this pass.
