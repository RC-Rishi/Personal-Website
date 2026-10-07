# Collected components

Create one folder per component, with its React component, styles, and any supporting files. Components should receive content through typed props and work independently of the gallery. Add an entry to `src/lab/registry.ts` using a small demo wrapper if props are required.

Three.js, React Three Fiber, Drei, and Motion are installed. Import them only in components that need them. Lazy-load 3D demos so opening the gallery doesn't load every model and scene. Honor reduced motion, support touch and keyboard interactions, and provide a fallback for unavailable WebGL.
