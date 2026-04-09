import { vehicleHealth } from '../../mocks/recommendations'
import { activeVehicle } from '../../mocks/vehicle'
import { delay } from '../../utils/delay'
import type { VehicleService } from '../services/vehicle-service'

export const vehicleService: VehicleService = {
  async getVehicle() {
    await delay(260)
    return activeVehicle
  },
  async getVehicleHealth() {
    await delay(320)
    return vehicleHealth
  },
}
