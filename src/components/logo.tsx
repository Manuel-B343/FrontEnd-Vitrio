import { useId } from 'react'
import { cn } from '@/lib/utils'

export function LogoMark({ size = 28 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b5bdb" />
        </linearGradient>
      </defs>
      <path d="M15 20 L50 78 L85 20" stroke={`url(#${id})`} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className="font-black tracking-[0.07em] text-slate-100" style={{ fontSize: size * 0.057 + 'rem' }}>
        VIT<span className="font-light opacity-60">RIO</span>
      </span>
    </div>
  )
}
