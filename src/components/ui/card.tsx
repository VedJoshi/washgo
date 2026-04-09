import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../lib/utils/cn'

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <section
      className={cn(
        'rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(255,255,255,0.88)_100%)] p-5 shadow-panel backdrop-blur sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
