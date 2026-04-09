import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils/cn'

type BadgeProps = PropsWithChildren<{
  tone?: 'neutral' | 'warn' | 'danger' | 'good'
}>

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
        tone === 'neutral' && 'bg-ink/8 text-ink/70',
        tone === 'warn' && 'bg-amber-100 text-amber-800',
        tone === 'danger' && 'bg-red-100 text-red-700',
        tone === 'good' && 'bg-emerald-100 text-emerald-700',
      )}
    >
      {children}
    </span>
  )
}
