# Lanyard

A standalone, draggable 3D badge adapted from the Framer University component supplied in `references/framer-lanyard.md`.

```tsx
import Lanyard from './components/lanyard/Lanyard'

<Lanyard
  frontImage="/assets/my-pass.png"
  backImage="/assets/my-pass-back.png"
  strapImage={null}
  strapColor="#554637"
  clipColor="#9c8a61"
  label="My personal website pass"
  style={{ height: 600 }}
/>
```

Props: `frontImage`, `backImage`, `strapImage` (null = solid color), `cardColor`, `strapColor`, `clipColor`, `backgroundColor`, `gravity` (default 60), `cameraDistance` (15), `lightingIntensity` (50), `startPosition` (left/right/top/bottom), `interactive`, accessible `label`, `className`, and `style`. `ref: Ref<LanyardHandle>` exposes `reset()`.

Images use cover cropping in the source model's UV atlas. Portrait artwork near 2:3 fits best. Card color fills the back and any area not covered by an image; an opaque front image will cover that color. External images need CORS permission. Failed artwork loads leave the base card color visible. Defaults use the original sample assets under `public/assets/lanyard/`.

The component needs a sized container; default height is 600px and width is 100%. It loads its scene on first visibility, stops drawing offscreen or when settled, and responds to document visibility. Reduced-motion users start with a stationary hanging card; intentional interactions retain physics. Keyboard: arrows swing, Space turns, Home/Escape reset. Touch capture applies only to the card outline so the rest of the component can scroll. Without WebGL, it renders a static card.

The gallery's **Customize** panel changes materials/gravity and accepts local front/back artwork. Those images stay in the current page session and are not uploaded to a server.

Dependencies: Three.js, React Three Fiber, Drei, React Three Rapier, Meshline. All 3D code is dynamically imported. No Framer account or remote runtime is required.

## Optional device tilt

Pass `tilt` to make the sensor controller available, then call `ref.enableTilt()` directly from a user click/tap. Sensor access is never requested on mount. The lab exposes **Enable tilt**, **Disable tilt**, **Calibrate**, and a strength slider inside **Customize**.

```tsx
const pass = useRef<LanyardHandle>(null)

<button onClick={() => void pass.current?.enableTilt()}>Enable tilt</button>
<Lanyard ref={pass} tilt tiltStrength={0.35} onTiltStatusChange={setStatus} />
```

`tiltStrength` is clamped to 0–1 (default .35). `onTiltStatusChange` reports `off`, `requesting`, `waiting`, `active`, `paused`, `denied`, or `unavailable`. The handle also exposes `disableTilt()` and `calibrateTilt()`.

The first valid beta/gamma reading sets neutral. Orientation is converted to a gravity vector in the screen's coordinate frame before comparing to neutral. This keeps directions consistent when held past upright or when the browser switches Euler-angle representations; raw angle subtraction could reverse the badge. A small gravity-space dead zone filters tremor; deflection is capped and eased. Camera distance eases outward as needed to keep a tilted badge within narrow frames. Steady readings allow the physics and renderer to settle. Dragging takes priority and release smoothly restores tilt. Screen rotation recalibrates the coordinate frame. Sensing pauses offscreen, in a hidden document, with reduced motion, or when interactivity is disabled; resume calibrates afresh.

The conversion follows the [W3C device-orientation Z-X-Y rotation model](https://www.w3.org/TR/orientation-event/#a-2-alternate-device-orientation-representations). Heading/compass drift does not affect gravity. The tilt input is device orientation rather than raw angular velocity from a gyroscope.

Browsers with `DeviceOrientationEvent.requestPermission()` request access only from that button gesture. Other browsers listen after opt-in. Sensor support needs HTTPS (or localhost) and a device with orientation readings; if none arrive within four seconds, the demo offers a retry and keeps drag/keyboard interaction available. Browser automation verifies permission paths and actual Chromium orientation events/physics; a physical iPhone/Android feel check is still pending.
