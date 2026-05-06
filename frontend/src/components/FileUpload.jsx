import { useCallback, useRef, useState } from 'react'
import { uploadFile } from '../services/api'
import { useToast } from '../hooks/useToast'
import LoadingSpinner from './LoadingSpinner'

const ACCEPTED = ['application/pdf', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime']
const ACCEPTED_EXT = ['.pdf', '.mp3', '.wav', '.mp4', '.mov']
const MAX_BYTES = 500 * 1024 * 1024 // 500 MB

/**
 * FileUpload — drag-and-drop + click-to-browse upload widget.
 * Calls onUploaded(fileData) on success.
 */
export default function FileUpload({ onUploaded }) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [stageName, setStageName] = useState('')
  const inputRef = useRef(null)
  const toast    = useToast()

  /* ── Validation ── */
  const validate = (file) => {
    if (!file) return 'No file selected.'
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXT.includes(ext)) return `Unsupported format. Allowed: ${ACCEPTED_EXT.join(', ')}`
    if (file.size > MAX_BYTES) return 'File exceeds 500 MB limit.'
    return null
  }

  /* ── Upload handler ── */
  const handleUpload = useCallback(async (file) => {
    const err = validate(file)
    if (err) { toast.error(err); return }

    setUploading(true)
    setProgress(0)
    setStageName(file.name)

    try {
      const data = await uploadFile(file, setProgress)
      toast.success(`"${data.filename}" uploaded successfully!`)
      onUploaded?.({
        id: data.file_id,
        filename: data.filename,
        original_filename: file.name,
        file_type: file.name.split('.').pop().toLowerCase(),
        file_size: file.size,
        status: data.status,
        localUrl: URL.createObjectURL(file),
        mimeType: file.type,
      })
    } catch (e) {
      toast.error(e.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
      setStageName('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [onUploaded, toast])

  /* ── Drag events ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
          ${dragging
            ? 'border-amber-400 bg-amber-400/5 scale-[1.01]'
            : uploading
              ? 'border-teal-500/40 bg-teal-500/5 cursor-not-allowed'
              : 'border-ink-700 hover:border-ink-500 hover:bg-ink-800/40'
          }`}
      >
        {/* Background glow when dragging */}
        {dragging && (
          <div className="absolute inset-0 rounded-2xl bg-amber-400/5 pointer-events-none" />
        )}

        {uploading ? (
          /* ── Progress state ── */
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <LoadingSpinner label="Uploading & processing…" size="lg" />
            <div className="w-full">
              <div className="flex justify-between text-xs text-ink-400 mb-1.5">
                <span className="truncate max-w-[180px]">{stageName}</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── Idle state ── */
          <>
            <div className="w-14 h-14 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink-100">
                {dragging ? 'Drop it!' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-ink-500 mt-1">or click to browse</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['PDF', 'MP3', 'WAV', 'MP4', 'MOV'].map((f) => (
                <span key={f} className="tag text-xs">{f}</span>
              ))}
            </div>
            <p className="text-xs text-ink-600">Max 500 MB</p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT.join(',')}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
