import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SignatureMoments, { type SignatureMomentsHandle, type SignatureMoment } from '../../src/components/signature-moments/SignatureMoments'
const options = new URLSearchParams(location.search)
const content: readonly SignatureMoment[] = options.has('empty') ? [] : [
  { id: 'first', title: 'First chapter', stat: 'A CUSTOM STORY', image: { src: options.has('broken') ? '/missing-card.webp' : '/assets/signature-moments/card-03.webp', width: 1036, height: 1519 }, video: { src: '/assets/signature-moments/moment-03.mp4' } },
  { id: 'second', title: 'Second chapter', stat: 'AN IMAGE-ONLY MOMENT', image: { src: '/assets/signature-moments/card-02.webp', width: 1046, height: 1503 } },
]
function Fixture() {
  const api = useRef<SignatureMomentsHandle>(null)
  const [ready, setReady] = useState(0), [active, setActive] = useState(0)
  return <>
    <header><h1>Independent component fixture</h1><p>Ready callbacks: <output>{ready}</output>. Active: <output>{active}</output>.</p>
      <div className="fixture-controls"><button onClick={() => api.current?.goTo(1)}>Go to second chapter</button><button onClick={() => api.current?.open(0)}>Open first chapter</button><button onClick={() => api.current?.close()}>Close player</button></div>
    </header>
    <SignatureMoments ref={api} moments={content} heading="My chapters" entrance={false} motionStrength={options.has('static') ? 0 : 1} scrollPace={.7}
      theme={{ background: '#102625', accent: '#8dcc98' }} onReady={() => setReady(n => n + 1)} onActiveChange={setActive} />
    <footer>Content after the component.</footer>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>)
