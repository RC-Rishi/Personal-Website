import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SharinganPreloader, { type PreloaderPacing } from '../../src/components/sharingan-preloader/SharinganPreloader'

function Fixture() {
  const [progress, setProgress] = useState(0), [ready, setReady] = useState(false), [exits, setExits] = useState(0)
  const [pacing, setPacing] = useState<PreloaderPacing>('compact')
  return <>
    <div style={{ position: 'relative', height: '100svh' }}><SharinganPreloader progress={progress} ready={ready} pacing={pacing} onExit={() => setExits(value => value + 1)} /></div>
    <div style={{ position: 'fixed', zIndex: 99, top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      <button onClick={() => setProgress(.8)}>80 percent</button><button onClick={() => setProgress(.3)}>30 percent</button>
      <button onClick={() => setProgress(1)}>100 percent</button><button onClick={() => setReady(true)}>Confirm ready</button>
      <button onClick={() => setPacing(pacing === 'compact' ? 'cinematic' : 'compact')}>Change pacing</button>
      <output aria-label="Exit calls">{exits}</output>
    </div>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>)
