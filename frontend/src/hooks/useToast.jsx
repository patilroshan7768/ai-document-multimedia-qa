import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320)
  }, [])

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_id
      setToasts((prev) => [...prev, { id, message, type, exiting: false }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const success = (msg, dur) => toast(msg, 'success', dur)
  const error   = (msg, dur) => toast(msg, 'error', dur)
  const info    = (msg, dur) => toast(msg, 'info', dur)

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-80 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const icons = {
    success: (
      <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  const borders = {
    success: 'border-teal-500/30',
    error:   'border-rose-500/30',
    info:    'border-amber-500/30',
  }

  return (
    <div
      className={`pointer-events-auto glass rounded-xl p-4 flex items-start gap-3 shadow-card border ${borders[toast.type] || borders.info} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      {icons[toast.type]}
      <p className="text-sm text-ink-100 flex-1 leading-snug">{toast.message}</p>
      <button onClick={onDismiss} className="text-ink-500 hover:text-ink-200 transition-colors ml-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
