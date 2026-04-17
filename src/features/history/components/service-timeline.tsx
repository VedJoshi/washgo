import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { t } from '../../../lib/i18n'
import { useSessionStore } from '../../../store/session-store'
import type { ServiceRecordEntry } from '../../../types/domain'

const SOURCE_BADGE_TONE: Record<ServiceRecordEntry['source'], 'neutral' | 'good' | 'warn'> = {
  lens_extracted: 'warn',
  booking: 'good',
  manual: 'neutral',
}

function formatDate(dateStr: string): string {
  if (dateStr === 'unknown') return 'unknown'
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
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (entries.length === 0) {
    return (
      <EmptyState
        title={t(uiLanguage, 'history_no_records_title')}
        description={t(uiLanguage, 'history_no_records_desc')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const sourceTone = SOURCE_BADGE_TONE[entry.source] ?? SOURCE_BADGE_TONE.manual
        const sourceLabel =
          entry.source === 'lens_extracted'
            ? t(uiLanguage, 'history_source_lens')
            : entry.source === 'booking'
              ? t(uiLanguage, 'history_source_booking')
              : t(uiLanguage, 'history_source_manual')

        return (
          <Card key={entry.id} className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">
                  {entry.date === 'unknown' ? t(uiLanguage, 'history_unknown_date') : formatDate(entry.date)}
                </p>
                <p className="mt-0.5 font-semibold text-ink">{formatServiceType(entry.serviceType)}</p>
                <p className="text-sm text-ink/70">{entry.garageName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={sourceTone}>{sourceLabel}</Badge>
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
