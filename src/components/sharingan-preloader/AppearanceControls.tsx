import { useState } from 'react'

import { originalAppearance, type PreloaderAppearance } from './appearance'

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState<string>()
  const valid = draft === undefined || /^#[\da-f]{6}$/i.test(draft)
  return <div className="preloader-color-field">
    <span>{label}</span><div>
      <input aria-label={`${label} color`} type="color" value={value} onChange={e => { setDraft(undefined); onChange(e.target.value) }} />
      <input aria-label={`${label} hex`} type="text" value={draft ?? value} spellCheck={false} maxLength={7}
        aria-invalid={!valid} onChange={e => {
          const next = e.target.value
          setDraft(next)
          if (/^#[\da-f]{6}$/i.test(next)) onChange(next.toLowerCase())
        }} onBlur={() => setDraft(undefined)} />
    </div>
  </div>
}

export default function AppearanceControls({ value, onChange }: { value: PreloaderAppearance; onChange: (value: PreloaderAppearance) => void }) {
  return <fieldset className="preloader-appearance">
    <legend>Paper & ink</legend>
    <ColorField label="Paper" value={value.paperColor} onChange={paperColor => onChange({ ...value, paperColor })} />
    <ColorField label="Ink" value={value.inkColor} onChange={inkColor => onChange({ ...value, inkColor })} />
    <label className="preloader-matte">Matte strength <output>{Math.round(value.matteStrength * 100)}%</output>
      <input aria-label="Matte strength" type="range" min="0" max="100" step="1" value={Math.round(value.matteStrength * 100)}
        onChange={e => onChange({ ...value, matteStrength: Number(e.target.value) / 100 })} />
    </label>
    <button type="button" onClick={() => onChange({ ...originalAppearance })}>Reset appearance</button>
  </fieldset>
}
