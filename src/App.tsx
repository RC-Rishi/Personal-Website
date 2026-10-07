import { Suspense, useState } from 'react'
import { ArrowUpRight, Box, Layers3, Monitor, Smartphone, Tablet } from 'lucide-react'
import { components } from './lab/registry'

const viewports = [
  { label: 'Desktop', width: '100%', Icon: Monitor },
  { label: 'Tablet', width: '768px', Icon: Tablet },
  { label: 'Mobile', width: '390px', Icon: Smartphone },
] as const

export default function App() {
  const [selectedId, setSelectedId] = useState(components[0]?.id ?? '')
  const [viewport, setViewport] = useState<(typeof viewports)[number]>(viewports[0])
  const selected = components.find((entry) => entry.id === selectedId)
  const isolatedId = new URLSearchParams(window.location.search).get('component')
  const isolated = components.find((entry) => entry.id === isolatedId)

  if (isolatedId) {
    if (!isolated) return <main className="empty-state"><h1>Component not found</h1><a href="/">Return to the lab</a></main>
    const fallback = isolatedId === 'sharingan-preloader'
      ? <main className="preloader-boot" aria-label="Preparing the entrance" role="status"><span /></main>
      : <main className="empty-state" role="status">Loading component…</main>
    return <Suspense fallback={fallback}><isolated.Component /></Suspense>
  }

  return (
    <div className="lab-shell">
      <a className="skip-link" href="#preview">Skip to preview</a>
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-icon"><Layers3 size={20} /></span>Component Lab<span className="badge">PERSONAL WEBSITE</span></a>
        <span className="header-note"><span className="status-dot" />A space to experiment</span>
      </header>
      <main className="lab-main">
        <section className="intro" aria-labelledby="page-title">
          <div><p className="eyebrow">YOUR COLLECTION, ONE PIECE AT A TIME</p><h1 id="page-title">Great websites start<br />with <span>small experiments.</span></h1><p className="intro-copy">Collect the details you love. Give each idea room to grow.<br />Build something that feels like you.</p></div>
          <div className="collection-count"><strong>{String(components.length).padStart(2, '0')}</strong><span>components collected</span></div>
        </section>
        <div className="workspace">
          <aside className="collection" aria-label="Component collection">
            <div className="panel-heading"><h2>Collection</h2><span>{components.length}</span></div>
            {components.length ? <div className="component-list">{components.map((entry) => <button className={`component-item ${entry.id === selectedId ? 'selected' : ''}`} key={entry.id} onClick={() => setSelectedId(entry.id)}><span>{entry.name}</span><small>{entry.category} / {entry.status}</small></button>)}</div> : <div className="collection-empty"><Box size={28} strokeWidth={1.4} /><p>A fresh canvas.</p><span>Your components will live here.</span></div>}
            <div className="collection-footer"><span className="eyebrow">THE PROCESS</span><p>Reference → Experiment<br />→ Refine → Collect</p></div>
          </aside>
          <section className="preview-panel" id="preview" aria-label="Component preview">
            <div className="preview-toolbar"><span>{selected?.name ?? 'Preview canvas'}</span><div className="viewport-controls" role="group" aria-label="Preview width">{viewports.map((item) => <button key={item.label} aria-label={item.label} aria-pressed={viewport.label === item.label} onClick={() => setViewport(item)}><item.Icon size={17} /></button>)}</div></div>
            <div className="canvas-wrap"><div className="preview-frame" style={{ width: viewport.width }} data-viewport={viewport.label}>{selected ? <iframe title={`${selected.name} preview`} src={`/?component=${encodeURIComponent(selected.id)}`} /> : <div className="empty-state"><span className="empty-orbit"><Box size={38} strokeWidth={1.2} /></span><span className="eyebrow">READY FOR YOUR FIRST IDEA</span><h2>Every detail has potential.</h2><p>Choose a reference and we’ll build your first component here.</p><span className="canvas-label">{viewport.label} canvas <ArrowUpRight size={14} /></span></div>}</div></div>
            {selected && <div className="component-details"><p>{selected.description}</p>{selected.referenceUrl && <a href={selected.referenceUrl} target="_blank" rel="noreferrer">View reference <ArrowUpRight size={14} /></a>}<a href={`/?component=${encodeURIComponent(selected.id)}`} target="_blank" rel="noreferrer">Open standalone <ArrowUpRight size={14} /></a></div>}
          </section>
        </div>
        <footer className="footer"><span>Made for exploration.</span><span>Motion · Interaction · Dimension</span></footer>
      </main>
    </div>
  )
}
