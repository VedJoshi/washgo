import { dashboardBrief } from '../../mocks/dashboard'
import { delay } from '../../utils/delay'
import type { DashboardService } from '../services/dashboard-service'

export const dashboardService: DashboardService = {
  async getDailyBrief() {
    await delay(300)
    return dashboardBrief
  },
}
