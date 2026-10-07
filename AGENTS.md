# Component collection workflow

This project is a component playground for a future personal website. Keep the gallery functional and build each requested component independently.

- Inspect reference sites in a real browser before claiming visual or interaction fidelity. Save initial captures with `npm run inspect -- <url> <name>`, then investigate hover, scroll, pointer, and touch behavior with Playwright.
- Record the exact reference section, observations, asset sources, and intentional differences in `references/`, using its template.
- Put reusable React components in `src/components/<name>/` and register a demo in `src/lab/registry.ts`. Typed props should carry content; the component must not depend on the lab shell.
- Use shared tokens where appropriate, while preserving a reference's requested styling. The lab theme is provisional, not the final site's design.
- Keep 3D code and assets lazy-loaded. Provide reduced-motion behavior, touch and keyboard support where relevant, and a WebGL fallback. Avoid starting multiple offscreen render loops.
- Verify changes with `npm run build`, `npm run lint`, and meaningful Playwright checks. Inspect desktop and mobile screenshots. Add component-specific tests only when there is behavior to verify.
- Do not mark a component ready based on a static screenshot alone if its main feature is animation or interaction.
