import type { DailyBrief } from '../../../types/domain'

export interface DashboardService {
  getDailyBrief(userId: string, vehicleId: string): Promise<DailyBrief>
}
