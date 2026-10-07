# SharinganPreloader

A paper-and-ink entrance with a coherent rotating symbol, genuine progress, an ink burst, a full-screen awakened vortex, and a circular reveal. The lab demo is independent of the gallery entrance.

Open `/?component=sharingan-preloader`. Preview settings contains Compact/Cinematic and Actual/Simulated slow/Simulated failure options, live Paper/Ink color pickers and hex fields, a Matte strength slider, and Reset appearance. Appearance persists across replay and changes without restarting motion. Replay restarts the entire sequence. No cross-visit persistence or first-visit bypass is used.

```tsx
import SharinganPreloader from './components/sharingan-preloader/SharinganPreloader'

<SharinganPreloader
  progress={criticalProgress}
  ready={criticalContentReady}
  pacing="cinematic"
  paperColor="#8bbdb8"
  inkColor="#0b1110"
  matteStrength={0.68}
  onExit={revealDestination}
/>
```

`progress` is a finite fraction from 0 to 1, clamped to its highest received value for this mount. `ready` independently confirms the destination or a usable fallback. Both 100% progress and confirmed readiness are required before awakening. A 320 ms interpolation smooths reported progress; it never invents additional progress. Cached assets can reach 100% during formation. Formation/awakening timers do not control the progress bar.

Compact uses a 650 ms opening fade and 1.1 s awakening. Cinematic uses a 1 s fade and 1.8 s awakening. All three commas are already spaced around the pupil and fade together while rotating; there are no individual popping/spiral entrances. Loading may extend the intervening rotating phase. Once assets are prepared the caption says Ready rather than pretending to keep loading through the opening fade. Reduced motion shows static symbols and uses a 180 ms exit fade. Normal exit lasts 900 ms. The awakening and portal design are preserved from the user's preferred revision.

Mount the component inside a positioned viewport-sized container, with the destination prepared underneath. The component temporarily locks body scrolling; the host owns destination readiness, `inert`, `aria-hidden`, and focus transfer. See `SharinganPreloaderDemo.tsx` for a complete host that removes the overlay and focuses the revealed heading. Change the React `key` to replay with fresh progress. `className` and `style` are also supported. Copy `public/assets/sharingan-preloader/paper.webp` with the component.

`useDestinationReadiness` is demo-only: it awaits decoded leather/paper images, fonts, and two render frames. Each of these five milestones contributes 20%. Image errors/timeouts prepare a plain fallback; unresolved optional future site assets should not be included in this gate. The slow/failure modes are explicitly labeled simulations. The normal demo waits for actual assets and contains no artificial loading delay.

Wheel-down, a deliberate upward touch swipe, Continue, ArrowDown/PageDown, and keyboard activation of Continue enter only after readiness. Early input is discarded. Exit is guarded against repeated activation. Listeners, animation controls, observers, asset timers, and pending frame work are cleaned up on replay/unmount. Hidden/offscreen decorative motion pauses.

The updated scale follows the user's feedback: up to 660 px for the loading symbol, roughly 94% of phone width, a larger central dot, and awakened blades extending past all screen edges. `matteStrength` ranges from 0 (no grain) to 1 (strong grain), default 0.68. There is no WebGL, particle system, animated texture, or additional animation dependency. The paper is one static 512 px WebP tile; paths are authored SVG and the timeline uses the project's existing Motion dependency.

Reference, asset provenance, and verification: `references/sharingan-preloader.md` and `public/assets/sharingan-preloader/SOURCES.md`.
