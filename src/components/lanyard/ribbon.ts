import { CatmullRomCurve3, Vector3 } from 'three'
import { MeshLineGeometry } from 'meshline'

/** Bend-limited ribbon sampling adapted from the supplied Framer component. */
export function createRibbon() {
  const count = 33
  const curve = new CatmullRomCurve3(Array.from({ length: 4 }, () => new Vector3()), false, 'chordal')
  const points = new Float32Array(count * 3), swap = new Float32Array(count * 3)
  const point = new Vector3()
  const geometry = new MeshLineGeometry()
  geometry.setPoints(points)
  return { curve, geometry, update() {
    curve.updateArcLengths()
    for (let i = 0; i < count; i++) { curve.getPointAt(i / (count - 1), point); point.toArray(points, i * 3) }
    let from = points, to = swap
    for (let pass = 0; pass < 28; pass++) {
      to.set(from.subarray(0, 3), 0); to.set(from.subarray((count - 1) * 3), (count - 1) * 3)
      let moved = false
      for (let i = 1; i < count - 1; i++) {
        const c = i * 3
        const ax = from[c] - from[c - 3], ay = from[c + 1] - from[c - 2], az = from[c + 2] - from[c - 1]
        const bx = from[c + 3] - from[c], by = from[c + 4] - from[c + 1], bz = from[c + 5] - from[c + 2]
        const length = Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz)
        const bend = length > 1e-6 ? Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by + az * bz) / length))) : 0
        const weight = Math.min(1, Math.max(0, (bend - .42) / (1.35 - .42)))
        if (weight > 0) moved = true
        for (let axis = 0; axis < 3; axis++) to[c + axis] = from[c + axis] + ((from[c - 3 + axis] + from[c + 3 + axis]) * .5 - from[c + axis]) * weight * .6
      }
      const temp = from; from = to; to = temp
      if (!moved) break
    }
    if (from !== points) points.set(from)
    const span = Math.max(1, Math.round(.32 / Math.max(curve.getLength(), .001) * (count - 1)))
    const position = geometry.getAttribute('position'), previous = geometry.getAttribute('previous'), next = geometry.getAttribute('next')
    for (let i = 0; i < count; i++) {
      for (let side = 0; side < 2; side++) {
        const o = i * 2 + side, p = Math.max(0, i - span) * 3, n = Math.min(count - 1, i + span) * 3
        position.setXYZ(o, points[i * 3], points[i * 3 + 1], points[i * 3 + 2])
        previous.setXYZ(o, points[p], points[p + 1], points[p + 2])
        next.setXYZ(o, points[n], points[n + 1], points[n + 2])
      }
    }
    position.needsUpdate = previous.needsUpdate = next.needsUpdate = true
  } }
}
