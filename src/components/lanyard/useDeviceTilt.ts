import { useEffect, useRef, useState, type RefObject } from 'react'
import { createDeviceTilt, type TiltOptions, type TiltStatus } from './deviceTilt'

export function useDeviceTilt(host: RefObject<HTMLDivElement | null>, options: TiltOptions, onStatusChange?: (status: TiltStatus) => void) {
  const vector = useRef({ x: 0, y: 0 })
  const controller = useRef<ReturnType<typeof createDeviceTilt> | undefined>(undefined)
  const [status, setStatus] = useState<TiltStatus>('off')
  useEffect(() => {
    const engine = createDeviceTilt(host.current!, vector.current, setStatus)
    controller.current = engine
    return () => { engine.dispose(); controller.current = undefined }
  }, [host])
  const { enabled, visible, reduced, strength } = options
  useEffect(() => { controller.current?.setOptions({ enabled, visible, reduced, strength }) }, [enabled, visible, reduced, strength])
  useEffect(() => { onStatusChange?.(status) }, [status, onStatusChange])
  return { vector, controller, status }
}
