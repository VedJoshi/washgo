import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../../lib/api/adapters/mock-dashboard-service'
import { vehicleService } from '../../../lib/api/adapters/mock-vehicle-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'

export function useDashboardData() {
  const userId = useSessionStore((state) => state.user.id)
  const vehicleId = useSessionStore((state) => state.activeVehicleId)

  const vehicleQuery = useQuery({
    queryKey: queryKeys.vehicle(userId),
    queryFn: () => vehicleService.getVehicle(userId),
  })

  const briefQuery = useQuery({
    queryKey: queryKeys.dailyBrief(userId, vehicleId),
    queryFn: () => dashboardService.getDailyBrief(userId, vehicleId),
  })

  return {
    vehicle: vehicleQuery.data,
    brief: briefQuery.data,
    isLoading: vehicleQuery.isLoading || briefQuery.isLoading,
    isError: vehicleQuery.isError || briefQuery.isError,
  }
}
