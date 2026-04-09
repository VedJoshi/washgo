import type { Vehicle, VehicleHealth } from '../../../types/domain'

export interface VehicleService {
  getVehicle(userId: string): Promise<Vehicle>
  getVehicleHealth(vehicleId: string): Promise<VehicleHealth>
}
