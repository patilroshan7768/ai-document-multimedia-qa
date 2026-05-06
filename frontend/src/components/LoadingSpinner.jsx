/**
 * LoadingSpinner — reusable animated loader with optional label.
 */
export default function LoadingSpinner({ label = 'Loading…', size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`${sizes[size]} rounded-full border-amber-400/30 border-t-amber-400 animate-spin inline-block`}
      />
      {label && <span className="text-sm text-ink-400">{label}</span>}
    </div>
  )
}

/**
 * DotLoader — three bouncing dots, used inside chat bubbles.
 */
export function DotLoader() {
  return (
    <div className="dot-loader flex items-center gap-1 py-1">
      <span />
      <span />
      <span />
    </div>
  )
}

/**
 * SkeletonBlock — shimmer placeholder for loading states.
 */
export function SkeletonBlock({ className = '' }) {
  return <div className={`shimmer rounded-lg ${className}`} />
}
