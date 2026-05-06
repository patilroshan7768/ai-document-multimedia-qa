import { DotLoader } from './LoadingSpinner'

/** Format seconds → MM:SS */
const fmtTime = (secs) => {
  if (secs == null) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * MessageBubble — renders a single chat message.
 * role: 'user' | 'assistant' | 'loading'
 */
export default function MessageBubble({ message, onSeek }) {
  const { role, content, timestamp, source_text } = message
  const isUser = role === 'user'
  const isLoading = role === 'loading'

  if (isLoading) {
    return (
      <div className="flex items-end gap-3 animate-fade-in">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
          <DotLoader />
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[75%] bg-amber-400/10 border border-amber-400/20 rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm text-ink-100 leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  /* ── Assistant message ── */
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 mb-0.5">
        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0 max-w-[85%] space-y-2">
        {/* Answer */}
        <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
          <div
            className="ai-prose text-sm text-ink-100"
            dangerouslySetInnerHTML={{ __html: formatAnswer(content) }}
          />
        </div>

        {/* Timestamp badge + seek button */}
        {timestamp != null && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fmtTime(timestamp)}
            </span>
            {onSeek && (
              <button
                onClick={() => onSeek(timestamp)}
                className="btn-teal text-xs px-3 py-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Play from {fmtTime(timestamp)}
              </button>
            )}
          </div>
        )}

        {/* Source text */}
        {source_text && (
          <details className="group">
            <summary className="text-xs text-ink-500 hover:text-ink-300 cursor-pointer select-none transition-colors flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              Source excerpt
            </summary>
            <div className="mt-1.5 px-3 py-2 rounded-xl bg-ink-900 border border-ink-800">
              <p className="text-xs text-ink-400 leading-relaxed font-mono">{source_text}</p>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

/** Convert plain text answer to basic HTML with paragraph breaks. */
function formatAnswer(text) {
  if (!text) return ''
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}
