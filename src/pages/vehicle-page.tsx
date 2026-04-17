import { EmptyState } from '../components/ui/empty-state'
import { Spinner } from '../components/ui/spinner'
import { useDashboardData } from '../features/dashboard/hooks/use-dashboard-data'
import { RecommendationList } from '../features/vehicle/components/recommendation-list'
import { VehicleDiagnosticPanel } from '../features/vehicle/components/vehicle-diagnostic-panel'
import { useVehicleHealth } from '../features/vehicle/hooks/use-vehicle-health'
import { t } from '../lib/i18n'
import { useSessionStore } from '../store/session-store'

export function VehiclePage() {
  const { vehicle, isLoading } = useDashboardData()
  const { health, isLoading: isHealthLoading } = useVehicleHealth()
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (isLoading || isHealthLoading) {
    return <Spinner label={t(uiLanguage, 'spinner_checking_vehicle')} />
  }

  if (!vehicle || !health) {
    return (
      <EmptyState
        title={t(uiLanguage, 'vehicle_unavailable_title')}
        description={t(uiLanguage, 'vehicle_unavailable_desc')}
      />
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <VehicleDiagnosticPanel health={health} vehicle={vehicle} />
      <RecommendationList recommendations={health.recommendations} />
    </div>
  )
}
