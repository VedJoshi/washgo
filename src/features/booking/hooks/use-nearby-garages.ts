import { useQuery } from '@tanstack/react-query'
import { fetchNearbyGarages } from '../../../lib/api/adapters/serpapi-garage-service'
import { useSessionStore } from '../../../store/session-store'
import { vehicleHealth as mockVehicleHealth } from '../../../lib/mocks/recommendations'

function resolveCategory(
  liveRecs: Array<{ id: string; category: string }> | undefined,
  selectedId: string | undefined,
): string {
  if (!selectedId || !liveRecs) return mockVehicleHealth.recommendations[0]?.category ?? 'oil'
  return (
    liveRecs.find((r) => r.id === selectedId)?.category ??
    liveRecs[0]?.category ??
    'oil'
  )
}

export function useNearbyGarages() {
  const selectedRecommendationId = useSessionStore((s) => s.selectedRecommendationId)
  const liveVehicleHealth = useSessionStore((s) => s.liveVehicleHealth)
  const category = resolveCategory(liveVehicleHealth?.recommendations, selectedRecommendationId)

  return useQuery({
    queryKey: ['nearbyGarages', category],
    queryFn: () => fetchNearbyGarages(category),
    staleTime: 10 * 60 * 1000,
  })
}
