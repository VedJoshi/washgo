import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-ember/70',
        className,
      )}
      {...props}
    />
  )
}
