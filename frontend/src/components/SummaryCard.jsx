import { useState } from 'react'
import { getSummary } from '../services/api'
import { useToast } from '../hooks/useToast'
import { SkeletonBlock } from './LoadingSpinner'

/**
 * SummaryCard — fetches and renders the AI summary for the active file.
 */
export default function SummaryCard({ activeFile }) {
  const [summary, setSummary]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const [fileIdCache, setCache] = useState(null)
  const toast = useToast()

  const fetchSummary = async () => {
    if (!activeFile) { toast.error('Select a file first.'); return }
    setLoading(true)
    setSummary('')
    setLoaded(false)
    try {
      const data = await getSummary(activeFile.id)
      setSummary(data.summary)
      setLoaded(true)
      setCache(activeFile.id)
    } catch (e) {
      toast.error(e.message || 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }

  /* Reset when a different file is selected */
  if (activeFile?.id !== fileIdCache && loaded) {
    setSummary('')
    setLoaded(false)
    setCache(null)
  }

  /* ── No file ── */
  if (!activeFile) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center text-ink-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm text-ink-500">Select a file to generate summary</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink-100">AI Summary</span>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="btn-primary text-xs px-3 py-1.5"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
          {loaded ? 'Regenerate' : 'Generate Summary'}
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && (
          <div className="space-y-2.5">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-[90%]" />
            <SkeletonBlock className="h-4 w-[95%]" />
            <SkeletonBlock className="h-4 w-[80%]" />
            <SkeletonBlock className="h-4 w-[88%]" />
            <SkeletonBlock className="h-4 w-[70%]" />
          </div>
        )}

        {!loading && !loaded && (
          <div className="py-8 text-center">
            <p className="text-sm text-ink-500">
              Click <span className="text-amber-400 font-medium">Generate Summary</span> to create an AI summary of{' '}
              <span className="text-ink-300">{activeFile.original_filename || activeFile.filename}</span>
            </p>
          </div>
        )}

        {loaded && summary && (
          <div className="animate-fade-in">
            {/* Decorative left border */}
            <div className="border-l-2 border-amber-400/40 pl-4">
              <p className="text-sm text-ink-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generated by Groq LLM · Cached for future requests
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
