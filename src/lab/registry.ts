import { lazy, type ComponentType } from 'react'

export type ComponentEntry = {
  id: string
  name: string
  category: 'Hero' | 'Navigation' | 'Cards' | 'Typography' | 'Background' | 'Other'
  description: string
  status: 'Draft' | 'Ready'
  referenceUrl?: string
  Component: ComponentType
}

export const components: ComponentEntry[] = [{
  id: 'leather-background',
  name: 'Leather Background',
  category: 'Background',
  description: 'Two tactile finishes from jjettas.com: pebbled cream and dark leather, with responsive grain and desktop lighting.',
  status: 'Ready',
  referenceUrl: 'https://jjettas.com/',
  Component: lazy(() => import('../components/leather-background/LeatherBackgroundDemo')),
}, {
  id: 'lanyard',
  name: 'Interactive Lanyard',
  category: 'Cards',
  description: 'A draggable 3D pass with a flexible strap and rope physics. Customize the artwork/materials or opt into calibrated phone tilt.',
  status: 'Ready',
  referenceUrl: 'https://framer.com/m/Lanyard-Prod-D22s.js',
  Component: lazy(() => import('../components/lanyard/LanyardDemo')),
}, {
  id: 'rays',
  name: 'Light Rays',
  category: 'Background',
  description: 'Animated beams of light with two colors, adjustable reach, intensity, and movement.',
  status: 'Ready',
  referenceUrl: 'https://framer.com/m/Rays-Prod-o7ad.js',
  Component: lazy(() => import('../components/rays/RaysDemo')),
}, {
  id: 'signature-moments',
  name: 'Signature Moments',
  category: 'Cards',
  description: 'A flying-card entrance, scroll-driven field of reflective cards, and flip-to-video playback. Re-composed for phones.',
  status: 'Ready',
  referenceUrl: 'https://jjettas.com/',
  Component: lazy(() => import('../components/signature-moments/SignatureMomentsDemo')),
}, {
  id: 'sharingan-preloader',
  name: 'Sharingan Preloader',
  category: 'Other',
  description: 'A rotating ink symbol, real loading progress, a full-screen awakening, and a circular entrance. Customize paper, ink, and matte grain.',
  status: 'Ready',
  Component: lazy(() => import('../components/sharingan-preloader/SharinganPreloaderDemo')),
}]
