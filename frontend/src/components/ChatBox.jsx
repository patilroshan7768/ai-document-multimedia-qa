import { useEffect, useRef, useState } from 'react'
import { askQuestion } from '../services/api'
import { useToast } from '../hooks/useToast'
import MessageBubble from './MessageBubble'

let msgId = 0

/**
 * ChatBox — ChatGPT-style interface for asking questions about a file.
 * onSeek(timestamp) is called when the user clicks "Play from timestamp".
 */
export default function ChatBox({ activeFile, onSeek }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const toast     = useToast()

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Focus input when file changes */
  useEffect(() => {
    if (activeFile) {
      setMessages([])
      inputRef.current?.focus()
    }
  }, [activeFile?.id])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return
    if (!activeFile) { toast.error('Select a file before chatting.'); return }

    const userMsg = { id: ++msgId, role: 'user', content: question }
    const loadMsg = { id: ++msgId, role: 'loading' }

    setMessages((prev) => [...prev, userMsg, loadMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await askQuestion(activeFile.id, question)
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== 'loading'),
        {
          id: ++msgId,
          role: 'assistant',
          content: data.answer,
          timestamp: data.timestamp ?? null,
          source_text: data.source_text ?? null,
        },
      ])
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.role !== 'loading'))
      toast.error(e.message || 'Failed to get answer.')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ── Empty / no-file state ── */
  if (!activeFile) {
    return (
      <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center text-ink-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-ink-300">No file selected</p>
          <p className="text-xs text-ink-600 mt-1">Upload and select a file to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl flex flex-col overflow-hidden" style={{ height: '540px' }}>
      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <p className="text-sm font-semibold text-ink-100 truncate max-w-[240px]">
            {activeFile.original_filename || activeFile.filename}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-ink-400">Ask anything about this document</p>
            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-1 max-w-md">
              {[
                'Summarize the main topics',
                'What are the key findings?',
                'Explain the introduction',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-ink-800 border border-ink-700 text-ink-400 hover:text-ink-200 hover:border-ink-500 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onSeek={onSeek} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-4 border-t border-white/5 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              /* Auto-resize */
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask a question… (Enter to send)"
            disabled={loading}
            className="input-base resize-none overflow-y-auto leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary shrink-0 h-11 w-11 p-0 flex items-center justify-center rounded-xl"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-ink-600 mt-2 text-center">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  )
}
