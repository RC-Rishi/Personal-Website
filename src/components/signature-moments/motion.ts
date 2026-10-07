import type { CardRect, SignatureGeometry } from './types'

type Options = { entrance: boolean; scrollPace: number; strength: number }
const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value))
const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress
const ease = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

/** One event-driven render scheduler per surface. CSS floats pause offscreen. */
export function createSignatureMotion(root: HTMLElement, count: number, callbacks: {
  index: (index: number) => void; ready: () => void; invisible: () => void
}) {
  const pin = root.querySelector<HTMLElement>('.signature-pin')!
  const track = root.querySelector<HTMLElement>('.signature-track')!
  const cover = root.querySelector<HTMLElement>('.signature-intro')
  const origin = root.querySelector<HTMLElement>('.signature-origin')
  const flight = root.querySelector<HTMLElement>('.signature-flight')
  const title = root.querySelector<HTMLElement>('.signature-heading')!
  const yards = root.querySelector<HTMLElement>('.signature-yards')!
  const cursor = root.querySelector<HTMLElement>('.signature-watch-cursor')!
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = matchMedia('(hover: hover) and (pointer: fine)')
  let options: Options = { entrance: true, scrollPace: 1, strength: 1 }
  let slots: HTMLElement[] = [], heights: number[] = [], captionHeights: number[] = []
  let geometry: SignatureGeometry | undefined
  let frame = 0, last = 0, visible = false, disposed = false, position = 0, intro = 0, index = -1
  let initialized = false, ready = false, playback: number | null = null, suppressUntil = 0
  let pointerX = -1, pointerY = -1, focusAfter: number | null = null
  let tween: { from: number; to: number; start: number; duration: number } | undefined
  let drag: { id: number; x: number; y: number; scroll: number; previous: number; time: number; velocity: number; active: boolean } | undefined
  const startTop = () => root.getBoundingClientRect().top + window.scrollY
  const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0 }
  const schedule = () => { if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(paint) }
  const rect = (element: HTMLElement): CardRect => {
    const box = element.getBoundingClientRect(), bounds = pin.getBoundingClientRect()
    return { x: box.left - bounds.left, y: box.top - bounds.top, width: box.width, height: box.height }
  }
  const measure = () => {
    if (disposed) return
    const width = pin.clientWidth, height = pin.clientHeight
    if (!width || !height) return
    const phone = width < 768 || width <= 900 && !pointer.matches
    const landscape = phone && width > height * 1.35
    root.dataset.layout = phone ? 'phone' : 'desktop'
    root.dataset.orientation = landscape ? 'landscape' : 'portrait'
    root.style.setProperty('--signature-unit', `${Math.min(width, 1728, 1.8 * height) / 100}px`)
    root.style.setProperty('--signature-phone-unit', `${width / 100}px`)
    root.style.setProperty('--signature-height', `${height}px`)
    slots = [...track.querySelectorAll<HTMLElement>('[data-signature-slot]')]
    const ratios = slots.map(slot => Number(slot.dataset.aspect) || 2 / 3)
    const titleBottom = title.offsetTop + title.offsetHeight
    const available = Math.max(120, height - titleBottom - (landscape ? 90 : 244))
    const cardWidth = phone ? Math.max(100, Math.min(width * .7, 300, available * Math.min(...ratios)))
      : width >= 1280 ? 16 * Math.min(width, 1728, height * 1.8) / 100 : Math.min(width * .24, height * .28)
    const spacing = landscape ? Math.max(cardWidth + 20, width * .72) : cardWidth + (phone ? 20 : width * .16)
    const pace = Number.isFinite(options.scrollPace) ? clamp(options.scrollPace, .5, 2) : 1
    const introDistance = options.entrance ? height * (phone ? .85 : 1.15) : 0
    const stepDistance = Math.max(phone ? 260 : 450, height * (phone ? .62 : .7)) * pace
    const distance = introDistance + Math.max(0, count - 1) * stepDistance + height * .35
    const previous = geometry
    geometry = { width, height, phone, cardWidth, spacing, introDistance, stepDistance, distance }
    root.style.height = `${height + distance}px`
    root.dataset.distance = distance.toFixed(2)
    root.dataset.step = stepDistance.toFixed(2)
    root.dataset.entranceDistance = introDistance.toFixed(2)
    root.style.setProperty('--signature-card-width', `${cardWidth}px`)
    root.style.setProperty('--signature-field-width', `${Math.max(width * 2.5, count * width * .76)}px`)
    heights = ratios.map(ratio => cardWidth / ratio)
    captionHeights = slots.map(slot => {
      const caption = slot.querySelector<HTMLElement>('.signature-caption')!
      return caption.offsetHeight + parseFloat(getComputedStyle(caption).marginTop)
    })
    const naturalTitleWidth = title.offsetWidth || width
    root.style.setProperty('--signature-heading-scale', String((landscape ? Math.min(width * .95, height * 1.55) : width * .95) / naturalTitleWidth))
    if (previous && (previous.width !== width || previous.height !== height) && visible) {
      const local = window.scrollY - startTop()
      if (local >= 0 && local <= previous.distance) {
        const next = local < previous.introDistance ? intro * introDistance : introDistance + position * stepDistance
        window.scrollTo({ top: startTop() + next, behavior: 'instant' })
      }
    }
    schedule()
  }
  function paint(now: number) {
    frame = 0
    if (!geometry || !visible || document.hidden || disposed) return
    if (tween) {
      const p = clamp((now - tween.start) / tween.duration)
      window.scrollTo({ top: lerp(tween.from, tween.to, ease(p)), behavior: 'instant' })
      if (p === 1) tween = undefined
    }
    const g = geometry, local = clamp(window.scrollY - startTop(), 0, g.distance)
    // Browsers round scroll positions to CSS pixels; accept the landing boundary.
    const targetIntro = g.introDistance && local < g.introDistance - 1 ? clamp(local / g.introDistance) : 1
    const targetPosition = clamp((local - g.introDistance) / g.stepDistance, 0, count - 1)
    const dt = last ? Math.min(now - last, 64) : 1000 / 60
    last = now
    const amount = motion.matches || drag?.active ? 1 : 1 - Math.exp(-dt / 90)
    if (!initialized) { intro = targetIntro; position = targetPosition; initialized = true }
    else { intro += (targetIntro - intro) * amount; position += (targetPosition - position) * amount }
    if (Math.abs(targetIntro - intro) < .001) intro = targetIntro
    if (Math.abs(targetPosition - position) < .001) position = targetPosition
    const strength = motion.matches ? 0 : clamp(Number.isFinite(options.strength) ? options.strength : 0)
    root.dataset.ambient = String(strength > 0)
    const active = Math.round(position)
    if (active !== index) { index = active; callbacks.index(active) }
    root.dataset.position = position.toFixed(4)
    root.dataset.introProgress = intro.toFixed(4)
    root.dataset.phase = intro < 1 ? 'entrance' : 'moments'
    root.dataset.renderCount = String(Number(root.dataset.renderCount ?? 0) + 1)
    root.style.setProperty('--signature-float', `${strength * (g.phone ? 2 : 4.2)}px`)
    track.inert = intro < 1
    track.style.transform = `translate3d(${-position * g.spacing}px,0,0)`
    let watching = false
    slots.forEach((slot, i) => {
      const landscape = g.phone && g.width > g.height * 1.35
      const anchor = landscape ? g.width * .35 : g.width / 2
      const stagger = [-10, 12, -15, 8, -5][i % 5]
      const offset = g.phone ? stagger * Math.min(1.2, g.height / 700) : stagger * Math.min(g.height / 100, g.width / 100 * .625)
      const centerY = g.phone ? (title.offsetTop + title.offsetHeight + (landscape ? 20 : 28) + g.height - (landscape ? 80 : 90)) / 2 : g.height * .52
      const top = centerY - heights[i] / 2 - (landscape ? 0 : captionHeights[i] / 2) + offset
      const centerX = anchor + (i - position) * g.spacing
      slot.style.left = `${anchor + i * g.spacing - g.cardWidth / 2}px`
      slot.style.top = `${top}px`
      slot.style.setProperty('--signature-caption-opacity', String(landscape ? clamp(1 - Math.abs(i - position) * 1.5) : 1))
      slot.style.setProperty('--signature-aside', playback === null || playback === i ? '0px' : `${(i < playback ? -1 : 1) * g.width * .15}px`)
      const v = clamp((centerX / g.width - .5) * 2, -1, 1), center = 1 - Math.abs(v)
      let hover = 0, rx = 0, ryCursor = 0, sheen = .5
      if (!g.phone && pointer.matches && pointerX >= 0 && playback === null) {
        const nx = (pointerX - centerX + g.cardWidth / 2) / g.cardWidth
        const ny = (pointerY - top) / heights[i]
        const outside = Math.hypot(nx < 0 ? -nx : nx > 1 ? nx - 1 : 0, ny < 0 ? -ny : ny > 1 ? ny - 1 : 0)
        hover = clamp(1 - outside / .6) * strength
        const influence = .35 + .65 * hover
        rx = -9 * clamp((pointerY - top - heights[i] / 2) / (g.height / 2), -1, 1) * influence * strength
        ryCursor = 13 * clamp((pointerX - centerX) / (g.width / 2), -1, 1) * influence * strength
        sheen = clamp(nx)
        if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) watching = true
      }
      const selected = playback === i
      slot.style.setProperty('--signature-hover', String(selected ? 0 : hover))
      slot.style.setProperty('--signature-sheen', String(sheen))
      slot.style.setProperty('--signature-rx', `${selected ? 0 : rx}deg`)
      slot.style.setProperty('--signature-ry', `${selected ? 0 : strength * v * (g.phone ? 8 : 20 + i % 3 * 6) + ryCursor}deg`)
      slot.style.setProperty('--signature-rz', `${selected ? 0 : strength * (3.5 * v + 2.4 * (i % 2 ? -1 : 1) * center) * (g.phone ? .5 : 1)}deg`)
      slot.style.setProperty('--signature-depth', `${selected ? 0 : (34 * center + 46 * hover) * strength * (g.phone ? .3 : 1)}px`)
      slot.style.setProperty('--signature-scale', String(selected ? 1 : 1 + ((.94 + .1 * center) * (1 + .05 * hover) - 1) * strength))
      slot.dataset.flight = String(i === 0 && intro < 1 && options.entrance)
    })
    yards.style.transform = `translate3d(${-(g.width * .32 * intro + position * g.spacing * .45)}px,0,0)`
    if (cover) {
      const wipe = clamp(intro * 1.15)
      cover.style.clipPath = `polygon(0 0,100% 0,100% ${Math.max(0, 1 - wipe * 1.65) * 100}%,0 ${Math.max(0, 1 - wipe) * 100}%)`
      cover.style.visibility = intro >= 1 ? 'hidden' : 'visible'
      cover.style.setProperty('--signature-intro-copy', String(clamp(1 - intro * 2)))
    }
    if (flight && origin && slots[0]) {
      const inFlight = intro > 0 && intro < 1
      origin.style.visibility = intro > 0 ? 'hidden' : 'visible'
      flight.style.visibility = inFlight ? 'visible' : 'hidden'
      const from = rect(origin), to = rect(slots[0].querySelector<HTMLElement>('.signature-card')!)
      const p = ease(clamp(intro / .98))
      flight.style.left = `${lerp(from.x + from.width / 2, to.x + to.width / 2, p)}px`
      flight.style.top = `${lerp(from.y + from.height / 2, to.y + to.height / 2, p) - Math.sin(p * Math.PI) * g.height * (g.phone ? .04 : .08)}px`
      flight.style.width = `${lerp(from.width, to.width, p)}px`
      flight.style.height = `${lerp(from.height, to.height, p)}px`
      flight.style.setProperty('--signature-spin', `${motion.matches ? 0 : 360 * p}deg`)
      flight.style.setProperty('--signature-flight-roll', `${motion.matches ? 0 : Math.sin(p * Math.PI) * (g.phone ? -5 : -12)}deg`)
    }
    cursor.style.left = `${pointerX}px`; cursor.style.top = `${pointerY}px`
    root.dataset.watch = String(strength > 0 && watching && !g.phone && intro === 1 && playback === null)
    if (focusAfter !== null && Math.abs(position - focusAfter) < .01 && intro === 1) {
      slots[focusAfter]?.querySelector<HTMLElement>('.signature-card')?.focus({ preventScroll: true })
      focusAfter = null
    }
    const moving = !!tween || intro !== targetIntro || position !== targetPosition
    root.dataset.motion = moving ? 'moving' : 'resting'
    if (moving) schedule()
    else last = 0
  }
  const jump = (next: number, smooth = true, focus = false) => {
    if (!geometry) return
    const selected = clamp(Math.round(next), 0, count - 1)
    const to = startTop() + geometry.introDistance + selected * geometry.stepDistance
    if (focus) focusAfter = selected
    if (smooth && !motion.matches) tween = { from: window.scrollY, to, start: performance.now(), duration: 550 }
    else { tween = undefined; window.scrollTo({ top: to, behavior: 'instant' }) }
    schedule()
  }
  const endDrag = (cancelled = false) => {
    if (!drag) return
    const completed = drag
    drag = undefined
    if (pin.hasPointerCapture(completed.id)) pin.releasePointerCapture(completed.id)
    if (completed.active) {
      suppressUntil = performance.now() + 250
      if (!cancelled && geometry && Math.abs(completed.velocity) > .05 && !motion.matches) {
        const g = geometry, to = clamp(window.scrollY + clamp(completed.velocity * 180, -g.stepDistance * .65, g.stepDistance * .65), startTop() + g.introDistance, startTop() + g.introDistance + (count - 1) * g.stepDistance)
        tween = { from: window.scrollY, to, start: performance.now(), duration: 420 }
        schedule()
      }
    }
    root.dataset.dragging = 'false'
  }
  const down = (event: PointerEvent) => {
    if (!geometry || playback !== null || intro < .98 || !event.isPrimary || event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('input,video,a,summary,[data-signature-navigation]') || target.closest('button') && !target.closest('.signature-card')) return
    tween = undefined
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: window.scrollY, previous: window.scrollY, time: performance.now(), velocity: 0, active: false }
  }
  const move = (event: PointerEvent) => {
    const bounds = pin.getBoundingClientRect()
    if (event.pointerType === 'mouse') { pointerX = event.clientX - bounds.left; pointerY = event.clientY - bounds.top; schedule() }
    if (!drag || drag.id !== event.pointerId || !geometry) return
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    if (!drag.active) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { endDrag(true); return }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      drag.active = true; pin.setPointerCapture(event.pointerId); root.dataset.dragging = 'true'
    }
    event.preventDefault()
    const g = geometry, to = clamp(drag.scroll - dx * g.stepDistance / g.spacing, startTop() + g.introDistance, startTop() + g.introDistance + (count - 1) * g.stepDistance)
    const now = performance.now()
    drag.velocity = (to - drag.previous) / Math.max(1, now - drag.time)
    drag.previous = to; drag.time = now
    window.scrollTo({ top: to, behavior: 'instant' }); schedule()
  }
  const leave = () => { pointerX = pointerY = -1; schedule() }
  const key = (event: KeyboardEvent) => {
    if (playback !== null || (event.target as HTMLElement).closest('input,video,textarea')) return
    const next = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null
    if (next !== null) { event.preventDefault(); jump(next, true, true) }
  }
  const click = (event: MouseEvent) => { if (performance.now() < suppressUntil) { event.preventDefault(); event.stopPropagation() } }
  const scroll = () => schedule()
  const wheel = (event: WheelEvent) => {
    tween = undefined
    if (geometry && playback === null && intro === 1 && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault()
      window.scrollTo({ top: window.scrollY + event.deltaX * geometry.stepDistance / geometry.spacing, behavior: 'instant' })
    }
    schedule()
  }
  const visibility = () => {
    root.dataset.active = String(visible && !document.hidden)
    if (document.hidden) { stop(); endDrag(true) } else schedule()
  }
  const up = () => endDrag()
  const cancel = () => endDrag(true)
  // Touch implicitly captures the card button. Transferring capture to the
  // surface emits a bubbled lostpointercapture for that button, not our drag.
  const lostCapture = (event: PointerEvent) => { if (event.target === pin) endDrag(true) }
  const preference = () => { root.dataset.reducedMotion = String(motion.matches); if (motion.matches) { tween = undefined; pointerX = pointerY = -1 }; measure() }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .01
    root.dataset.active = String(visible && !document.hidden)
    if (!visible) { stop(); endDrag(true); callbacks.invisible() } else schedule()
  }, { threshold: .01 })
  const resize = new ResizeObserver(measure)
  observer.observe(pin); resize.observe(pin)
  window.addEventListener('scroll', scroll, { passive: true })
  window.addEventListener('resize', measure)
  window.addEventListener('blur', cancel)
  document.addEventListener('visibilitychange', visibility)
  document.fonts.addEventListener('loadingdone', measure)
  motion.addEventListener('change', preference); pointer.addEventListener('change', measure)
  pin.addEventListener('pointerdown', down)
  pin.addEventListener('pointermove', move)
  pin.addEventListener('pointerleave', leave)
  pin.addEventListener('pointerup', up)
  pin.addEventListener('pointercancel', cancel)
  pin.addEventListener('lostpointercapture', lostCapture)
  pin.addEventListener('click', click, true)
  pin.addEventListener('keydown', key)
  pin.addEventListener('wheel', wheel, { passive: false })
  measure()
  root.dataset.ready = 'false'
  const first = root.querySelector<HTMLImageElement>('.signature-card img')
  void Promise.allSettled([document.fonts.load('700 80px "Signature Barlow"'), first?.decode()]).then(() => {
    if (disposed || ready) return
    ready = true; root.dataset.ready = 'true'; measure(); callbacks.ready()
  })
  return {
    jump,
    getRect(i: number) { const element = slots[i]?.querySelector<HTMLElement>('.signature-card-plane'); return element ? rect(element) : undefined },
    setPlayback(i: number | null) { playback = i; tween = undefined; endDrag(true); schedule() },
    update(next: Options) { options = next; root.dataset.reducedMotion = String(motion.matches); measure() },
    dispose() {
      disposed = true; stop(); endDrag(true); observer.disconnect(); resize.disconnect()
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', measure); window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', visibility); document.fonts.removeEventListener('loadingdone', measure)
      motion.removeEventListener('change', preference); pointer.removeEventListener('change', measure)
      pin.removeEventListener('pointerdown', down); pin.removeEventListener('pointermove', move); pin.removeEventListener('pointerleave', leave)
      pin.removeEventListener('pointerup', up); pin.removeEventListener('pointercancel', cancel); pin.removeEventListener('lostpointercapture', lostCapture)
      pin.removeEventListener('click', click, true); pin.removeEventListener('keydown', key); pin.removeEventListener('wheel', wheel)
    },
  }
}
