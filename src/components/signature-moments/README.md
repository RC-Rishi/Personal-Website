# Signature Moments

A standalone React scroll section inspired by JJettas: flying-card entrance, pinned horizontal field, reflective portrait cards, and a card that flips into a landscape video. CSS perspective and the Web Animations API provide depth; no canvas, WebGL, or Three.js dependency.

## Usage

```tsx
import SignatureMoments, {
  type SignatureMoment,
  type SignatureMomentsHandle,
} from './components/signature-moments/SignatureMoments'

const moments: SignatureMoment[] = [{
  id: 'first-project',
  title: 'The first launch',
  stat: '2026 · DESIGN AND DEVELOPMENT',
  image: { src: '/my-card.webp', width: 1036, height: 1519 },
  video: { src: '/my-film.mp4', aspectRatio: 16 / 9 },
}]

<SignatureMoments
  moments={moments}
  heading="Signature Moments"
  intro={{ eyebrow: 'MY STORY', title: 'Some moments\nstay with you.' }}
  onActiveChange={index => console.log(index)}
/>
```

Use stable, unique item IDs. Supply real image dimensions; their ratio sets each card's size. Images are not stretched to a common ratio. Videos are optional: image-only moments have captions and navigation without a playback button. Empty content renders an intentional empty state. Broken card images show their title; playback failures offer retry.

## Props

| Prop | Default | Behavior |
| --- | --- | --- |
| `moments` | Required | Readonly array of typed content. |
| `heading` | `Signature Moments` | Section name and oversized field title. |
| `entrance` | `true` | Includes an intro and measured, reversible first-card flight. `false` begins on the field. |
| `intro` | Built-in sample copy | Optional eyebrow, title (newlines supported), description. |
| `scrollPace` | `1` | Clamped .5–2 multiplier. Phone scroll intervals are shorter than desktop. |
| `motionStrength` | `1` | Clamped 0–1 tilt/depth/reflection/float strength. `0` uses flat, stationary cards. |
| `theme` | Reference colors | Background, accent, foreground, secondary, headingFont. |
| `grassTexture`, `lightTexture` | Local reference textures | Image URLs; pass `null` to disable. |
| `onReady` | — | Fires once per mount after first image/font settles and geometry is measured; also fires for empty data. |
| `onActiveChange` | — | Current nearest card index changes through scrolling or navigation. |
| `ref` | — | `goTo(index)`, `open(index)`, `close()`. Indices are zero-based. `open` ignores absent/image-only moments. |
| Standard section attributes | — | `className`, `style`, etc. Component provides its heading relationship. |

The optional video ratio is used while metadata loads, then updated to the actual source ratio. Copy `public/assets/signature-moments/` when moving this component to another app, or replace the image/video sources and CSS font/intro texture URLs. The demo and gallery registry are separate from the reusable component.

## Scroll ownership and layout

- Mount in the normal document scroll flow. A sticky viewport inside a measured tall section maps **window scrolling** to card progress. Avoid an overflow-constrained ancestor that intercepts the sticky positioning; arbitrary nested scroll containers are not supported.
- `goTo` scrolls the current document to an item's center; `open` centers immediately to allow the card animation and video load to begin from the user interaction. In the lab iframe the current document is the iframe, so the surrounding gallery page remains independent.
- The intro has its own compact card origin instead of depending on a portrait hero. At 0–100% entrance progress that card follows a measured path into the first slot, with a full Y rotation and slight Z roll. Scroll back to reverse it.
- Desktop shows a large heading and widely spaced, vertically staggered cards. Phone/coarse-touch tablet sizes use height-constrained cards, a visible neighbor, smaller stagger, reduced perspective, shorter travel, and 44px navigation targets where space allows.
- Short portrait phones reserve space between heading, card, caption, and navigation. Landscape phones present a primary card with its caption alongside. Resizing preserves the moment position and re-fits an open player.
- Mouse dragging and horizontal trackpad gestures map to the same progress. Horizontal touch swipes have direction-locking and bounded release easing. Vertical touch gestures and pinch zoom remain browser-native. Pointer cancellation, capture transfer, and window blur release dragging.

## Media, keyboard and motion

- Clips have no media element/network request until opened. Only one player mounts, closing pauses immediately, unmount removes its source, and offscreen playback closes. Hidden documents pause and resume previously playing video on return.
- Opening attempts audible playback as the source does. If the browser denies it, playback retries muted with an Unmute button. There is no automatic video playback during card browsing.
- Play/pause, mute, seek, fullscreen, retry, and close controls work by pointer, touch, or keyboard. Fullscreen uses native video controls, with an iOS fullscreen path where available.
- Focus the carousel and use Left/Right, Home/End. Each active playable card participates in normal tab navigation; pagination and previous/next buttons are an alternative. The dialog traps Tab/Shift+Tab, Escape closes, and focus returns to the card after closing.
- Clicking the backdrop or scrolling enough on a mouse/trackpad closes the player. Page scrolling is locked while the player is open and restored on close/unmount.
- Reduced motion removes flying-card rotation, tilt, depth, reflective motion, and float; navigation and expansion resolve instantly. The scroll progression remains directly user-controlled.
- One event-driven animation-frame scheduler per instance, with no permanent JavaScript loop when idle. Float is CSS animation, paused offscreen/hidden. The registry lazy-loads this component. The first image/font settle behind a small preparing state rather than a broken flight.

## Demo and evidence

Open `/?component=signature-moments` or choose **Signature Moments** in the lab. Five cards and locally hosted 480p demo clips have source records in `public/assets/signature-moments/SOURCES.md`. The fifth card repeats the smaller second-card clip as a demo placeholder. Total clip storage is about 52 MiB across five files; opening a card downloads only that clip via browser media requests.

Reference observations and differences: `references/jjettas-signature-moments.md`. Behavioral tests: `tests/signature-moments.spec.ts`. A separate fixture verifies custom content and the API outside the lab. Captures live in ignored `artifacts/signature-validation/` and `artifacts/references/signature-moments/`.
