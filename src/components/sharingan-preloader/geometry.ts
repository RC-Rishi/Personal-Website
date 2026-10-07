// Hand-authored cubic outlines based on the user's two sketches. Both use the
// same command topology so interpolation preserves one continuous ink shape.
const comma = [42, -116, 9, -145, -32, -126, -32, -91, -32, -72, -20, -61, -4, -63, 20, -68, 15, -91, 4, -95, 9, -113, 26, -124, 42, -116]
const awakened = [39, -137, -12, -147, -90, -113, -93, -44, -98, 17, -49, 56, -1, 35, -39, 27, -68, -15, -49, -67, -36, -103, 1, -130, 39, -137]
export const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
export const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p) }
export const out = (value: number) => 1 - Math.pow(1 - clamp(value), 3)

export function inkPath(morph: number) {
  const p = clamp(morph)
  const v = comma.map((value, i) => (value + (awakened[i] - value) * p).toFixed(3))
  return `M ${v.slice(0, 2).join(' ')} C ${v.slice(2, 8).join(' ')} C ${v.slice(8, 14).join(' ')} C ${v.slice(14, 20).join(' ')} C ${v.slice(20, 26).join(' ')} Z`
}

// Split ink tips based on the awakened reference. Inner tips stay near the
// pupil; the outer curves extend beyond the viewport.
export const tempestBlade = 'M 240 -560 C -110 -600 -470 -240 -355 10 C -290 160 -145 185 -14 44 C -162 142 -266 -4 -213 -162 C -135 -400 39 -531 240 -560 Z'
export const tempestSplinter = 'M -110 -270 C -220 -154 -254 12 -111 89 C -257 38 -253 -133 -110 -270 Z'
export const tempestFilament = 'M 110 -560 C -142 -533 -335 -288 -311 -151 C -324 -340 -103 -523 110 -560 Z'
