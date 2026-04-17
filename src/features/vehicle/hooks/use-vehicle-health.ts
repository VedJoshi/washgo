import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vehicleService } from '../../../lib/api/adapters/qwen-vehicle-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'

export function useVehicleHealth() {
  const vehicleId = useSessionStore((state) => state.activeVehicleId)
  const setLiveVehicleHealth = useSessionStore((state) => state.setLiveVehicleHealth)

  const query = useQuery({
    queryKey: queryKeys.vehicleHealth(vehicleId),
    queryFn: () => vehicleService.getVehicleHealth(vehicleId),
  })

  useEffect(() => {
    if (query.data) setLiveVehicleHealth(query.data)
  }, [query.data, setLiveVehicleHealth])

  return {
    health: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
