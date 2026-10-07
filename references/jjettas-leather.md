# JJettas leather background

- Reference: https://jjettas.com/ — inspected live on 2026-10-04.
- Targets: the cream pebble surface behind the opening portrait and the dark leather surface behind the footer.
- User chose both finishes in one reusable component.
- Status: implemented; browser behavior verified; visual comparison recorded below.

## Measured construction

| Property | Cream | Dark |
| --- | --- | --- |
| Base color | `#d3c8ba` | `#171220` |
| Texture | `/textures/pebble.webp` | `/footer/texture.webp` |
| Blend | screen, opacity 1 | overlay, opacity 1 |
| Desktop tile | 480 × 480 CSS px | 560 × 560 CSS px |
| Mobile tile | 340 × 340 CSS px | 340 × 340 CSS px |
| Light | `/textures/light-01.webp`, soft-light, opacity 1 | `/footer/light-04.webp`, soft-light, opacity 0.9 |
| Light placement | centered, cover | centered, cover, 7% horizontal overscan |
| Mobile lighting | `/textures/light-01-phone.webp` | hidden |

The reference mobile breakpoint is max-width 767px, or max-width 900px with a coarse pointer. The dark mobile background extends 10% above/below the viewport, changing the vertical tile origin; this is reproduced relative to the component surface.

## Interaction observations

- Cream texture and lighting do not respond to hover or pointer movement. The original site's portrait, branded marquee, and page transitions move independently.
- Dark desktop lighting translates horizontally by up to ±4.5% of viewport width, eased by 0.06 per animation frame at 60Hz. Confirmed by moving the pointer left, center, and right and inspecting transforms.
- Dark mobile lighting is hidden. Texture remains visible while scrolling. The standalone surface uses its own bounds rather than coupling to the source site's global footer scroll progress.
- Reduced motion centers the light. The component also responds to changes in the motion preference without a reload.
- Texture is CSS compositing rather than a WebGL material; there is no shader, model, or WebGL requirement.

## Implementation and intentional differences

- Reusable `LeatherBackground` accepts finish, interactive, children, and standard div props. Source branding, portraits, footer navigation, and page transition logic are excluded.
- Demo typography and controls are original preview content, removable with Hide labels; `view=texture` removes all controls/content for visual comparison.
- Pointer coordinates use the component bounds so it works in sections and iframes. Easing is normalized for refresh rate and stops once settled; offscreen/hidden instances do not keep rendering.
- Assets are local copies of the original reference files, not generated textures. Origins and ownership are recorded in `public/assets/leather-background/SOURCES.md`.

## Evidence and acceptance

- Initial captures: `artifacts/references/jjettas-leather-1791060615919/`.
- Interaction captures: `artifacts/browser/jjettas-*.png` (early mobile captures include the site's loader; use the isolated validation captures for material comparison).
- Desktop/mobile, both finishes: `artifacts/leather-validation/`.
- The comparison isolates the source's measured material layers, excluding foreground content, and compares them with the local texture-only view at 1280 × 720 and 390 × 844.
- Build and lint pass. All 18 Playwright checks pass across desktop, mobile, and reduced motion, including loaded local assets, finish switching, keyboard controls, pointer movement, decorative layer semantics, and gallery integration.
- Comparison results (mean absolute RGB channel difference, on a 0–255 scale): cream desktop 0.008; dark desktop 0.056; cream mobile 3.076; dark mobile 3.503. An earlier cream desktop run was exactly equal. Mobile captures retain small pixel differences despite matching measured construction and byte-identical texture assets; universal pixel equality is not claimed. Full measurements are in `artifacts/leather-validation/report.json`.

## Palette explorer extension

- Added Original plus Cognac, Oxblood, Forest, Navy, and Graphite presets, a stepped slider, color pickers, and hex fields. Colors remain selected when changing finishes; reloading the preview resets them.
- Optional custom palettes remap grayscale tones using an SVG filter with sRGB interpolation. A 12% original texture layer preserves detail even with equal endpoint colors, including black. These are tonal controls, not segmented geometric masks.
- Original mode omits both the filter and detail overlay. Before/after captures match pixel-for-pixel for cream desktop, dark desktop, and cream mobile. Dark mobile captures show a sharpness difference despite the original CSS/rendering branch remaining unchanged; do not claim pixel equality for that comparison.
- Build and lint pass; all 27 browser checks pass across desktop, mobile, and reduced motion. Tests include keyboard presets, all preset buttons, custom/native color input, invalid hex recovery, equal colors, reset, finish switching, and session reset.
- Reviewed Forest on desktop/mobile, Cognac on dark, equal gray on mobile, and equal black on dark. Captures: `artifacts/leather-validation/palette-*.png`.
