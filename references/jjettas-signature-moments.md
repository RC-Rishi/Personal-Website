# JJettas — Signature Moments

- Reference URL: https://jjettas.com/; inspiration https://www.awwwards.com/inspiration/signature-moments-scroll-justin-jefferson (403 from fetch; live site used for browser inspection).
- Exact section: `[data-section="home-stage"]` / `[data-home-pin]` / `[data-home-moments]`, the five-card **Signature Moments** field after the portrait hero.
- What to reproduce: dark textured field, purple condensed heading, yardline parallax, staggered 3D cards, floating motion, pointer tilt/reflection, horizontal progression driven by vertical scroll, card-flight entrance, flip/expand to real playback.
- Desktop hover / click / scroll behavior: pinned stage with perspective `1200px`; vertical scroll moves cards horizontally. Pointer movement changes rotation, depth and sheen. Dragging moves through the same progression. Opening centers a card, rotates Y by 180°, enlarges into landscape video, and moves neighbors aside. Outside click, close button, Escape and sufficiently large scroll close playback.
- Mobile / touch behavior: source uses a rail, dots, play badges and separate video dialog on 390×844 and 820×1180 coarse-touch tablet. **User explicitly chose the desktop concept on phones**, including flip/expand. Our phone version uses responsive card sizing, smaller stagger/tilt, shorter scroll intervals, direction-locked swipes, and native vertical scrolling, with a distinct landscape composition.
- Reduced-motion behavior: source disables ambient float and uses zero-duration opening tweens. Ours also removes entrance rotation and pointer/depth/reflection; direct scroll progression and instant video expansion remain.
- Assets and usage rights: all five live CMS artworks and 480p clips are local demo assets; exact URLs and license notes in `public/assets/signature-moments/SOURCES.md`. Locally hosted OFL Barlow Condensed replaces Beachwood variable, as requested.
- Captures: initial `artifacts/references/signature-moments-1791113613503/`; targeted live `artifacts/references/signature-moments/` (scroll 900/1800/2700/3400, hover, desktop player, mobile rail/player, observations JSON). Local evidence `artifacts/signature-validation/`.
- Status: ready — behavioral checks, responsive screenshot inspection, build, and lint completed on 2026-10-04.

## Measured source details

- Ink `#0b0a0f`, deep field `#171220`, rich purple `#4f2bab`, bone `#f4efe6`, taupe `#b0a89d`.
- Heading Beachwood variable from Adobe kit `asi3hwd`. Layered grass texture multiply-blends over the field and heading; soft lighting uses `light-03.webp`.
- Five cards: Peach Bowl (1036×1519), Single Season Record (1046×1503), The Catch (1036×1519), Offensive Player of the Year (1039×1514), Pro Bowl Selection (1023×1537). Live CMS title differs from source stub “The Rookie Record.”
- Desktop stagger offsets `[-10, 12, -15, 8, -5]` viewport-scaled units; ambient float ~±4.2px, durations `6.4 + i % 3 * 1.1`s and phase offset `-1.27 * i`s.
- 1440×1000 desktop card width about 16vw = 230.4px. At scrollY2700 the third card had bounds ~230.4×337.8px, x673/y183. Hover raised scale from ~1.0305 to 1.082 and z from ~30.8 to 76.8px.
- Reference heading about 21.76 responsive units; card titles/stats are uppercase monospaced. Yardline sequence `10,20,30,40,50,40,30,20,10`, with nine intermediate marks; width `calc(76vw * --sig-n)`.
- Opening The Catch centers source scroll near2798; video ~1007×568px at 1440×1000, 854×480 native frame, ~37.29s. It plays unmuted. Local fitting produces1008×567px at the same viewport.
- Shared source stage spans the portrait hero, moments, and later transition (7500px tall at1000px viewport height). Our independent section owns only its compact intro and moments; its travel is measured separately.
- Source carousel uses CSS transforms, not WebGL. The site's canvas is a separate hero renderer.

## Intentional differences

1. **Entrance origin:** compact cream-textured intro with sample copy and first card. Its card spins through a diagonal field reveal into the measured slot. It does not recreate the site-specific portrait hero and hand location. Flight is reversible and recalculates on resize.
2. **Typography:** free Barlow Condensed Bold, optically width-fitted. Different letter shapes and texture response from Beachwood mean this is reference-inspired, not pixel-identical.
3. **Phone layout:** requested desktop-style scroll carousel and flip-player. Portrait card dimensions account for heading/caption/navigation plus screen height. Landscape uses one primary card and a side caption. Fine-pointer tablet uses a desktop layout; coarse-touch tablet uses the phone composition.
4. **Reflection:** CSS sheen/iridescence responds to pointer position, rather than downloading the source's reflection video.
5. **Navigation/accessibility:** adds explicit previous/next, pagination, counter, keyboard navigation, focus trapping/restoration and retry. Touch controls stay visible. Scroll lock contains open playback.
6. **Standalone timing:** intro1.15×viewport height on desktop/.85 on phone; interval .7×height desktop/.62 phone (with minimum450/260px). Source's shared hero timeline and total stage travel differ. `scrollPace` adjusts intervals.
7. **Demo media:** 480p clips rather than separately choosing720p on large displays. Images retain original dimensions and colors. For the public demo, the fifth card duplicates the smaller second-card video instead of shipping the original 65 MiB clip, as requested on 2026-10-07. All video requests are deferred until opening.

## Acceptance checks

Behavioral test coverage in `tests/signature-moments.spec.ts`:
- Entrance visibility/landing, reversible scroll, bounded card layouts, keyboard/dot navigation, no external runtime requests or premature clips.
- Actual time-advancing playback, pause/play, seek, mute/unmute, bounded landscape player, tab trap, Escape, audio stop and focus restoration.
- Mouse drag and actual CDP phone horizontal/vertical gestures, clean capture release, no accidental playback.
- Reduced-motion rotation/float suppression, instant transitions, short-screen separation, orientation while playing.
- Resting scheduler and hidden/offscreen animation suspension, media pause/resume, autoplay mute fallback, failed clip retry.
- Lazy gallery loading and independent iframe scrolling/unmount; custom fixture verifies content, theme, no-entrance, zero strength, imperative API, empty content and image failure.
- All five locally hosted videos play; pointer hover/cancellation and outside/scroll-to-close.

Desktop1440×1000, phone390×844, short phone390×650, landscape844×390, and coarse-touch tablet820×1180 screenshots were captured and inspected. All five sizes also passed capture-time checks for time-advancing playback, player bounds, Escape dismissal, and keyboard navigation/focus after closing. Physical iOS Safari touch/fullscreen feel has not been measured in this environment.

### Final verification — 2026-10-04

- `npm run build` and `npm run lint`: passed.
- `npm run test:e2e -- tests/signature-moments.spec.ts --workers=1`: **36 passed**, covering desktop, Pixel 7 touch emulation, and reduced-motion desktop. This Linux session used `LAB_BROWSER_CHANNEL=chromium` and temporary browser libraries under `/tmp/omnirush/`.
- Fresh evidence: `artifacts/signature-validation/verified-field-*.png`, `verified-player-*.png`, `verified-hover.png`, and intro/flight/first/third/video captures at all five sizes; measurements in `local-report.json`.
- Fixed focus-induced horizontal movement by using a non-scrollable clipped viewport. Reduced-motion styles disable transition properties explicitly, so a host stylesheet's blanket transition-duration rule cannot briefly interpolate carousel geometry. The WATCH cursor also stays suppressed with zero motion strength.
- Hover verification waits for the sheen transition. Scroll-to-close targets the backdrop after expansion settles and accounts for emulated mobile wheel scaling. All-five-clip checks verify that the viewport cannot scroll sideways and that the settled player stays within horizontal bounds.
