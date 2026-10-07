import { useEffect, useRef, useState } from 'react'
import LeatherBackground from '../leather-background/LeatherBackground'
import SharinganPreloader, { type PreloaderPacing } from './SharinganPreloader'
import { useDestinationReadiness, type LoadingScenario } from './useDestinationReadiness'
import AppearanceControls from './AppearanceControls'
import { originalAppearance, type PreloaderAppearance } from './appearance'
import './preloader-demo.css'

function Preview({ pacing, scenario, appearance }: { pacing: PreloaderPacing; scenario: LoadingScenario; appearance: PreloaderAppearance }) {
  const [entered, setEntered] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const readiness = useDestinationReadiness(scenario)
  useEffect(() => { if (entered) heading.current?.focus({ preventScroll: true }) }, [entered])
  return <>
    <div className="preloader-destination" inert={!entered} aria-hidden={!entered} data-entered={entered} data-fallback={readiness.fallback}>
      <LeatherBackground finish="dark" interactive={entered} className="preloader-landing">
        <header><span>THE OTHER SIDE</span><span>A PLACE TO BEGIN</span></header>
        <main>
          <span className="preloader-landing-kicker">YOU’RE HERE.</span>
          <h1 ref={heading} tabIndex={-1}>Something<br /><em>worth the wait.</em></h1>
          <p>This is the first screen, prepared before you arrive.<br />Your personal website will take its place.</p>
          <a href="/">Explore the collection <span aria-hidden="true">↗</span></a>
          {readiness.fallback && <p className="preloader-fallback-note" role="status">A simplified background is ready. You can continue exploring.</p>}
        </main>
        <footer><span>TEXTURE / LIGHT / MOVEMENT</span><span>ENTRY STUDY — 005</span></footer>
      </LeatherBackground>
    </div>
    {!entered && <SharinganPreloader {...appearance} pacing={pacing} progress={readiness.progress} ready={readiness.ready} onExit={() => setEntered(true)} />}
  </>
}

export default function SharinganPreloaderDemo() {
  const query = new URLSearchParams(location.search)
  const [pacing, setPacing] = useState<PreloaderPacing>(query.get('pacing') === 'cinematic' ? 'cinematic' : 'compact')
  const [scenario, setScenario] = useState<LoadingScenario>(query.get('load') === 'slow' ? 'slow' : query.get('load') === 'failure' ? 'failure' : 'actual')
  const [run, setRun] = useState(0)
  const [appearance, setAppearance] = useState<PreloaderAppearance>(originalAppearance)
  return <div className="preloader-demo">
    <div className="preloader-lab-controls">
      <span className="preloader-lab-label">ENTRY STUDY / 005</span>
      <div>
        <button type="button" onClick={() => setRun(run + 1)}>Replay <span aria-hidden="true">↻</span></button>
        <details><summary>Preview settings <span aria-hidden="true">+</span></summary><div className="preloader-settings-panel">
          <label>Pacing<select aria-label="Pacing" value={pacing} onChange={e => { setPacing(e.target.value as PreloaderPacing); setRun(run + 1) }}>
            <option value="compact">Compact</option><option value="cinematic">Cinematic</option>
          </select></label>
          <label>Loading<select aria-label="Loading" value={scenario} onChange={e => { setScenario(e.target.value as LoadingScenario); setRun(run + 1) }}>
            <option value="actual">Actual asset readiness</option><option value="slow">Simulated slow loading</option><option value="failure">Simulated asset failure</option>
          </select></label>
          <p>Progress tracks essential assets and the first render. Cached assets can finish immediately. Slow loading extends the rotating phase. Changes replay the preview.</p>
          <AppearanceControls value={appearance} onChange={setAppearance} />
        </div></details>
      </div>
    </div>
    {scenario !== 'actual' && <span className="preloader-simulation-label">{scenario === 'slow' ? 'SIMULATING SLOW LOADING' : 'SIMULATING AN ASSET FAILURE'}</span>}
    <Preview key={`${run}-${pacing}-${scenario}`} pacing={pacing} scenario={scenario} appearance={appearance} />
  </div>
}
