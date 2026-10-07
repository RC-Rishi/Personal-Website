import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPreloaderMotion, type PreloaderPacing, type PreloaderPhase } from './motion'
import { inkPath, tempestBlade, tempestSplinter, tempestFilament } from './geometry'
import './sharingan-preloader.css'

export type { PreloaderPacing, PreloaderPhase } from './motion'
export type SharinganPreloaderProps = {
  /** Actual readiness fraction. Never advances beyond its supplied high-water mark. */
  progress: number
  /** Confirm that the destination or a usable fallback is prepared. */
  ready: boolean
  pacing?: PreloaderPacing
  paperColor?: string
  inkColor?: string
  /** Static matte paper grain opacity, from 0 (smooth) to 1 (strong). */
  matteStrength?: number
  onExit: () => void
  className?: string
  style?: CSSProperties
}

export default function SharinganPreloader({ progress, ready, pacing = 'compact', paperColor = '#8bbdb8',
  inkColor = '#0b1110', matteStrength = .68, onExit, className = '', style }: SharinganPreloaderProps) {
  const root = useRef<HTMLElement>(null)
  const engine = useRef<ReturnType<typeof createPreloaderMotion> | undefined>(undefined)
  const exit = useRef(onExit)
  const [phase, setPhase] = useState<PreloaderPhase>('forming')
  useEffect(() => { exit.current = onExit }, [onExit])
  useEffect(() => {
    const element = root.current!
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const motion = createPreloaderMotion(element, pacing, { phase: setPhase, exit: () => {
      document.body.style.overflow = previous
      exit.current()
    } })
    engine.current = motion
    element.focus({ preventScroll: true })
    return () => { motion.dispose(); engine.current = undefined; document.body.style.overflow = previous }
  }, [pacing])
  useEffect(() => { engine.current?.update(progress, ready) }, [progress, ready, pacing])
  const awakened = phase === 'ready' || phase === 'exiting' || phase === 'exited'
  return <section ref={root} tabIndex={-1} aria-label="Website entrance" className={`sharing-preloader ${className}`}
    data-phase={phase} style={{ '--sharing-paper': paperColor, '--sharing-ink': inkColor,
      '--sharing-matte': Number.isFinite(matteStrength) ? Math.max(0, Math.min(1, matteStrength)) : .68, ...style } as CSSProperties}>
    <div className="sharing-paper" aria-hidden="true" />
    <div className="sharing-tempest" aria-hidden="true">
      <svg viewBox="-500 -500 1000 1000"><g className="sharing-tempest-rotor">
        {[0, 1, 2].map(i => <g key={i} transform={`rotate(${i * 120})`}>
          <path d={tempestBlade} /><path d={tempestSplinter} /><path d={tempestFilament} />
        </g>)}
      </g></svg>
    </div>
    <div className="sharing-emblem" aria-hidden="true">
      <svg viewBox="-170 -170 340 340" className="sharing-symbol">
        <circle className="sharing-shock" r="65" fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" opacity="0" />
        <g className="sharing-ring" opacity="0">
          <circle r="158" className="sharing-dots" pathLength="100" fill="none" />
          <circle r="158" className="sharing-progress-arc" pathLength="100" fill="none" transform="rotate(-90)" />
        </g>
        <g className="sharing-rotor">{[0, 1, 2].map(i => <path key={i} className="sharing-arm" d={inkPath(0)} opacity="0" />)}</g>
        <circle className="sharing-core" r="40" transform="scale(0)" />
      </svg>
    </div>
    <div className="sharing-caption">
      <p className="sharing-state" role="status" aria-live="polite">{awakened ? 'Scroll to enter' : phase === 'awakening' ? 'Awakening' : ready && progress >= 1 ? 'Ready' : 'Loading…'}</p>
      <span className="sharing-percent" aria-hidden="true">00%</span>
      {awakened && <button className="sharing-continue" type="button" disabled={phase !== 'ready'} onClick={() => engine.current?.enter()}>Continue <span aria-hidden="true">↓</span></button>}
    </div>
    <div className="sharing-sr-only" role="progressbar" aria-label="Preparing the first screen" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} />
    <div className="sharing-portal" aria-hidden="true" />
  </section>
}
