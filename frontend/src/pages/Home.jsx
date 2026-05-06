import { useRef, useState } from 'react'
import FileUpload from '../components/FileUpload'
import FileCard from '../components/FileCard'
import ChatBox from '../components/ChatBox'
import SummaryCard from '../components/SummaryCard'
import VideoPlayer from '../components/VideoPlayer'
import AudioPlayer from '../components/AudioPlayer'

const VIDEO_TYPES = ['mp4', 'mov']
const AUDIO_TYPES = ['mp3', 'wav']

/**
 * Home — single-page layout with Upload, Files, Chat, Summary, and Media sections.
 */
export default function Home() {
  const [files, setFiles]           = useState([])
  const [activeFile, setActiveFile] = useState(null)

  const videoRef = useRef(null)
  const audioRef = useRef(null)

  /* Add newly uploaded file to list and auto-select it */
  const handleUploaded = (file) => {
    setFiles((prev) => {
      const exists = prev.find((f) => f.id === file.id)
      return exists ? prev : [file, ...prev]
    })
    setActiveFile(file)
  }

  /* Seek media player to timestamp from chat answer */
  const handleSeek = (timestamp) => {
    const ext = activeFile?.file_type?.toLowerCase()
    if (VIDEO_TYPES.includes(ext)) {
      videoRef.current?.seekTo(timestamp)
      document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth' })
    } else if (AUDIO_TYPES.includes(ext)) {
      audioRef.current?.seekTo(timestamp)
      document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isVideo = VIDEO_TYPES.includes(activeFile?.file_type?.toLowerCase())
  const isAudio = AUDIO_TYPES.includes(activeFile?.file_type?.toLowerCase())
  const showMedia = activeFile && (isVideo || isAudio)

  return (
    <main className="max-w-6xl mx-auto px-5 py-10 space-y-16">

      {/* ── Hero ── */}
      <section className="text-center space-y-4 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Powered by Groq LLM + FAISS Vector Search
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-50 leading-tight tracking-tight">
          Ask anything about your<br />
          <span className="text-amber-400">documents & media</span>
        </h1>
        <p className="text-ink-400 max-w-xl mx-auto text-sm leading-relaxed">
          Upload PDFs, audio recordings, or videos. Our RAG pipeline extracts meaning,
          indexes it semantically, and lets you have a conversation — with precise timestamps.
        </p>
      </section>

      {/* ── Upload Section ── */}
      <section id="upload-section" className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <p className="section-title">01 — Upload</p>
        <FileUpload onUploaded={handleUploaded} />
      </section>

      {/* ── Uploaded Files ── */}
      {files.length > 0 && (
        <section className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <p className="section-title mb-0">02 — Your Files</p>
            <span className="tag">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isActive={activeFile?.id === file.id}
                onSelect={setActiveFile}
              />
            ))}
          </div>
          {activeFile && (
            <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Active: <span className="text-amber-400 font-medium">{activeFile.original_filename || activeFile.filename}</span>
            </div>
          )}
        </section>
      )}

      {/* ── Chat + Summary side-by-side ── */}
      <section id="chat-section" className="space-y-4 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <p className="section-title">03 — Chat & Summarize</p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Chat — wider */}
          <div className="lg:col-span-3">
            <ChatBox activeFile={activeFile} onSeek={handleSeek} />
          </div>
          {/* Summary — narrower */}
          <div className="lg:col-span-2" id="summary-section">
            <SummaryCard activeFile={activeFile} />
          </div>
        </div>
      </section>

      {/* ── Media Player ── */}
      {showMedia && (
        <section id="media-section" className="space-y-4 animate-fade-up">
          <p className="section-title">04 — Media Player</p>
          {isVideo && (
            <VideoPlayer
              ref={videoRef}
              src={activeFile.localUrl}
              mimeType={activeFile.mimeType || 'video/mp4'}
            />
          )}
          {isAudio && (
            <AudioPlayer
              ref={audioRef}
              src={activeFile.localUrl}
              filename={activeFile.original_filename || activeFile.filename}
            />
          )}
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 pt-8 text-center text-xs text-ink-600 space-y-1">
        <p>DocQA · AI-Powered Document & Multimedia Intelligence</p>
        <p>FastAPI · Groq · FAISS · Faster-Whisper · React · Vite</p>
      </footer>
    </main>
  )
}
