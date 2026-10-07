# Rays

A standalone light-ray surface adapted from the supplied Framer University shader. No Three.js or remote runtime is required.

```tsx
import Rays from './components/rays/Rays'

<Rays colors={['#639aff', '#639aff']} intensity={13} rays={32} reach={16}
  position={50} style={{ height: 600 }}>
  <h1>Your content</h1>
</Rays>
```

Props: two six-digit hex `colors` (white by default), `intensity` (50), `rays` (30), `reach` (40), `position` (80), `animate` (true), `speed` (10), `seed` (217), `backgroundColor` (black), `radius` (0), `onReady`, children, and standard div attributes. Numeric light controls are clamped to 0–100. Identical colors produce single-color light. The container needs a size; its default minimum height is 400px.

The lab starts with the live reference's softer blue preset; **Source defaults** restores the supplied module's white defaults. **Live reference preset** restores the demo preset. For isolated comparisons use `/?component=rays&view=effect&animate=false`.

The renderer loads on first visibility. Reduced motion, zero speed/ray amount, pause, offscreen instances, and hidden documents stop continuous draws. Controls and resizing still redraw a static frame. A stable starting phase makes static comparisons reproducible; the reference chooses a random phase. WebGL failure/context loss uses a decorative CSS approximation; context restoration rebuilds the renderer. `onReady` fires once when the first rendered frame or fallback is ready.

Source, measurements, and intentional differences: `references/framer-rays.md`.
