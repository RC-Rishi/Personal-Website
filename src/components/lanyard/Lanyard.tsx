import { Component, lazy, Suspense, useEffect, useId, useImperativeHandle, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useDeviceTilt } from './useDeviceTilt'
import type { TiltStatus } from './deviceTilt'
export type { TiltStatus } from './deviceTilt'
import './lanyard.css'

const Scene = lazy(() => import('./LanyardScene'))

export type LanyardHandle = { reset: () => void; enableTilt: () => Promise<void>; disableTilt: () => void; calibrateTilt: () => void }
export type LanyardProps = {
  /** Images should allow cross-origin loading. Local assets and object URLs work. */
  frontImage?: string
  backImage?: string
  /** null gives a solid-color strap. */
  strapImage?: string | null
  cardColor?: string
  strapColor?: string
  clipColor?: string
  backgroundColor?: string
  gravity?: number
  cameraDistance?: number
  lightingIntensity?: number
  startPosition?: 'left' | 'right' | 'top' | 'bottom'
  interactive?: boolean
  /** Makes the opt-in sensor controls available. Call ref.enableTilt() from a user gesture. */
  tilt?: boolean
  /** 0–1; capped screen-relative gravity deflection with smoothing and a tremor dead zone. */
  tiltStrength?: number
  onTiltStatusChange?: (status: TiltStatus) => void
  label?: string
  className?: string
  style?: CSSProperties
  ref?: Ref<LanyardHandle>
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function StaticCard({ frontImage, cardColor, label, loading = false }: LanyardProps & { loading?: boolean }) {
  return <div className="lanyard-fallback" data-testid="lanyard-fallback">
    <div className="lanyard-fallback-strap" /><div className="lanyard-fallback-ring" />
    <div className="lanyard-fallback-card" style={{ backgroundColor: cardColor }}>
      {frontImage ? <img src={frontImage} alt={label} /> : <span>{label}</span>}
    </div>
    <p role="status">{loading ? 'Loading your lanyard…' : 'Static preview · 3D is unavailable on this device.'}</p>
  </div>
}

export default function Lanyard({ frontImage = '/assets/lanyard/front.png', backImage,
  strapImage = '/assets/lanyard/strap.png', cardColor = '#0a0a0a', strapColor = '#0f0f0f',
  clipColor = '#474747', backgroundColor = 'transparent', gravity = 60, cameraDistance = 15,
  lightingIntensity = 50, startPosition = 'left', interactive = true, tilt = false, tiltStrength = .35,
  onTiltStatusChange, label = 'Your design, interactive lanyard',
  className = '', style, ref }: LanyardProps) {
  const host = useRef<HTMLDivElement>(null)
  const hit = useRef<HTMLButtonElement>(null)
  const helpId = useId()
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)
  const [webgl] = useState(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  })
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const { vector: tiltVector, controller: tiltController, status: tiltStatus } = useDeviceTilt(host,
    { enabled: tilt && interactive && webgl, visible, reduced, strength: tiltStrength }, onTiltStatusChange)
  useImperativeHandle(ref, () => ({
    reset: () => host.current?.dispatchEvent(new Event('lanyard-reset')),
    enableTilt: async () => { await tiltController.current?.enable() },
    disableTilt: () => tiltController.current?.disable(),
    calibrateTilt: () => tiltController.current?.calibrate(),
  }), [tiltController])
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motion = () => setReduced(query.matches)
    query.addEventListener('change', motion)
    let intersects = false
    const sync = () => setVisible(intersects && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting
      if (intersects) setEntered(true)
      sync()
    })
    if (host.current) observer.observe(host.current)
    document.addEventListener('visibilitychange', sync)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); query.removeEventListener('change', motion) }
  }, [])
  const fallback = <StaticCard frontImage={frontImage} cardColor={cardColor} label={label} />
  return <div ref={host} className={`lanyard ${className}`} style={{ background: backgroundColor, ...style }}
    data-active={visible} data-reduced-motion={reduced} data-tilt={tiltStatus}>
    {webgl === false ? fallback : entered && webgl && <SceneBoundary fallback={fallback}>
      <Suspense fallback={<StaticCard frontImage={frontImage} label={label} loading />}>
        <Scene {...{ frontImage, backImage, strapImage, cardColor, strapColor, clipColor, gravity,
          cameraDistance, lightingIntensity, startPosition, interactive, reduced, visible, host, hit, tiltVector }} />
      </Suspense>
    </SceneBoundary>}
    {webgl && <button ref={hit} className="lanyard-hit" type="button" disabled={!interactive}
      aria-label={label} aria-describedby={helpId} style={{ visibility: 'hidden' }} />}
    <span id={helpId} className="lanyard-sr-only">Drag the card to swing it. With the card focused, use arrow keys to swing, Space to turn, and Home to reset.</span>
  </div>
}
