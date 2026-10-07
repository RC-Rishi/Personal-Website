import { useId, useState } from 'react'
import { leatherPresets, normalizeHex, type LeatherPalette } from './palettes'

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && !normalizeHex(draft)
  return <div className="leather-palette__field">
    <label htmlFor={`${id}-hex`}>{label}</label>
    <div className="leather-palette__input-pair">
      <input type="color" aria-label={`${label} color`} value={value} onChange={event => { setDraft(null); onChange(event.target.value.toUpperCase()) }} />
      <input id={`${id}-hex`} type="text" aria-label={`${label} hex`} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} value={draft ?? value} spellCheck={false} autoComplete="off" maxLength={7}
        onChange={event => { setDraft(event.target.value); const hex = normalizeHex(event.target.value); if (hex) onChange(hex) }}
        onBlur={() => setDraft(null)} onKeyDown={event => { if (event.key === 'Enter' && normalizeHex(draft ?? value)) setDraft(null); if (event.key === 'Escape') setDraft(null) }} />
    </div>
    {invalid && <small id={`${id}-error`} className="leather-palette__error">Use 3 or 6 hex digits.</small>}
  </div>
}

type PaletteControlsProps = {
  id: string
  palette: LeatherPalette
  name: string
  presetIndex: number
  onPreset: (index: number) => void
  onCustom: (palette: LeatherPalette) => void
}

export default function PaletteControls({ id, palette, name, presetIndex, onPreset, onCustom }: PaletteControlsProps) {
  return <section id={id} className="leather-palette" aria-label="Leather colors">
    <div className="leather-palette__heading"><div><span className="leather-palette__eyebrow">PALETTE EXPLORER</span><output aria-live="polite">{name}</output></div><div className="leather-palette__swatches" aria-label="Current palette"><span style={{ backgroundColor: palette.pebble }} /><span style={{ backgroundColor: palette.crevice }} /></div></div>
    <label className="leather-palette__slider-label" htmlFor={`${id}-slider`}>Preset palette <span>{presetIndex + 1} / {leatherPresets.length}</span></label>
    <input id={`${id}-slider`} className="leather-palette__slider" type="range" min="0" max={leatherPresets.length - 1} step="1" value={presetIndex}
      aria-valuetext={name === 'Custom' ? `Custom colors; slider at ${leatherPresets[presetIndex].name}` : name} onChange={event => onPreset(Number(event.target.value))} />
    <div className="leather-palette__stops" aria-label="Palette presets">{leatherPresets.map((preset, index) => <button type="button" key={preset.name} aria-pressed={name === preset.name} onClick={() => onPreset(index)}>{preset.name}</button>)}</div>
    <div className="leather-palette__fields">
      <ColorField label="Pebbles" value={palette.pebble} onChange={pebble => onCustom({ ...palette, pebble })} />
      <ColorField label="Crevices / edges" value={palette.crevice} onChange={crevice => onCustom({ ...palette, crevice })} />
    </div>
    <div className="leather-palette__footer"><span>{name === 'Original' ? 'Reference finish · swatches are starting tones' : 'Custom tones · original grain and lighting'}</span><button type="button" onClick={() => onPreset(0)}>Reset to original</button></div>
  </section>
}
