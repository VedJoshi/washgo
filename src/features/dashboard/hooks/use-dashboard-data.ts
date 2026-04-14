import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../../lib/api/adapters/qwen-dashboard-service'
import { vehicleService } from '../../../lib/api/adapters/mock-vehicle-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'

export function useDashboardData() {
  const userId = useSessionStore((state) => state.user.id)
  const vehicleId = useSessionStore((state) => state.activeVehicleId)
  const cachedDailyBrief = useSessionStore((state) => state.cachedDailyBrief)
  const cachedDailyBriefKey = useSessionStore((state) => state.cachedDailyBriefKey)
  const setCachedDailyBrief = useSessionStore((state) => state.setCachedDailyBrief)

  const dateKey = new Date().toISOString().slice(0, 10)
  const briefCacheKey = `${userId}:${vehicleId}:${dateKey}`

  const vehicleQuery = useQuery({
    queryKey: queryKeys.vehicle(userId),
    queryFn: () => vehicleService.getVehicle(userId),
  })

  const briefQuery = useQuery({
    queryKey: queryKeys.dailyBrief(userId, vehicleId, dateKey),
    queryFn: async () => {
      if (cachedDailyBrief && cachedDailyBriefKey === briefCacheKey) {
        return cachedDailyBrief
      }

      const brief = await dashboardService.getDailyBrief(userId, vehicleId)
      setCachedDailyBrief(briefCacheKey, brief)
      return brief
    },
    staleTime: Infinity,
  })

  return {
    vehicle: vehicleQuery.data,
    brief: briefQuery.data,
    isLoading: vehicleQuery.isLoading || briefQuery.isLoading,
    isError: vehicleQuery.isError || briefQuery.isError,
  }
}
