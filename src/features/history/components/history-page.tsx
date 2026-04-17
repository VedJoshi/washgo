import { Card } from '../../../components/ui/card'
import { t } from '../../../lib/i18n'
import { useSessionStore } from '../../../store/session-store'
import { useCarHistory } from '../hooks/use-car-history'
import { ServiceTimeline } from './service-timeline'
import { ValuationInsight } from './valuation-insight'

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('en-US')} VND`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HistoryPage() {
  const { sortedEntries, stats, valuationInsight, isLoadingInsight } = useCarHistory()
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(12,36,58,1)_0%,_rgba(21,57,90,1)_52%,_rgba(245,125,41,0.94)_100%)] text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/62">{t(uiLanguage, 'history_header_badge')}</p>
        <p className="mt-2 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">{t(uiLanguage, 'history_header_title')}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">{t(uiLanguage, 'history_header_desc')}</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'history_services')}</p>
          <p className="mt-1 font-display text-3xl">{stats.servicesCompleted}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'history_total_spent')}</p>
          <p className="mt-1 font-display text-xl leading-tight">{formatVnd(stats.totalSpentVnd)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'history_next_due')}</p>
          <p className="mt-1 font-display text-xl leading-tight">{formatDate(stats.nextDueDate)}</p>
        </Card>
      </div>

      <ServiceTimeline entries={sortedEntries} />

      <ValuationInsight insight={valuationInsight} isLoading={isLoadingInsight} />
    </div>
  )
}
