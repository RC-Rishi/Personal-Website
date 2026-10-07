import { useEffect, useState } from 'react'

export type LoadingScenario = 'actual' | 'slow' | 'failure'
const images = ['/assets/leather-background/leather.webp', '/assets/leather-background/dark-light.webp', '/assets/sharingan-preloader/paper.webp']

function imageReady(src: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    const dispose = () => { clearTimeout(timeout); signal.removeEventListener('abort', abort); image.onload = image.onerror = null }
    const abort = () => { dispose(); image.src = ''; reject(new DOMException('Cancelled', 'AbortError')) }
    const timeout = setTimeout(() => { dispose(); reject(new Error('Image timeout')) }, 8000)
    signal.addEventListener('abort', abort, { once: true })
    image.onerror = () => { dispose(); reject(new Error('Image unavailable')) }
    image.onload = () => { void image.decode().then(() => { dispose(); resolve() }, () => { dispose(); reject(new Error('Image decode failed')) }) }
    if (signal.aborted) { abort(); return }
    image.src = src
  })
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}

/** Demo-only asset coordinator. Real hosts supply their own readiness signals. */
export function useDestinationReadiness(scenario: LoadingScenario) {
  const [state, setState] = useState({ progress: 0, ready: false, fallback: false })
  useEffect(() => {
    const abort = new AbortController(), { signal } = abort
    let settled = 0
    const settle = (failed: boolean) => {
      if (signal.aborted) return
      settled++
      setState(previous => ({ ...previous, progress: settled / 5, fallback: previous.fallback || failed }))
    }
    const tasks = images.map((src, i) => (async () => {
      if (scenario === 'slow') await delay((i + 1) * 1700, signal)
      if (scenario === 'failure' && i === 0) throw new Error('Simulated asset failure')
      await imageReady(src, signal)
    })())
    tasks.push((async () => {
      // Font readiness is real; its bounded fallback is the system serif.
      await Promise.race([document.fonts.ready, delay(8000, signal)])
    })())
    void Promise.all(tasks.map(task => task.then(() => settle(false), () => settle(true)))).then(() => {
      if (signal.aborted) return
      // Wait for the destination's resolved/fallback React commit and browser layout.
      let first = 0, second = 0
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => {
          if (signal.aborted) return
          settle(false)
          setState(previous => ({ ...previous, ready: true }))
        })
      })
      signal.addEventListener('abort', () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }, { once: true })
    })
    return () => abort.abort()
  }, [scenario])
  return state
}
