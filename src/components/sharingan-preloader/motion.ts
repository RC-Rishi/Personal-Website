import { animate } from 'motion'
import { clamp, inkPath, out, smooth } from './geometry'

export type PreloaderPacing = 'compact' | 'cinematic'
export type PreloaderPhase = 'forming' | 'loading' | 'awakening' | 'ready' | 'exiting' | 'exited'
type Playback = ReturnType<typeof animate>

export function createPreloaderMotion(root: HTMLElement, pacing: PreloaderPacing, callbacks: {
  phase: (phase: PreloaderPhase) => void; exit: () => void
}) {
  const paths = [...root.querySelectorAll<SVGPathElement>('.sharing-arm')]
  const core = root.querySelector<SVGCircleElement>('.sharing-core')!
  const ring = root.querySelector<SVGGElement>('.sharing-ring')!
  const arc = root.querySelector<SVGCircleElement>('.sharing-progress-arc')!
  const shock = root.querySelector<SVGCircleElement>('.sharing-shock')!
  const caption = root.querySelector<HTMLElement>('.sharing-caption')!
  const percentage = root.querySelector<HTMLElement>('.sharing-percent')!
  const progressbar = root.querySelector<HTMLElement>('[role=progressbar]')!
  const portal = root.querySelector<HTMLElement>('.sharing-portal')!
  const emblem = root.querySelector<HTMLElement>('.sharing-emblem')!
  const tempest = root.querySelector<HTMLElement>('.sharing-tempest')!
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  let phase: PreloaderPhase = 'forming', disposed = false, visible = false, confirmed = false
  let target = 0, displayed = 0, wheel = 0, wheelTime = 0, enterProgress = 0
  let touch: { id: number; x: number; y: number } | undefined
  let stage: Playback | undefined, progressAnimation: Playback | undefined
  let portalScale = 1
  const paused = () => !visible || document.hidden
  const setPhase = (next: PreloaderPhase) => {
    if (disposed) return
    phase = next; root.dataset.phase = next; callbacks.phase(next)
    wheel = 0; touch = undefined
  }
  const syncPause = () => {
    const pause = paused()
    root.dataset.paused = String(pause)
    for (const animation of [stage, progressAnimation]) {
      if (!animation || animation.state === 'finished') continue
      if (pause) animation.pause(); else animation.play()
    }
  }
  const play = (seconds: number, update: (p: number) => void, complete: () => void) => {
    stage?.stop()
    stage = animate(0, 1, { duration: seconds, ease: 'linear', onUpdate: update,
      onComplete: () => { if (!disposed) complete() } })
    syncPause()
  }
  const paintProgress = (p: number) => {
    displayed = p
    arc.style.strokeDashoffset = String(100 * (1 - p))
    percentage.textContent = `${Math.round(p * 100).toString().padStart(2, '0')}%`
  }
  const form = (p: number) => {
    core.setAttribute('transform', 'scale(1)')
    core.style.opacity = String(smooth(p / .35))
    caption.style.opacity = String(smooth(p / .45))
    // Show real progress immediately, including fast/cached completions.
    ring.style.opacity = '1'
    paths.forEach((path, i) => {
      // One coherent rotating symbol fades into the paper. No separate
      // births, shrinking coins, or forced full-turn spiral choreography.
      path.setAttribute('transform', `rotate(${-i * 120}) translate(0 -22)`)
      path.style.opacity = String(smooth(p / .7))
      path.setAttribute('d', inkPath(0))
    })
  }
  const awaken = (p: number) => {
    const burst = clamp((p - .18) / .3)
    const squeeze = 1 - .18 * smooth(p / .18)
    paths.forEach((path, i) => {
      // Commas pull in, tear into long strokes, and fly out with the shockwave.
      path.setAttribute('transform', `rotate(${-i * 120 - burst * 28}) translate(0 ${-22 - out(burst) * 240}) scale(${squeeze + burst * .8} ${squeeze + burst * 2.6})`)
      path.setAttribute('d', inkPath(smooth(burst)))
      path.style.opacity = String(1 - smooth(burst))
    })
    core.setAttribute('transform', `scale(${1 - .1 * Math.sin(clamp(p / .5) * Math.PI)})`)
    ring.style.opacity = String(1 - smooth((p - .16) / .18))
    const wave = clamp((p - .18) / .5)
    shock.setAttribute('transform', `scale(${.6 + out(wave) * 14})`)
    shock.style.opacity = String(Math.sin(wave * Math.PI) * (1 - wave) * .95)
    const arrival = out((p - .32) / .68)
    tempest.style.opacity = String(smooth((p - .3) / .18))
    tempest.style.transform = `translate(-50%, -50%) rotate(${(1 - arrival) * 105}deg) scale(${2.6 - arrival * 1.6})`
    percentage.style.opacity = String(1 - smooth(p / .2))
    caption.style.opacity = String(p < .48 ? 1 - smooth(p / .28) : smooth((p - .66) / .34))
  }
  const makeReady = () => {
    awaken(1); caption.style.opacity = '1'; core.setAttribute('transform', 'scale(1)')
    setPhase('ready')
  }
  const maybeAwaken = () => {
    if (phase !== 'loading' || !confirmed || target < 1 || displayed < .999) return
    if (media.matches) { makeReady(); return }
    setPhase('awakening')
    play(pacing === 'compact' ? 1.1 : 1.8, awaken, makeReady)
  }
  const formed = () => { form(1); setPhase('loading'); maybeAwaken() }
  const paintExit = (p: number) => {
    enterProgress = p
    if (media.matches) { root.style.opacity = String(1 - p); return }
    const growth = smooth(p / .76)
    portal.style.transform = `translate(-50%, -50%) scale(${1 + (portalScale - 1) * growth})`
    portal.style.visibility = 'visible'
    caption.style.opacity = String(1 - out(p / .22))
    root.style.opacity = String(1 - smooth((p - .76) / .24))
  }
  const measure = () => {
    const bounds = root.getBoundingClientRect(), symbol = emblem.getBoundingClientRect()
    const x = symbol.left + symbol.width / 2 - bounds.left, y = symbol.top + symbol.height / 2 - bounds.top
    const diameter = symbol.width * 80 / 340
    portal.style.left = `${x}px`; portal.style.top = `${y}px`
    portal.style.width = portal.style.height = `${diameter}px`
    portalScale = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y)) * 2 / diameter + 2
    if (phase === 'exiting') paintExit(enterProgress)
  }
  const enter = () => {
    if (phase !== 'ready' || paused() || disposed) return
    measure(); setPhase('exiting')
    play(media.matches ? .18 : .9, paintExit, () => { setPhase('exited'); callbacks.exit() })
  }
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return
    event.preventDefault()
    if (phase !== 'ready') { wheel = 0; return }
    const now = performance.now()
    if (now - wheelTime > 220 || event.deltaY < 0) wheel = 0
    wheelTime = now
    wheel += Math.max(0, event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1))
    if (wheel >= 60) enter()
  }
  const pointerDown = (event: PointerEvent) => {
    if (phase !== 'ready' || event.pointerType !== 'touch' || !event.isPrimary) return
    if ((event.target as Element).closest('button')) return
    touch = { id: event.pointerId, x: event.clientX, y: event.clientY }
    root.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event: PointerEvent) => {
    if (!touch || touch.id !== event.pointerId) return
    if (touch.y - event.clientY > 45 && Math.abs(touch.x - event.clientX) < 90) enter()
  }
  const pointerEnd = () => { touch = undefined }
  const key = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && event.target === root)) {
      event.preventDefault(); enter()
    }
  }
  const motionChange = () => {
    if (phase === 'exited') return
    root.dataset.reducedMotion = String(media.matches)
    if (media.matches) {
      stage?.stop(); progressAnimation?.stop(); paintProgress(target)
      if (phase === 'exiting') { paintExit(1); setPhase('exited'); callbacks.exit() }
      else if (phase === 'awakening' || phase === 'ready') makeReady()
      else { form(1); setPhase('loading'); maybeAwaken() }
    }
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPause() })
  const resize = new ResizeObserver(measure)
  observer.observe(root); resize.observe(root)
  root.addEventListener('wheel', onWheel, { passive: false })
  root.addEventListener('pointerdown', pointerDown); root.addEventListener('pointermove', pointerMove)
  root.addEventListener('pointerup', pointerEnd); root.addEventListener('pointercancel', pointerEnd)
  root.addEventListener('keydown', key)
  media.addEventListener('change', motionChange); document.addEventListener('visibilitychange', syncPause)
  root.dataset.reducedMotion = String(media.matches)
  root.style.opacity = '1'; portal.style.visibility = 'hidden'; percentage.style.opacity = '.85'; tempest.style.opacity = '0'
  form(0); paintProgress(0); measure(); setPhase('forming')
  if (media.matches) formed()
  else play(pacing === 'compact' ? .65 : 1, form, formed)
  return {
    enter,
    update(progress: number, ready: boolean) {
      if (disposed || phase === 'exited') return
      confirmed = ready
      const next = Math.max(target, clamp(progress))
      if (next !== target) {
        target = next
        progressbar.setAttribute('aria-valuenow', String(Math.round(target * 100)))
        progressAnimation?.stop()
        if (media.matches) paintProgress(target)
        else {
          progressAnimation = animate(displayed, target, { duration: .32, ease: 'easeOut', onUpdate: paintProgress, onComplete: maybeAwaken })
          syncPause()
        }
      }
      maybeAwaken()
    },
    dispose() {
      disposed = true; stage?.stop(); progressAnimation?.stop(); observer.disconnect(); resize.disconnect()
      root.removeEventListener('wheel', onWheel); root.removeEventListener('pointerdown', pointerDown)
      root.removeEventListener('pointermove', pointerMove); root.removeEventListener('pointerup', pointerEnd)
      root.removeEventListener('pointercancel', pointerEnd); root.removeEventListener('keydown', key)
      media.removeEventListener('change', motionChange); document.removeEventListener('visibilitychange', syncPause)
    },
  }
}
