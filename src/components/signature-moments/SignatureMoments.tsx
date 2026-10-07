import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { createSignatureMotion } from './motion'
import VideoPlayer, { type VideoPlayerHandle } from './VideoPlayer'
import type { CardRect, SignatureMoment, SignatureMomentsProps } from './types'
import './signature-moments.css'
export type { SignatureMoment, SignatureMomentsProps, SignatureMomentsHandle } from './types'

type Expansion = { index: number; moment: SignatureMoment; origin: CardRect; ratio: number; closing: boolean }
const asset = (url: string | null) => url ? `url(${JSON.stringify(url)})` : 'none'

function Yardlines() {
  const marks: (number | null)[] = Array.from({ length: 9 }, () => null)
  for (const value of [10, 20, 30, 40, 50, 40, 30, 20, 10]) marks.push(value, ...Array.from({ length: 9 }, () => null))
  return <div className="signature-yards" aria-hidden="true">{marks.map((value, i) => <span key={i} className={value ? 'signature-yard-major' : 'signature-yard-minor'}>{value ? <b>{value}</b> : <><i /><i /><i /></>}</span>)}</div>
}

export default function SignatureMoments({ moments, heading = 'Signature Moments', entrance = true,
  intro, scrollPace = 1, motionStrength = 1, theme, grassTexture = '/assets/signature-moments/grass.webp',
  lightTexture = '/assets/signature-moments/light.webp', onReady, onActiveChange, className = '', style, ref, ...props }: SignatureMomentsProps) {
  const root = useRef<HTMLElement>(null)
  const controller = useRef<ReturnType<typeof createSignatureMotion> | undefined>(undefined)
  const callbacks = useRef({ onReady, onActiveChange })
  const readyNotified = useRef(false)
  const [active, setActive] = useState(0)
  const [expansion, setExpansion] = useState<Expansion | null>(null)
  const expanded = useRef<Expansion | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const restoreFocus = useRef<number | null>(null)
  const player = useRef<VideoPlayerHandle>(null)
  const mover = useRef<HTMLDivElement>(null), flip = useRef<HTMLDivElement>(null)
  const titleId = useId(), helpId = useId(), playerId = useId()
  const [playerBounds, setPlayerBounds] = useState({ width: 700, height: 394, x: 500, y: 400 })
  const isOpen = expansion !== null
  const close = useCallback(() => {
    const current = expanded.current
    if (!current || current.closing) return
    player.current?.stop()
    const next = { ...current, closing: true, origin: controller.current?.getRect(current.index) ?? current.origin }
    expanded.current = next; setExpansion(next)
    closeTimer.current = setTimeout(() => {
      restoreFocus.current = current.index
      expanded.current = null; setExpansion(null); controller.current?.setPlayback(null)
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500)
  }, [])
  const open = useCallback((index: number) => {
    const moment = moments[index], origin = controller.current?.getRect(index)
    if (!moment?.video || !origin) return
    clearTimeout(closeTimer.current)
    player.current?.stop()
    const next = { index, moment, origin, ratio: moment.video.aspectRatio ?? 16 / 9, closing: false }
    expanded.current = next; setExpansion(next)
    controller.current?.jump(index, false)
    controller.current?.setPlayback(index)
    queueMicrotask(() => root.current?.querySelector<HTMLButtonElement>('.signature-player-close')?.focus({ preventScroll: true }))
  }, [moments])
  useEffect(() => { callbacks.current = { onReady, onActiveChange } }, [onReady, onActiveChange])
  useEffect(() => {
    if (!moments.length) {
      let disposed = false
      queueMicrotask(() => { if (!disposed && !readyNotified.current) { readyNotified.current = true; callbacks.current.onReady?.() } })
      return () => { disposed = true }
    }
    if (!root.current) return
    const engine = createSignatureMotion(root.current, moments.length, {
      index: index => { setActive(index); callbacks.current.onActiveChange?.(index) },
      ready: () => { if (!readyNotified.current) { readyNotified.current = true; callbacks.current.onReady?.() } },
      invisible: close,
    })
    controller.current = engine
    return () => { engine.dispose(); controller.current = undefined }
  }, [moments.length, close])
  useEffect(() => { controller.current?.update({ entrance, scrollPace, strength: motionStrength }) }, [entrance, scrollPace, motionStrength, moments])
  useImperativeHandle(ref, () => ({ goTo: index => controller.current?.jump(index), open, close }), [open, close])
  useEffect(() => () => { clearTimeout(closeTimer.current); player.current?.stop() }, [])
  useEffect(() => {
    if (!expansion && restoreFocus.current !== null) {
      const index = restoreFocus.current
      restoreFocus.current = null
      // Restore after the disappearing dialog and hidden selected card have
      // completed their browser focus/visibility updates (including a 0ms close).
      const frame = requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.signature-card')[index]?.focus({ preventScroll: true }))
      return () => cancelAnimationFrame(frame)
    }
  }, [expansion])

  useEffect(() => {
    if (!isOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let wheelAmount = 0
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab') return
      const dialog = root.current?.querySelector<HTMLElement>('.signature-expanded')
      const elements = dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')] : []
      if (!elements.length) return
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.signature-player-mover,.signature-player-close,.signature-card')) close()
    }
    const wheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest('.signature-video-controls')) return
      event.preventDefault(); wheelAmount += Math.abs(event.deltaY)
      if (wheelAmount > 170) close()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('wheel', wheel, { passive: false })
    root.current?.querySelector<HTMLButtonElement>('.signature-player-close')?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); window.removeEventListener('wheel', wheel)
    }
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    const pin = root.current!.querySelector<HTMLElement>('.signature-pin')!
    const measure = () => {
      const current = expanded.current
      if (!current) return
      const width = pin.clientWidth, height = pin.clientHeight
      const phone = root.current!.dataset.layout === 'phone'
      const ratio = Number.isFinite(current.ratio) && current.ratio > 0 ? current.ratio : 16 / 9
      const w = Math.min(phone ? width - 32 : width * .7, (phone ? height - 130 : height * .74) * ratio)
      setPlayerBounds({ width: Math.max(80, w), height: Math.max(45, w / ratio), x: width / 2, y: height / 2 })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(pin); measure()
    return () => observer.disconnect()
  }, [isOpen, expansion?.ratio])

  useLayoutEffect(() => {
    if (!expansion || !mover.current || !flip.current) return
    const element = mover.current, face = flip.current, origin = expansion.origin
    const start = { left: `${origin.x + origin.width / 2}px`, top: `${origin.y + origin.height / 2}px`, width: `${origin.width}px`, height: `${origin.height}px`, transform: 'translate(-50%,-50%) rotateZ(0deg)' }
    const end = { left: `${playerBounds.x}px`, top: `${playerBounds.y}px`, width: `${playerBounds.height}px`, height: `${playerBounds.width}px`, transform: 'translate(-50%,-50%) rotateZ(90deg)' }
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : expansion.closing ? 500 : 750
    const hasAnimated = element.dataset.animated === 'true'
    if (!hasAnimated) Object.assign(element.style, start)
    const from = { left: getComputedStyle(element).left, top: getComputedStyle(element).top, width: getComputedStyle(element).width, height: getComputedStyle(element).height, transform: getComputedStyle(element).transform }
    const frame = element.animate([hasAnimated ? from : start, expansion.closing ? start : end], { duration, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
    const turn = face.animate([{ transform: hasAnimated ? getComputedStyle(face).transform : 'rotateY(0deg)' }, { transform: expansion.closing ? 'rotateY(0deg)' : 'rotateY(180deg)' }], { duration, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
    element.dataset.animated = 'true'
    element.dataset.settled = 'false'
    const commit = (animation: Animation) => {
      if (animation.playState !== 'idle') {
        const target = animation === frame ? element : face
        if (target.isConnected) {
          const computed = getComputedStyle(target)
          const pose = animation === frame ? { left: computed.left, top: computed.top, width: computed.width, height: computed.height, transform: computed.transform } : { transform: computed.transform }
          try { animation.commitStyles() } catch { Object.assign(target.style, pose) }
        }
        animation.cancel()
      }
    }
    // Commit the final pose so subsequent resizes/closing begin from the visible state.
    void frame.finished.then(() => { commit(frame); commit(turn); element.dataset.settled = String(!expansion.closing) }).catch(() => {})
    return () => { commit(frame); commit(turn) }
  }, [expansion, playerBounds])
  const aspect = useCallback((ratio: number) => {
    const current = expanded.current
    if (!current || Math.abs(current.ratio - ratio) < .005) return
    const next = { ...current, ratio }; expanded.current = next; setExpansion(next)
  }, [])
  const first = moments[0]
  const customStyle = {
    '--signature-count': moments.length,
    '--signature-background': theme?.background ?? '#171220', '--signature-accent': theme?.accent ?? '#4f2bab',
    '--signature-foreground': theme?.foreground ?? '#f4efe6', '--signature-secondary': theme?.secondary ?? '#b0a89d',
    '--signature-heading-font': theme?.headingFont ?? '"Signature Barlow", Impact, sans-serif',
    '--signature-grass': asset(grassTexture), '--signature-light': asset(lightTexture), ...style,
  } as CSSProperties
  if (!first) return <section {...props} ref={root} className={`signature-moments signature-empty ${className}`} style={customStyle}><h2>{heading}</h2><p>No moments yet.</p></section>
  return <section {...props} ref={root} className={`signature-moments ${className}`} style={customStyle} aria-labelledby={titleId} data-current={active} data-playing={isOpen}>
    <div className="signature-pin" role="region" aria-roledescription="carousel" aria-label={heading} aria-describedby={helpId} tabIndex={0}>
      <div className="signature-field" aria-hidden="true" />
      <div className="signature-headline"><h2 id={titleId} className="signature-heading">{heading}</h2></div>
      <div className="signature-grass" aria-hidden="true" />
      <Yardlines />
      <div className="signature-light" aria-hidden="true" />
      <div className="signature-track" aria-hidden={isOpen || undefined}>
        {moments.map((moment, index) => {
          const hasVideo = Boolean(moment.video)
          const Element = hasVideo ? 'button' : 'div'
          return <article key={moment.id} className="signature-slot" data-signature-slot={index} data-aspect={moment.image.width / moment.image.height || 2 / 3} data-selected={expansion?.index === index}>
            <div className="signature-float" style={{ animationDelay: `${-1.27 * index}s`, animationDuration: `${6.4 + index % 3 * 1.1}s` }}>
              <Element className="signature-card" style={{ aspectRatio: `${moment.image.width || 2} / ${moment.image.height || 3}` }}
                {...hasVideo ? { type: 'button' as const, tabIndex: !isOpen && index === active ? 0 : -1, 'aria-label': `Open ${moment.title}`, onClick: () => open(index) } : {}}
                aria-describedby={`${helpId}-${index}`}>
                <div className="signature-card-plane">
                  <img src={moment.image.src} width={moment.image.width} height={moment.image.height} alt={moment.image.alt ?? moment.title} draggable={false} decoding="async" loading={index ? 'lazy' : 'eager'}
                    onLoad={e => { e.currentTarget.style.opacity = ''; delete e.currentTarget.parentElement!.dataset.imageError }}
                    onError={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.parentElement!.dataset.imageError = 'true' }} />
                  <span className="signature-image-fallback">{moment.title}</span>
                  <span className="signature-sheen" aria-hidden="true" /><span className="signature-iridescence" aria-hidden="true" />
                </div>
              </Element>
            </div>
            <div className="signature-caption" id={`${helpId}-${index}`}><p>{moment.title}</p><span>{moment.stat}</span></div>
          </article>
        })}
      </div>
      {entrance && <>
        <div className="signature-intro">
          <div className="signature-intro-copy"><p className="signature-eyebrow">{intro?.eyebrow ?? 'A STORY IN MOTION'}</p><h3>{intro?.title ?? 'Some moments\nstay with you.'}</h3><p>{intro?.description ?? 'The plays. The milestones. The moments that made the story.'}</p></div>
          <button className="signature-origin" type="button" aria-label="Explore signature moments" onClick={() => controller.current?.jump(0)} style={{ aspectRatio: `${first.image.width} / ${first.image.height}` }}><img src={first.image.src} alt="" draggable={false} /></button>
          <button className="signature-explore" type="button" onClick={() => controller.current?.jump(0)}>Explore the moments <ArrowDown size={15} /></button>
        </div>
        <div className="signature-flight" aria-hidden="true"><div className="signature-flight-plane"><img src={first.image.src} alt="" draggable={false} /><span className="signature-flight-shine" /></div></div>
      </>}
      <nav className="signature-navigation" aria-label="Moment navigation" data-signature-navigation="true">
        <span className="signature-scroll-hint">SCROLL OR DRAG TO EXPLORE</span>
        <div className="signature-pagination">
          <button type="button" aria-label="Previous moment" disabled={active === 0 || isOpen} onClick={() => controller.current?.jump(active - 1)}><ArrowLeft size={16} /></button>
          {moments.map((moment, index) => <button key={moment.id} type="button" className="signature-dot" aria-label={`Show moment ${index + 1} of ${moments.length}`} aria-current={index === active ? 'true' : undefined} disabled={isOpen} onClick={() => controller.current?.jump(index)}><span /></button>)}
          <button type="button" aria-label="Next moment" disabled={active === moments.length - 1 || isOpen} onClick={() => controller.current?.jump(active + 1)}><ArrowRight size={16} /></button>
        </div>
        <span className="signature-counter" aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(moments.length).padStart(2, '0')}</span>
      </nav>
      <span id={helpId} className="signature-sr-only">Scroll down or drag sideways to explore. With the carousel focused, use Left and Right arrows, Home and End. When available, open a card to watch its video; Escape closes playback.</span>
      <div className="signature-watch-cursor" aria-hidden="true">WATCH</div>
      <div className="signature-preparing" role="status">Preparing the moments…</div>
      {expansion && <div className="signature-expanded" role="dialog" aria-modal="true" aria-labelledby={playerId} data-closing={expansion.closing}>
        <h3 id={playerId} className="signature-sr-only">{expansion.moment.title}</h3>
        <div className="signature-player-shade" aria-hidden="true" />
        <button type="button" className="signature-player-close" aria-label="Close video" onClick={close}><X size={20} /></button>
        <div ref={mover} className="signature-player-mover" key={expansion.moment.id}
          style={{ '--signature-player-width': `${playerBounds.width}px`, '--signature-player-height': `${playerBounds.height}px` } as CSSProperties}>
          <div ref={flip} className="signature-player-flip">
            <div className="signature-player-front"><img src={expansion.moment.image.src} alt="" /></div>
            <div className="signature-player-back"><VideoPlayer key={expansion.moment.id} ref={player} src={expansion.moment.video!.src} title={expansion.moment.title} closing={expansion.closing} onAspect={aspect} /></div>
          </div>
        </div>
      </div>}
    </div>
  </section>
}
