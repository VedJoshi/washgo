import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-ember/70',
        className,
      )}
      {...props}
    />
  )
}
