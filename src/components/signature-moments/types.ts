import type { CSSProperties, HTMLAttributes, Ref } from 'react'

export type SignatureMoment = {
  id: string
  title: string
  stat: string
  image: { src: string; width: number; height: number; alt?: string }
  video?: { src: string; aspectRatio?: number }
}

export type SignatureMomentsHandle = {
  goTo: (index: number) => void
  open: (index: number) => void
  close: () => void
}

export interface SignatureMomentsProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  moments: readonly SignatureMoment[]
  heading?: string
  entrance?: boolean
  intro?: { eyebrow?: string; title?: string; description?: string }
  /** Scroll distance multiplier, clamped to .5–2. Phones use a shorter base distance. */
  scrollPace?: number
  /** 0–1, controls perspective, reflection, and ambient float. */
  motionStrength?: number
  theme?: { background?: string; accent?: string; foreground?: string; secondary?: string; headingFont?: string }
  grassTexture?: string | null
  lightTexture?: string | null
  onReady?: () => void
  onActiveChange?: (index: number) => void
  ref?: Ref<SignatureMomentsHandle>
  style?: CSSProperties
}

export type CardRect = { x: number; y: number; width: number; height: number }
export type SignatureGeometry = {
  width: number; height: number; phone: boolean; cardWidth: number; spacing: number
  introDistance: number; stepDistance: number; distance: number
}
