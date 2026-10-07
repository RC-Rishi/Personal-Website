# LeatherBackground

```tsx
import LeatherBackground from './components/leather-background/LeatherBackground'

<LeatherBackground finish="cream">
  <h1>Your content</h1>
</LeatherBackground>

<LeatherBackground finish="dark" interactive={false} style={{ minHeight: 480 }} />

<LeatherBackground finish="dark" palette={{ pebble: '#183E32', crevice: '#82AA8D' }} />
```

`finish` accepts `cream` (default) or `dark`. `interactive` defaults to true and enables the dark finish's horizontal light response on desktop. Standard div attributes, className, style, and children are supported. Override minHeight to use the material on a shorter section. Its layers are isolated so their blend modes do not affect neighboring elements. CSS and images render without WebGL.

Optional `palette` accepts `pebble` and `crevice` colors (3 or 6 hex digits, with optional `#`). Invalid palette values fall back to the original material. Without a palette the original rendering is unchanged. Custom palettes use an SVG filter in sRGB to map grayscale texture tones between the chosen colors; a 12% original detail layer preserves grain even with equal colors. Lighting remains above both layers. Each instance has its own filter ID.

Open **Colors** in the demo for six stepped presets (Original, Cognac, Oxblood, Forest, Navy, Graphite), native color pickers, hex fields, and reset. Edits select Custom; invalid/incomplete hex input leaves the last valid color applied and reverts on blur. Presets and custom colors survive finish changes and panel toggles, but reset when the preview reloads. Original-mode swatches are approximate starting tones for customization, not an exact two-color decomposition of the source image.

The demo supplies optional sample text and accessible finish buttons. For an unobstructed material surface open `/?component=leather-background&finish=cream&view=texture` or use `finish=dark`.

Desktop matches the measured source's 480px cream / 560px dark tile sizes; mobile uses 340px. The cream light switches to the reference phone asset; the dark light is hidden on mobile, as in the source. Reduced motion centers the desktop light. Pointer movement is scoped to this component and animation stops when settled, offscreen, or hidden.

Asset origins and ownership are recorded in `public/assets/leather-background/SOURCES.md`. The source's lettering, portraits, navigation, and page transitions are separate from this background component.
