export type TiltStatus = 'off' | 'requesting' | 'waiting' | 'active' | 'paused' | 'denied' | 'unavailable'
export type TiltVector = { x: number; y: number }
export type TiltOptions = { enabled: boolean; visible: boolean; reduced: boolean; strength: number }
type OrientationConstructor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }
type GravityVector = { x: number; y: number; z: number }

/** Earth-down transformed into the device/screen frame (W3C Z-X-Y model).
 * Unlike subtracting Euler angles, this stays continuous when beta crosses
 * upright, gamma changes representation, or the phone is held upside down.
 * Alpha is world yaw and cannot change gravity, so compass drift is ignored.
 */
export function screenGravity(beta: number, gamma: number, screenAngle: number): GravityVector {
  const b = beta * Math.PI / 180, g = gamma * Math.PI / 180, a = screenAngle * Math.PI / 180
  const x = Math.cos(b) * Math.sin(g), y = -Math.sin(b)
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a), z: -Math.cos(b) * Math.cos(g) }
}

/** Sensor controller stays independent of React and never requests access on mount. */
export function createDeviceTilt(host: HTMLElement, vector: TiltVector, notify: (status: TiltStatus) => void) {
  let options: TiltOptions = { enabled: false, visible: false, reduced: false, strength: .35 }
  let requested = false, listening = false, disposed = false, requestVersion = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let status: TiltStatus = 'off'
  let latest: GravityVector | undefined, neutral: GravityVector | undefined
  const publish = (next: TiltStatus) => { if (!disposed && status !== next) { status = next; notify(next) } }
  const change = (x: number, y: number) => {
    if (Math.abs(vector.x - x) < .0005 && Math.abs(vector.y - y) < .0005) return
    vector.x = x; vector.y = y
    host.dispatchEvent(new Event('lanyard-tilt'))
  }
  const calibrate = () => { neutral = latest && { ...latest }; change(0, 0) }
  // A gravity-space dead zone filters small hand tremors without snapping at
  // Euler-angle boundaries. Each axis remains bounded at every holding angle.
  const normalize = (value: number, range: number) => Math.sign(value) * Math.min(1, Math.max(0, Math.abs(value) - .012) / range)
  const apply = () => {
    if (!latest || !neutral) return
    const strength = Number.isFinite(options.strength) ? Math.min(1, Math.max(0, options.strength)) : 0
    change(normalize(latest.x - neutral.x, .3) * strength * .45,
      normalize(latest.z - neutral.z, .4) * strength * .3)
  }
  const sample = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return
    latest = screenGravity(event.beta, event.gamma, screen.orientation?.angle ?? window.orientation ?? 0)
    if (!neutral) calibrate()
    clearTimeout(timer)
    publish('active')
    apply()
  }
  const rotate = () => { latest = undefined; neutral = undefined; change(0, 0) }
  const stop = () => {
    clearTimeout(timer)
    window.removeEventListener('deviceorientation', sample)
    window.removeEventListener('orientationchange', rotate)
    screen.orientation?.removeEventListener('change', rotate)
    listening = false; latest = undefined; neutral = undefined; change(0, 0)
  }
  const synchronize = () => {
    if (!requested || !options.enabled) return
    if (!options.visible || options.reduced || document.hidden) { stop(); publish('paused'); return }
    if (listening) { apply(); return }
    listening = true
    publish('waiting')
    window.addEventListener('deviceorientation', sample, { passive: true })
    window.addEventListener('orientationchange', rotate)
    screen.orientation?.addEventListener('change', rotate)
    timer = setTimeout(() => { stop(); requested = false; publish('unavailable') }, 4000)
  }
  return {
    setOptions(next: TiltOptions) {
      options = next
      if (!next.enabled) { requestVersion++; requested = false; stop(); publish('off') }
      else synchronize()
    },
    async enable() {
      if (disposed || !options.enabled || status === 'requesting') return
      const version = ++requestVersion
      stop(); requested = false
      const orientation = window.DeviceOrientationEvent as OrientationConstructor | undefined
      if (!window.isSecureContext || !orientation) { publish('unavailable'); return }
      publish('requesting')
      try {
        // Call directly inside the user's button gesture, before any other await.
        const permission = orientation.requestPermission ? await orientation.requestPermission() : 'granted'
        if (disposed || version !== requestVersion) return
        if (permission !== 'granted') { publish('denied'); return }
        requested = true; synchronize()
      } catch { if (!disposed && version === requestVersion) publish('denied') }
    },
    disable() { requestVersion++; requested = false; stop(); publish('off') },
    calibrate,
    dispose() { disposed = true; requestVersion++; requested = false; stop() },
  }
}
