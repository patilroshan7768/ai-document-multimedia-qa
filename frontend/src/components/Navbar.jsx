import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'

/**
 * Navbar — sticky top bar with logo, nav links, and live API health indicator.
 */
export default function Navbar() {
  const [healthy, setHealthy] = useState(null) // null = unknown, true/false

  useEffect(() => {
    getHealth()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shadow-glow-amber">
            <svg className="w-4 h-4 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-ink-50">
            Doc<span className="text-amber-400">QA</span>
          </span>
        </div>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-1">
          {[
            { label: 'Upload',  id: 'upload-section'  },
            { label: 'Chat',    id: 'chat-section'    },
            { label: 'Summary', id: 'summary-section' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-3 py-1.5 rounded-lg text-sm text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-all duration-150"
            >
              {label}
            </button>
          ))}
        </div>

        {/* API status */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
              ${healthy === true
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                : healthy === false
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-ink-800 text-ink-500 border-ink-700'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                healthy === true ? 'bg-teal-400 animate-pulse' :
                healthy === false ? 'bg-rose-400' : 'bg-ink-500'
              }`}
            />
            {healthy === true ? 'API Online' : healthy === false ? 'API Offline' : 'Checking…'}
          </span>
        </div>
      </nav>
    </header>
  )
}
