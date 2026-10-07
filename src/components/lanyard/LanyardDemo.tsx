import { useEffect, useRef, useState } from 'react'
import Lanyard, { type LanyardHandle, type TiltStatus } from './Lanyard'

const tiltMessages: Record<TiltStatus, string> = {
  off: 'Optional · use your phone’s tilt to move the card.',
  requesting: 'Requesting sensor access…',
  waiting: 'Hold your phone comfortably. The first reading sets neutral.',
  active: 'Tilt is on. Calibrate to make this position neutral.',
  paused: 'Tilt paused while offscreen or reduced motion is enabled.',
  denied: 'Sensor access was declined. You can retry or keep dragging.',
  unavailable: 'No sensor readings. Use a supported phone over HTTPS or localhost.',
}

export default function LanyardDemo() {
  const lanyard = useRef<LanyardHandle>(null)
  const [cardColor, setCardColor] = useState('#0a0a0a')
  const [clipColor, setClipColor] = useState('#474747')
  const [strapColor, setStrapColor] = useState('#0f0f0f')
  const [printed, setPrinted] = useState(true)
  const [gravity, setGravity] = useState(60)
  const [front, setFront] = useState<string>()
  const [back, setBack] = useState<string>()
  const [tiltStatus, setTiltStatus] = useState<TiltStatus>('off')
  const [tiltStrength, setTiltStrength] = useState(.35)
  const tiltEnabled = ['requesting', 'waiting', 'active', 'paused'].includes(tiltStatus)
  useEffect(() => () => { if (front) URL.revokeObjectURL(front) }, [front])
  useEffect(() => () => { if (back) URL.revokeObjectURL(back) }, [back])
  return <main className="lanyard-demo">
    <header className="lanyard-demo-header">
      <div><span className="lanyard-eyebrow">COLLECTION / 002</span><h1>On the line.</h1><p>A little weight. A little play.</p></div>
      <div className="lanyard-demo-actions">
        <button onClick={() => lanyard.current?.reset()}>Reset position <span aria-hidden="true">↺</span></button>
        <details className="lanyard-settings"><summary>Customize <span aria-hidden="true">+</span></summary>
          <div className="lanyard-settings-panel">
            <p className="lanyard-settings-title">Make it yours</p>
            <label>Card / back<input aria-label="Card color" type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} /></label>
            <label>Metal clip<input aria-label="Clip color" type="color" value={clipColor} onChange={e => setClipColor(e.target.value)} /></label>
            <label>Strap<input aria-label="Strap color" type="color" value={strapColor} onChange={e => { setStrapColor(e.target.value); setPrinted(false) }} /></label>
            <label className="lanyard-checkbox"><input type="checkbox" checked={printed} onChange={e => setPrinted(e.target.checked)} />Printed strap</label>
             <label className="lanyard-gravity">Gravity <output>{gravity}</output><input aria-label="Gravity" type="range" min="10" max="100" value={gravity} onChange={e => setGravity(Number(e.target.value))} /></label>
             <section className="lanyard-tilt-controls" aria-label="Device tilt">
               <p className="lanyard-settings-title">Device tilt</p>
               <div className="lanyard-tilt-buttons">
                 <button disabled={tiltStatus === 'requesting'} onClick={() => tiltEnabled ? lanyard.current?.disableTilt() : void lanyard.current?.enableTilt()}>{tiltEnabled ? 'Disable tilt' : 'Enable tilt'}</button>
                 <button disabled={tiltStatus !== 'active'} onClick={() => lanyard.current?.calibrateTilt()}>Calibrate</button>
               </div>
               <label className="lanyard-gravity">Tilt strength <output>{Math.round(tiltStrength * 100)}%</output><input aria-label="Tilt strength" type="range" min="0" max="100" value={Math.round(tiltStrength * 100)} onChange={e => setTiltStrength(Number(e.target.value) / 100)} /></label>
               <p role="status" aria-live="polite">{tiltMessages[tiltStatus]}</p>
             </section>
            <label className="lanyard-upload">Front artwork<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) setFront(URL.createObjectURL(file)) }} /></label>
            <label className="lanyard-upload">Back artwork<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) setBack(URL.createObjectURL(file)) }} /></label>
            <p>Portrait images work best. Artwork stays in this preview session.</p>
          </div>
        </details>
      </div>
    </header>
    <Lanyard ref={lanyard} frontImage={front} backImage={back} cardColor={cardColor} clipColor={clipColor}
      strapColor={strapColor} strapImage={printed ? '/assets/lanyard/strap.png' : null} gravity={gravity} cameraDistance={12}
      tilt tiltStrength={tiltStrength} onTiltStatusChange={setTiltStatus} />
    <footer className="lanyard-demo-footer"><span><span className="lanyard-dot" />GRAB. DRAG. LET GO.</span><p>Tab to the card · Arrows to swing · Space to turn</p><span>3D / LANYARD</span></footer>
  </main>
}
