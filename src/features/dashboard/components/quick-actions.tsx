import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/card'
import type { QuickAction } from '../../../types/domain'

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl">Today's shortcuts</p>
          <p className="mt-1 text-sm text-ink/65">Keep the demo moving with one clear action per tap.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            className="group rounded-[24px] border border-ink/8 bg-[linear-gradient(180deg,_rgba(244,239,230,0.9)_0%,_rgba(255,255,255,0.95)_100%)] px-4 py-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ember/30 hover:shadow-[0_18px_30px_rgba(20,33,61,0.08)]"
          >
            <span className="block text-[11px] uppercase tracking-[0.18em] text-ink/45">Open</span>
            <span className="mt-2 block text-base text-ink transition group-hover:text-ember">{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  )
}
