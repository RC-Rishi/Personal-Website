import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react'
import './rays.css'

export type RaysSettings = { colors: readonly [string, string]; intensity: number; rays: number; reach: number; position: number }
export interface RaysProps extends HTMLAttributes<HTMLDivElement> {
  /** Two six-digit hex colors; use identical colors for a single-color beam. */
  colors?: readonly [string, string]
  intensity?: number
  rays?: number
  reach?: number
  position?: number
  animate?: boolean
  speed?: number
  /** Stable starting phase, useful for predictable static previews. */
  seed?: number
  backgroundColor?: string
  radius?: number | string
  onReady?: () => void
}
const white = ['#ffffff', '#ffffff'] as const

export default function Rays({ colors = white, intensity = 50, rays = 30, reach = 40, position = 80,
  animate = true, speed = 10, seed = 217, backgroundColor = '#000000', radius = 0, onReady,
  children, className = '', style, ...props }: RaysProps) {
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const update = useRef<(() => void) | undefined>(undefined)
  const settings = useRef({ colors, intensity, rays, reach, position, animate, speed, seed, onReady })
  useEffect(() => {
    settings.current = { colors, intensity, rays, reach, position, animate, speed, seed, onReady }
    update.current?.()
  }, [colors, intensity, rays, reach, position, animate, speed, seed, onReady])

  useEffect(() => {
    const element = host.current!, target = canvas.current!
    let engine: Awaited<ReturnType<typeof import('./renderer')['createRaysRenderer']>> | undefined
    let disposed = false, visible = false, loading = false, failed = false, ready = false
    let frame = 0, lastTime = 0, time = Number.isFinite(settings.current.seed) ? settings.current.seed : 217
    let appliedSeed = time
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; element.dataset.animating = 'false' }
    const paint = (now: number) => {
      frame = 0
      if (!engine || !visible || document.hidden || disposed || failed) return
      const current = settings.current
      const seed = Number.isFinite(current.seed) ? current.seed : 217
      const speed = Number.isFinite(current.speed) ? Math.min(100, Math.max(0, current.speed)) : 0
      const animating = current.animate && !motion.matches && speed > 0 && current.rays > 0
      if (appliedSeed !== seed) { appliedSeed = seed; time = seed }
      if (lastTime && animating) time += Math.min(now - lastTime, 64) * speed / 10000
      lastTime = now
      engine.draw(current, time, Math.max(1, Math.round(element.clientWidth)), Math.max(1, Math.round(element.clientHeight)))
      element.dataset.renderer = 'webgl'
      element.dataset.phase = time.toFixed(5)
      element.dataset.animating = String(animating)
      if (!ready) { ready = true; current.onReady?.() }
      if (animating) frame = requestAnimationFrame(paint)
    }
    const schedule = () => {
      stop()
      if (engine && visible && !document.hidden && !failed) frame = requestAnimationFrame(paint)
    }
    const fallback = () => {
      failed = true; stop(); element.dataset.renderer = 'fallback'; element.dataset.animating = 'false'
      if (!ready) { ready = true; settings.current.onReady?.() }
    }
    const load = async () => {
      if (loading || engine || disposed) return
      loading = true
      try {
        const { createRaysRenderer } = await import('./renderer')
        if (disposed) return
        engine = createRaysRenderer(target)
        schedule()
      } catch { if (!disposed) fallback() }
    }
    update.current = schedule
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; element.dataset.active = String(visible && !document.hidden)
      if (visible) void load()
      schedule()
    })
    const resize = new ResizeObserver(schedule)
    const visibility = () => { element.dataset.active = String(visible && !document.hidden); schedule() }
    const lost = (event: Event) => { event.preventDefault(); fallback() }
    const restored = () => { engine?.dispose(); engine = undefined; loading = false; failed = false; if (visible) void load() }
    observer.observe(element); resize.observe(element)
    motion.addEventListener('change', schedule); document.addEventListener('visibilitychange', visibility)
    target.addEventListener('webglcontextlost', lost); target.addEventListener('webglcontextrestored', restored)
    return () => {
      disposed = true; stop(); engine?.dispose(); observer.disconnect(); resize.disconnect(); update.current = undefined
      motion.removeEventListener('change', schedule); document.removeEventListener('visibilitychange', visibility)
      target.removeEventListener('webglcontextlost', lost); target.removeEventListener('webglcontextrestored', restored)
    }
  }, [])
  return <div {...props} ref={host} className={`rays ${className}`} style={{ backgroundColor, borderRadius: radius,
    '--rays-first': colors[0], '--rays-second': colors[1], '--rays-position': `${position}%`, ...style } as CSSProperties}>
    <div className="rays-fallback" aria-hidden="true" /><canvas ref={canvas} aria-hidden="true" />
    {children && <div className="rays-content">{children}</div>}
  </div>
}
