import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import type { Vehicle, VehicleHealth } from '../../../types/domain'

function toneFromStatus(status: VehicleHealth['status']) {
  if (status === 'good') return 'good'
  if (status === 'watch') return 'warn'
  return 'danger'
}

export function VehicleHealthCard({
  health,
  vehicle,
  compact = false,
}: {
  health: VehicleHealth
  vehicle?: Vehicle
  compact?: boolean
}) {
  return (
    <Card className={compact ? 'p-5' : 'p-5 sm:p-6'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone={toneFromStatus(health.status)}>{health.status.replace('_', ' ')}</Badge>
          <p className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.35rem]">
            {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle health'}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">
            Score {health.score}/100 with {health.issues.length} items flagged for attention.
          </p>
        </div>
        <div className="rounded-[26px] border border-ink/8 bg-[linear-gradient(180deg,_rgba(244,239,230,0.95)_0%,_rgba(255,255,255,0.95)_100%)] px-5 py-4 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Health score</p>
          <p className="mt-2 font-display text-5xl leading-none">{health.score}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-5 grid gap-3">
          {health.issues.map((issue) => (
            <div
              key={issue}
              className="rounded-[22px] border border-ink/8 bg-[linear-gradient(180deg,_rgba(248,249,251,1)_0%,_rgba(255,255,255,1)_100%)] px-4 py-3 text-sm leading-6 text-ink/80"
            >
              {issue}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
