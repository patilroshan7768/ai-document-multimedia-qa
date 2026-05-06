import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const fmtTime = (secs) => {
  if (!secs && secs !== 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * AudioPlayer — custom styled HTML5 audio player.
 * Exposes seekTo(seconds) via ref.
 */
const AudioPlayer = forwardRef(function AudioPlayer({ src, filename = 'Audio' }, ref) {
  const audioRef   = useRef(null)
  const [playing, setPlaying]     = useState(false)
  const [current, setCurrent]     = useState(0)
  const [duration, setDuration]   = useState(0)
  const [lastSeek, setLastSeek]   = useState(null)
  const [volume, setVolume]       = useState(1)

  useImperativeHandle(ref, () => ({
    seekTo(timestamp) {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = timestamp
      setLastSeek(timestamp)
      audio.play().catch(() => {})
      setPlaying(true)
    },
  }))

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime  = () => setCurrent(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration || 0)
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd   = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnd)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    playing ? audio.pause() : audio.play()
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  const changeVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  const progress = duration ? (current / duration) * 100 : 0

  if (!src) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center text-ink-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
        <p className="text-sm text-ink-500">No audio selected</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink-100 truncate max-w-[200px]">{filename}</span>
        </div>
        {lastSeek != null && (
          <span className="text-xs text-violet-400 font-mono">Seeked → {fmtTime(lastSeek)}</span>
        )}
      </div>

      {/* Player body */}
      <div className="px-5 py-5 space-y-4">
        {/* Waveform visualizer (decorative bars) */}
        <div className="flex items-end justify-center gap-0.5 h-10 opacity-40">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all duration-300 ${
                playing ? 'animate-pulse-slow' : ''
              }`}
              style={{
                height: `${20 + Math.sin(i * 0.8) * 14 + Math.cos(i * 0.5) * 8}%`,
                background: progress / 100 > i / 40 ? '#a78bfa' : '#2d2d50',
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="relative h-1.5 bg-ink-800 rounded-full cursor-pointer group"
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 bg-violet-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between text-xs font-mono text-ink-500">
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Volume */}
            <svg className="w-4 h-4 text-ink-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={volume}
              onChange={changeVolume}
              className="w-20 accent-violet-400 cursor-pointer"
            />
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-violet-500 hover:bg-violet-400 flex items-center justify-center transition-all active:scale-95 shadow-lg"
          >
            {playing ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
            className="text-xs text-ink-500 hover:text-ink-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
            </svg>
            +10s
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  )
})

export default AudioPlayer
