import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import type { DailyBrief, Vehicle } from '../../../types/domain'

export function DailyBriefCard({ brief, vehicle }: { brief: DailyBrief; vehicle: Vehicle }) {
  return (
    <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(11,31,53,1)_0%,_rgba(23,58,91,1)_48%,_rgba(236,114,34,0.94)_100%)] px-5 py-6 text-white sm:px-7">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <Badge tone="neutral">Daily driver briefing</Badge>
          <h1 className="mt-4 max-w-2xl font-display text-[2.2rem] leading-[0.98] tracking-tight sm:text-[3.4rem]">
            {brief.greeting}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-[15px]">{brief.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/65">
            <span className="rounded-full border border-white/15 bg-white/8 px-3 py-2">{vehicle.make} {vehicle.model}</span>
            <span className="rounded-full border border-white/15 bg-white/8 px-3 py-2">{vehicle.plateNumber}</span>
          </div>
        </div>
        <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
          {brief.alerts.map((alert) => (
            <div key={alert.id} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/76">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
