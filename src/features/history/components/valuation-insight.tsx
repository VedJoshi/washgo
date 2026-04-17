import { Card } from '../../../components/ui/card'
import { t } from '../../../lib/i18n'
import { useSessionStore } from '../../../store/session-store'

interface ValuationInsightProps {
  insight: string | null
  isLoading: boolean
}

export function ValuationInsight({ insight, isLoading }: ValuationInsightProps) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (!isLoading && !insight) return null

  return (
    <Card className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/8 text-base">
        📈
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{t(uiLanguage, 'history_resale_value_insight')}</p>
        {isLoading ? (
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-ink/10" />
        ) : (
          <p className="mt-1 text-sm leading-6 text-ink/80">{insight}</p>
        )}
      </div>
    </Card>
  )
}
