/**
 * FileCard — shows file name, type badge, size, status, and a select button.
 */
export default function FileCard({ file, isActive, onSelect }) {
  const ext = file.filename?.split('.').pop()?.toLowerCase() || 'file'

  const badgeClass = {
    pdf: 'badge-pdf',
    mp3: 'badge-mp3',
    wav: 'badge-wav',
    mp4: 'badge-mp4',
    mov: 'badge-mov',
  }[ext] || 'bg-ink-700 text-ink-300 border border-ink-600'

  const typeIcon = {
    pdf: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    mp3: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
    wav: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
    mp4: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    mov: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  }

  const statusConfig = {
    completed: { label: 'Ready', cls: 'text-teal-400' },
    processing: { label: 'Processing', cls: 'text-amber-400 animate-pulse' },
    failed: { label: 'Failed', cls: 'text-rose-400' },
  }
  const status = statusConfig[file.status] || statusConfig.completed

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      onClick={() => onSelect(file)}
      className={`glass rounded-2xl p-4 cursor-pointer transition-all duration-200 group
        ${isActive
          ? 'border-amber-400/40 shadow-glow-amber ring-1 ring-amber-400/20'
          : 'hover:border-white/12 hover:bg-ink-800/60'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
          ${isActive ? 'bg-amber-400/15 text-amber-400' : 'bg-ink-800 text-ink-400 group-hover:text-ink-200'}`}>
          {typeIcon[ext] || typeIcon.pdf}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-100 truncate leading-tight" title={file.original_filename || file.filename}>
            {file.original_filename || file.filename}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`tag text-xs px-2 py-0.5 rounded ${badgeClass}`}>
              {ext.toUpperCase()}
            </span>
            <span className="text-xs text-ink-500">{formatSize(file.file_size)}</span>
            <span className={`text-xs font-medium ${status.cls}`}>● {status.label}</span>
          </div>
        </div>

        {/* Active checkmark */}
        {isActive && (
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* File ID */}
      <p className="mt-2 text-xs font-mono text-ink-600 truncate">
        {file.id}
      </p>
    </div>
  )
}
