import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../lib/utils/cn'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost'
  }
>

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-ink text-white shadow-[0_14px_30px_rgba(20,33,61,0.18)] hover:-translate-y-0.5 hover:bg-ink/92',
        variant === 'secondary' &&
          'bg-ember text-white shadow-[0_14px_30px_rgba(249,115,22,0.22)] hover:-translate-y-0.5 hover:bg-ember/92',
        variant === 'ghost' && 'border border-ink/10 bg-white text-ink hover:border-ember/30 hover:bg-sand',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
