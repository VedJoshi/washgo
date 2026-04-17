import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { Spinner } from '../components/ui/spinner'
import { BookingCtaCard } from '../features/booking/components/booking-cta-card'
import { DailyBriefCard } from '../features/dashboard/components/daily-brief-card'
import { QuickActions } from '../features/dashboard/components/quick-actions'
import { StatusOverview } from '../features/dashboard/components/status-overview'
import { useDashboardData } from '../features/dashboard/hooks/use-dashboard-data'
import { useVehicleHealth } from '../features/vehicle/hooks/use-vehicle-health'
import { t } from '../lib/i18n'
import { localizeRecommendation } from '../lib/localize-recommendation'
import { useSessionStore } from '../store/session-store'

export function DashboardPage() {
  const { vehicle, brief, isLoading, isError } = useDashboardData()
  const { health, isLoading: isHealthLoading } = useVehicleHealth()
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (isLoading || isHealthLoading) {
    return <Spinner label={t(uiLanguage, 'spinner_loading_daily_brief')} />
  }

  if (isError || !vehicle || !brief || !health) {
    return (
      <EmptyState
        title={t(uiLanguage, 'dashboard_unavailable_title')}
        description={t(uiLanguage, 'dashboard_unavailable_desc')}
      />
    )
  }

  const primaryRecommendation = health.recommendations[0]
  const localizedPrimaryRecommendation = primaryRecommendation
    ? localizeRecommendation(primaryRecommendation, uiLanguage)
    : undefined

  return (
    <div className="space-y-5 sm:space-y-6">
      <DailyBriefCard brief={brief} vehicle={vehicle} />
      <StatusOverview vehicle={vehicle} health={health} />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{t(uiLanguage, 'dashboard_why_today')}</p>
          <p className="mt-3 font-display text-[2rem] leading-tight">
            {localizedPrimaryRecommendation?.title ?? t(uiLanguage, 'dashboard_good_shape')}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/68">
            {localizedPrimaryRecommendation?.description ?? t(uiLanguage, 'dashboard_no_urgent')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/vehicle"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-ink/92"
            >
              {t(uiLanguage, 'dashboard_open_vehicle')}
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-sand"
            >
              {t(uiLanguage, 'dashboard_ask_why')}
            </Link>
          </div>
        </Card>

        <BookingCtaCard recommendation={localizedPrimaryRecommendation} />
      </div>

      <QuickActions actions={brief.suggestedActions} />

      <Card className="overflow-hidden border-none bg-[linear-gradient(140deg,_rgba(21,48,74,1)_0%,_rgba(24,61,92,1)_100%)] text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{t(uiLanguage, 'dashboard_assistant_title')}</p>
            <p className="mt-2 font-display text-[2rem] leading-tight">{t(uiLanguage, 'dashboard_assistant_heading')}</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              {t(uiLanguage, 'dashboard_assistant_desc')}
            </p>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-sand"
          >
            {t(uiLanguage, 'dashboard_open_assistant')}
          </Link>
        </div>
      </Card>
    </div>
  )
}
