import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import type { ServiceRecordEntry } from '../../../types/domain'

const SOURCE_BADGE: Record<ServiceRecordEntry['source'], { label: string; tone: 'neutral' | 'good' | 'warn' }> = {
  lens_extracted: { label: 'Lens', tone: 'warn' },
  booking: { label: 'Booking', tone: 'good' },
  manual: { label: 'Manual', tone: 'neutral' },
}

function formatDate(dateStr: string): string {
  if (dateStr === 'unknown') return 'Unknown date'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatVnd(amount: number): string {
  if (amount === 0) return '—'
  return `${amount.toLocaleString('en-US')} VND`
}

function formatServiceType(raw: string): string {
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface ServiceTimelineProps {
  entries: ServiceRecordEntry[]
}

export function ServiceTimeline({ entries }: ServiceTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No service records yet"
        description="Use Dashboard Lens to extract records from your service book, or book a service to start building your history."
      />
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const source = SOURCE_BADGE[entry.source] ?? SOURCE_BADGE.manual
        return (
          <Card key={entry.id} className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{formatDate(entry.date)}</p>
                <p className="mt-0.5 font-semibold text-ink">{formatServiceType(entry.serviceType)}</p>
                <p className="text-sm text-ink/70">{entry.garageName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={source.tone}>{source.label}</Badge>
                <span className="text-sm font-semibold text-ink">{formatVnd(entry.costVnd)}</span>
              </div>
            </div>
            {entry.partsReplaced.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.partsReplaced.map((part) => (
                  <span
                    key={part}
                    className="rounded-full bg-ink/6 px-2.5 py-0.5 text-[11px] text-ink/70"
                  >
                    {part}
                  </span>
                ))}
              </div>
            )}
            {entry.notes && (
              <p className="text-xs text-ink/55 leading-5">{entry.notes}</p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
