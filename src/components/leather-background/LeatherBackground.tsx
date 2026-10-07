import { useEffect, useId, useRef, type HTMLAttributes, type CSSProperties } from 'react'
import { hexChannels, normalizeHex, type LeatherPalette } from './palettes'
export type { LeatherPalette } from './palettes'
import './leather-background.css'

export type LeatherFinish = 'cream' | 'dark'

export interface LeatherBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /** Cream opening texture or dark footer leather from the reference. */
  finish?: LeatherFinish
  /** Enable the dark finish's desktop pointer-following light. */
  interactive?: boolean
  /** Optional tonal colors. Omit to retain the reference material. */
  palette?: LeatherPalette
}

/** A self-contained material surface. Place arbitrary content inside it. */
export default function LeatherBackground({
  finish = 'cream',
  interactive = true,
  palette,
  children,
  className = '',
  style,
  ...props
}: LeatherBackgroundProps) {
  const surface = useRef<HTMLDivElement>(null)
  const light = useRef<HTMLDivElement>(null)
  const filterId = `leather-tone-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const pebble = palette && normalizeHex(palette.pebble)
  const crevice = palette && normalizeHex(palette.crevice)
  const custom = Boolean(pebble && crevice)
  const low = hexChannels(pebble ?? '#000000')
  const high = hexChannels(crevice ?? '#FFFFFF')
  const surfaceStyle = custom ? { '--leather-base': pebble, ...style } as CSSProperties : style

  useEffect(() => {
    const element = surface.current
    const lightElement = light.current
    if (!element || !lightElement || finish !== 'dark' || !interactive) return

    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)')
    let visible = true
    let frame = 0
    let target = 0
    let current = 0
    let previousTime = 0
    const enabled = () => !motion.matches && pointer.matches && visible && !document.hidden
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0 }
    const reset = () => { stop(); target = 0; current = 0; lightElement.style.transform = 'translate3d(0px, 0, 0)' }
    const tick = (time: number) => {
      frame = 0
      if (!enabled()) return
      // Reference easing is 0.06 per 60Hz frame; normalize for other refresh rates.
      const dt = previousTime ? Math.min(time - previousTime, 64) : 1000 / 60
      previousTime = time
      current += (target - current) * (1 - Math.pow(0.94, dt / (1000 / 60)))
      if (Math.abs(target - current) < 0.02) current = target
      lightElement.style.transform = `translate3d(${current.toFixed(2)}px, 0, 0)`
      if (current !== target) frame = requestAnimationFrame(tick)
      else previousTime = 0
    }
    const move = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === 'touch') return
      const rect = element.getBoundingClientRect()
      target = (Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 2 - 1) * rect.width * 0.045
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const visibility = () => { if (!enabled()) reset() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible) reset()
    })
    observer.observe(element)
    element.addEventListener('pointermove', move, { passive: true })
    element.addEventListener('pointerleave', reset)
    motion.addEventListener('change', reset)
    pointer.addEventListener('change', reset)
    window.addEventListener('resize', reset)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      reset()
      observer.disconnect()
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', reset)
      motion.removeEventListener('change', reset)
      pointer.removeEventListener('change', reset)
      window.removeEventListener('resize', reset)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [finish, interactive])

  return (
    <div {...props} ref={surface} className={`leather-background ${className}`} data-finish={finish} data-palette={custom ? 'custom' : 'original'} style={surfaceStyle}>
      {custom && <svg className="leather-background__filters" aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={high[0] - low[0]} intercept={low[0]} />
              <feFuncG type="linear" slope={high[1] - low[1]} intercept={low[1]} />
              <feFuncB type="linear" slope={high[2] - low[2]} intercept={low[2]} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>}
      <div className="leather-background__material" aria-hidden="true">
        <div className="leather-background__grain" style={custom ? { filter: `url(#${filterId})` } : undefined} />
        {custom && <div className="leather-background__grain leather-background__relief" />}
        <div className="leather-background__light" ref={light} />
      </div>
      {children && <div className="leather-background__content">{children}</div>}
    </div>
  )
}
