import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'

export type VideoPlayerHandle = { stop: () => void }
type Props = { src: string; title: string; closing: boolean; onAspect: (ratio: number) => void; ref?: Ref<VideoPlayerHandle> }
type MobileVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitExitFullscreen?: () => void; webkitDisplayingFullscreen?: boolean }
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export default function VideoPlayer({ src, title, closing, onAspect, ref }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false), [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0), [duration, setDuration] = useState(0)
  const [waiting, setWaiting] = useState(true), [error, setError] = useState(false)
  useImperativeHandle(ref, () => ({ stop: () => {
    const element = video.current as MobileVideo | null
    element?.pause()
    if (element?.webkitDisplayingFullscreen) element.webkitExitFullscreen?.()
    if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {})
  } }), [])
  useEffect(() => {
    const element = video.current!
    let disposed = false, resume = false
    element.src = src
    const play = () => element.play().catch(reason => {
      if (disposed) return
      if (reason?.name === 'NotAllowedError' && !element.muted) {
        element.muted = true
        void element.play().catch(() => { if (!disposed) setError(true) })
      } else if (reason?.name !== 'AbortError') setError(true)
    })
    element.muted = false
    void play()
    const visibility = () => {
      if (document.hidden) { resume = !element.paused; element.pause() }
      else if (resume) { resume = false; void play() }
    }
    const fullscreenChange = () => { if (document.fullscreenElement !== element) element.controls = false }
    const nativeFullscreenEnd = () => { element.controls = false }
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('fullscreenchange', fullscreenChange)
    element.addEventListener('webkitendfullscreen', nativeFullscreenEnd)
    return () => {
      disposed = true; element.pause(); element.removeAttribute('src'); element.load()
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('fullscreenchange', fullscreenChange)
      element.removeEventListener('webkitendfullscreen', nativeFullscreenEnd)
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {})
    }
  }, [src])
  useEffect(() => { if (closing) video.current?.pause() }, [closing])
  const play = () => {
    const element = video.current!
    if (element.paused) void element.play().catch(() => setError(true))
    else element.pause()
  }
  const retry = () => {
    setError(false); setWaiting(true)
    const element = video.current!
    element.load()
    void element.play().catch(() => setError(true))
  }
  const fullscreen = () => {
    const element = video.current as MobileVideo
    element.controls = true
    if (element.webkitEnterFullscreen) element.webkitEnterFullscreen()
    else if (element.requestFullscreen) void element.requestFullscreen().catch(() => { element.controls = false })
    else element.controls = false
  }
  return <div className="signature-video-content">
    <video ref={video} src={src} playsInline loop preload="auto" disableRemotePlayback aria-label={title}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onVolumeChange={e => setMuted(e.currentTarget.muted)}
      onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={e => {
        const element = e.currentTarget
        setDuration(Number.isFinite(element.duration) ? element.duration : 0)
        if (element.videoWidth && element.videoHeight) onAspect(element.videoWidth / element.videoHeight)
      }}
      onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)}
      onWaiting={() => setWaiting(true)} onStalled={() => setWaiting(true)} onError={() => { setWaiting(false); setError(true) }} />
    {waiting && !error && <span className="signature-video-status" role="status"><span className="signature-spinner" aria-hidden="true" />Loading video…</span>}
    {error && <div className="signature-video-error" role="status"><p>This video could not load.</p><button type="button" onClick={retry}>Retry video</button></div>}
    {!error && <div className="signature-video-controls" aria-label="Video controls">
      <input className="signature-seek" type="range" min="0" max={duration || 1} step=".1" value={Math.min(time, duration || 1)} disabled={!duration || error}
        aria-label="Seek" aria-valuetext={`${clock(time)} of ${clock(duration)}`} onChange={e => { const next = Number(e.target.value); video.current!.currentTime = next; setTime(next) }} />
      <div className="signature-video-buttons">
        <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={play}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
        <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { video.current!.muted = !video.current!.muted }}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <span className="signature-video-time">{clock(time)} / {clock(duration)}</span>
        <button type="button" className="signature-fullscreen" aria-label="Enter fullscreen" onClick={fullscreen}><Maximize2 size={16} /></button>
      </div>
    </div>}
  </div>
}
