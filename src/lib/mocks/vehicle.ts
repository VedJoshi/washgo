import type { Vehicle } from '../../types/domain'

export const activeVehicle: Vehicle = {
  id: 'vehicle-01',
  nickname: 'Daily Driver',
  make: 'Toyota',
  model: 'Vios',
  year: 2021,
  fuelType: 'gasoline',
  plateNumber: '30F-123.45',
  currentOdometerKm: 38500,
  lastServiceDate: '2026-01-15',
  nextServiceDueKm: 45000,
}
