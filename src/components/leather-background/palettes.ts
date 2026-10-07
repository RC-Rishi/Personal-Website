export type LeatherPalette = { pebble: string; crevice: string }

export const leatherPresets: { name: string; palette?: LeatherPalette }[] = [
  { name: 'Original' },
  { name: 'Cognac', palette: { pebble: '#754328', crevice: '#D4A579' } },
  { name: 'Oxblood', palette: { pebble: '#4D1F2B', crevice: '#B97880' } },
  { name: 'Forest', palette: { pebble: '#183E32', crevice: '#82AA8D' } },
  { name: 'Navy', palette: { pebble: '#172C4A', crevice: '#829AB8' } },
  { name: 'Graphite', palette: { pebble: '#292B30', crevice: '#92969F' } },
]

export function normalizeHex(value: string): string | undefined {
  const hex = value.trim().replace(/^#/, '')
  if (/^[\da-f]{6}$/i.test(hex)) return `#${hex.toUpperCase()}`
  if (/^[\da-f]{3}$/i.test(hex)) return `#${[...hex].map(c => c + c).join('').toUpperCase()}`
  return undefined
}

export function hexChannels(hex: string) {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
}

export function paletteTextColor(palette: LeatherPalette): string {
  const a = hexChannels(palette.pebble), b = hexChannels(palette.crevice)
  const luminance = a.map((channel, i) => channel * 0.75 + b[i] * 0.25)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
  return luminance > 0.179 ? '#171220' : '#F4EFE6'
}
