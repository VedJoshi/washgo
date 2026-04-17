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

export function DashboardPage() {
  const { vehicle, brief, isLoading, isError } = useDashboardData()
  const { health, isLoading: isHealthLoading } = useVehicleHealth()

  if (isLoading || isHealthLoading) {
    return <Spinner label="Loading your daily driver brief..." />
  }

  if (isError || !vehicle || !brief || !health) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="The mock dashboard could not load. Refresh to retry the seeded demo data."
      />
    )
  }

  const primaryRecommendation = health.recommendations[0]

  return (
    <div className="space-y-5 sm:space-y-6">
      <DailyBriefCard brief={brief} vehicle={vehicle} />
      <StatusOverview vehicle={vehicle} health={health} />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Why this matters today</p>
          <p className="mt-3 font-display text-[2rem] leading-tight">{primaryRecommendation?.title ?? 'Your car is in good shape'}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/68">
            {primaryRecommendation?.description ?? 'No urgent actions needed. Keep up with scheduled maintenance to stay ahead of issues.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/vehicle"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-ink/92"
            >
              Open vehicle diagnostic
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-sand"
            >
              Ask why
            </Link>
          </div>
        </Card>

        <BookingCtaCard recommendation={primaryRecommendation} />
      </div>

      <QuickActions actions={brief.suggestedActions} />

      <Card className="overflow-hidden border-none bg-[linear-gradient(140deg,_rgba(21,48,74,1)_0%,_rgba(24,61,92,1)_100%)] text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Assistant</p>
            <p className="mt-2 font-display text-[2rem] leading-tight">Ask the copilot what to do next</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Use the assistant for daily guidance, maintenance questions, or fast explanations for the recommendation.
            </p>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-sand"
          >
            Open assistant
          </Link>
        </div>
      </Card>
    </div>
  )
}
