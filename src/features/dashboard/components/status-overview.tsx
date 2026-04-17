import { Card } from '../../../components/ui/card'
import { t, type Language } from '../../../lib/i18n'
import { localizeCategoryLabel } from '../../../lib/localize-recommendation'
import { useSessionStore } from '../../../store/session-store'
import { formatKilometers } from '../../../lib/utils/format'
import type { Vehicle, VehicleHealth } from '../../../types/domain'

const statusCards = (
  language: Language,
  vehicle: Vehicle,
  health: VehicleHealth,
): Array<{ label: string; value: string; hint: string }> => [
  {
    label: t(language, 'status_next_service'),
    value: formatKilometers(vehicle.nextServiceDueKm - vehicle.currentOdometerKm),
    hint: t(language, 'status_next_service_hint'),
  },
  {
    label: t(language, 'status_primary_watch'),
    value: health.recommendations[0]?.category
      ? localizeCategoryLabel(health.recommendations[0].category, language)
      : t(language, 'status_all_clear'),
    hint: health.recommendations[0]?.issue ?? t(language, 'status_no_urgent_issues'),
  },
  {
    label: t(language, 'status_health_status'),
    value:
      health.status === 'needs_service'
        ? t(language, 'status_needs_service')
        : health.status === 'watch'
          ? t(language, 'status_watch')
          : t(language, 'status_good'),
    hint: `${health.issues.length} ${health.issues.length === 1 ? t(language, 'status_issue') : t(language, 'status_issues')} ${t(language, 'status_flagged_by_qwen')}`,
  },
]

export function StatusOverview({ vehicle, health }: { vehicle: Vehicle; health: VehicleHealth }) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {statusCards(uiLanguage, vehicle, health).map((item) => (
        <Card key={item.label} className="rounded-[26px] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{item.label}</p>
          <p className="mt-2 font-display text-[2rem] leading-none">{item.value}</p>
          <p className="mt-2 text-sm leading-5 text-ink/62">{item.hint}</p>
        </Card>
      ))}
    </div>
  )
}
