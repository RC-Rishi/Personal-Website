import { useId, useState } from 'react'
import LeatherBackground, { type LeatherFinish } from './LeatherBackground'
import PaletteControls from './PaletteControls'
import { leatherPresets, paletteTextColor, type LeatherPalette } from './palettes'
import './leather-demo.css'

export default function LeatherBackgroundDemo() {
  const query = new URLSearchParams(window.location.search)
  const [finish, setFinish] = useState<LeatherFinish>(query.get('finish') === 'dark' ? 'dark' : 'cream')
  const [showLabels, setShowLabels] = useState(true)
  const [colorsOpen, setColorsOpen] = useState(false)
  const [presetIndex, setPresetIndex] = useState(0)
  const [customPalette, setCustomPalette] = useState<LeatherPalette>()
  const panelId = useId()
  const palette = customPalette ?? leatherPresets[presetIndex].palette
  const paletteName = customPalette ? 'Custom' : leatherPresets[presetIndex].name
  const swatches = palette ?? (finish === 'cream' ? { pebble: '#D3C8BA', crevice: '#FFFFFF' } : { pebble: '#171220', crevice: '#71628B' })
  const selectPreset = (index: number) => { setPresetIndex(index); setCustomPalette(undefined) }
  const textureOnly = query.get('view') === 'texture'

  return (
    <LeatherBackground finish={finish} palette={palette} className="leather-demo" style={palette ? { color: paletteTextColor(palette) } : undefined}>
      {!textureOnly && <div className="leather-demo__layout" data-colors-open={colorsOpen}>
        {showLabels && <>
          <header className="leather-demo__header"><span>MATERIAL / 001</span><span>THE LEATHER STUDY</span></header>
          <main className="leather-demo__caption">
            <p>{finish === 'cream' ? '01 — PEBBLED CREAM' : '02 — INK LEATHER'}</p>
            <h1>A little<br /><em>more feeling.</em></h1>
            <span>{finish === 'cream' ? 'Soft light. A tactile surface.' : 'Deep grain. Light that moves with you.'}</span>
          </main>
        </>}
        <div className="leather-demo__dock">
          {colorsOpen && <PaletteControls id={panelId} palette={swatches} name={paletteName} presetIndex={presetIndex} onPreset={selectPreset} onCustom={setCustomPalette} />}
          <div className="leather-demo__controls">
          <div role="group" aria-label="Leather finish">
            <button type="button" aria-pressed={finish === 'cream'} onClick={() => setFinish('cream')}><span className="leather-demo__swatch leather-demo__swatch--cream" />Cream</button>
            <button type="button" aria-pressed={finish === 'dark'} onClick={() => setFinish('dark')}><span className="leather-demo__swatch leather-demo__swatch--dark" />Dark</button>
          </div>
          <button type="button" aria-expanded={colorsOpen} aria-controls={panelId} onClick={() => setColorsOpen(!colorsOpen)}>Colors</button>
          <button type="button" aria-pressed={!showLabels} onClick={() => setShowLabels(!showLabels)}>{showLabels ? 'Hide labels' : 'Show labels'}</button>
          </div>
        </div>
      </div>}
    </LeatherBackground>
  )
}
