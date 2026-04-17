import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-ember/70',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
