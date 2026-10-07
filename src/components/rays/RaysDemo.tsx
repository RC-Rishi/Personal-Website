import { useState } from 'react'
import Rays from './Rays'

export default function RaysDemo() {
  const query = new URLSearchParams(window.location.search)
  const [colors, setColors] = useState<readonly [string, string]>(['#639aff', '#639aff'])
  const [intensity, setIntensity] = useState(13), [rays, setRays] = useState(32), [reach, setReach] = useState(16)
  const [position, setPosition] = useState(50), [speed, setSpeed] = useState(10), [animate, setAnimate] = useState(query.get('animate') !== 'false')
  const [labels, setLabels] = useState(true)
  if (query.get('view') === 'effect') return <Rays className="rays-demo" {...{ colors, intensity, rays, reach, position, speed, animate }} />
  return <Rays className="rays-demo" {...{ colors, intensity, rays, reach, position, speed, animate }}>
    <header className="rays-demo-header"><span>LIGHT STUDY / 003</span><button onClick={() => setLabels(!labels)}>{labels ? 'Hide text' : 'Show text'}</button></header>
    {labels && <main className="rays-demo-caption"><p>A LITTLE ATMOSPHERE</p><h1>Let the <em>light in.</em></h1><span>Soft beams. Slow movement. A different feeling.</span></main>}
    <details className="rays-controls"><summary>Shape the light <span>+</span></summary><div>
      <label>First color<input type="color" value={colors[0]} onChange={e => setColors([e.target.value, colors[1]])} /></label>
      <label>Second color<input type="color" value={colors[1]} onChange={e => setColors([colors[0], e.target.value])} /></label>
      {([['Intensity', intensity, setIntensity], ['Rays', rays, setRays], ['Reach', reach, setReach], ['Position', position, setPosition], ['Speed', speed, setSpeed]] as const).map(([name, value, setter]) => <label className="rays-range" key={name}>{name}<output>{value}</output><input aria-label={name} type="range" min="0" max="100" value={value} onChange={e => setter(Number(e.target.value))} /></label>)}
      <label>Animate<input type="checkbox" checked={animate} onChange={e => setAnimate(e.target.checked)} /></label>
      <button onClick={() => { setColors(['#639aff', '#639aff']); setIntensity(13); setRays(32); setReach(16); setPosition(50); setSpeed(10); setAnimate(true) }}>Live reference preset</button>
      <button onClick={() => { setColors(['#ffffff', '#ffffff']); setIntensity(50); setRays(30); setReach(40); setPosition(80); setSpeed(10); setAnimate(true) }}>Source defaults</button>
    </div></details>
    <footer className="rays-demo-footer">LIVE LIGHT / LOCAL SHADER<span>Respecting your motion preference</span></footer>
  </Rays>
}
