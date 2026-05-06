import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

/** Format seconds → HH:MM:SS or MM:SS */
const fmtTime = (secs) => {
  if (!secs && secs !== 0) return '0:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * VideoPlayer — HTML5 video element.
 * Exposes seekTo(seconds) via ref.
 */
const VideoPlayer = forwardRef(function VideoPlayer({ src, mimeType = 'video/mp4' }, ref) {
  const videoRef = useRef(null)
  const [seeking, setSeeking] = useState(false)
  const [lastSeek, setLastSeek] = useState(null)

  /* Expose seekTo() to parent */
  useImperativeHandle(ref, () => ({
    seekTo(timestamp) {
      const video = videoRef.current
      if (!video) return
      setSeeking(true)
      video.currentTime = timestamp
      setLastSeek(timestamp)
      video.play().catch(() => {})
      setTimeout(() => setSeeking(false), 600)
    },
  }))

  if (!src) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center text-ink-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-sm text-ink-500">No video selected</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          </div>
          <span className="text-sm font-semibold text-ink-100">Video Player</span>
        </div>
        {lastSeek != null && (
          <span className="text-xs text-teal-400 font-mono">
            Seeked to {fmtTime(lastSeek)}
          </span>
        )}
      </div>

      {/* Video */}
      <div className="relative bg-black">
        {seeking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
            <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          controls
          className="w-full max-h-72 object-contain"
          preload="metadata"
        >
          <source src={src} type={mimeType} />
          Your browser does not support the video element.
        </video>
      </div>

      {lastSeek != null && (
        <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-xs text-ink-500">
          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last seeked to <span className="font-mono text-teal-400">{fmtTime(lastSeek)}</span>
        </div>
      )}
    </div>
  )
})

export default VideoPlayer
