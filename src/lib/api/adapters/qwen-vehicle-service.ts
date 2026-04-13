import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth as mockVehicleHealth } from '../../mocks/recommendations'
import { carHealthRecord } from '../../mocks/car-health-record'
import { delay } from '../../utils/delay'
import { qwenChat } from '../../qwen/client'
import { buildVehicleHealthPrompt } from '../../qwen/prompts'
import type { VehicleService } from '../services/vehicle-service'
import type { VehicleHealth } from '../../../types/domain'

function validateVehicleHealth(data: unknown): VehicleHealth | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  if (typeof obj.vehicleId !== 'string') return null
  if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 100) return null
  if (!['good', 'watch', 'needs_service'].includes(obj.status as string)) return null
  if (!Array.isArray(obj.issues)) return null
  if (!Array.isArray(obj.recommendations)) return null

  for (const rec of obj.recommendations) {
    if (typeof rec !== 'object' || rec === null) return null
    const r = rec as Record<string, unknown>
    if (typeof r.id !== 'string') return null
    if (typeof r.title !== 'string') return null
    if (typeof r.description !== 'string') return null
    if (typeof r.issue !== 'string') return null
    if (typeof r.impact !== 'string') return null
    if (typeof r.actionLabel !== 'string') return null
    if (!['low', 'medium', 'high'].includes(r.urgency as string)) return null
    if (typeof r.estimatedPriceRange !== 'string') return null
    if (typeof r.recommendedWithinDays !== 'number') return null
  }

  return obj as unknown as VehicleHealth
}

async function fetchVehicleHealthFromQwen(_vehicleId: string): Promise<VehicleHealth> {
  const vehicle = activeVehicle
  const healthRecord = carHealthRecord

  const prompt = buildVehicleHealthPrompt(vehicle, healthRecord)

  const messages = [
    { role: 'system' as const, content: 'You are an expert automotive diagnostic assistant. Always respond with valid JSON only.' },
    { role: 'user' as const, content: prompt },
  ]

  const model = import.meta.env.VITE_QWEN_FAST_MODEL || 'qwen-plus'
  const response = await qwenChat(messages, {
    model,
    jsonMode: true,
    temperature: 0.3,
  })

  if (response.kind !== 'content') {
    throw new Error('Unexpected tool_calls response from vehicle health prompt')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(response.content)
  } catch {
    throw new Error('Qwen returned invalid JSON')
  }

  const validated = validateVehicleHealth(parsed)
  if (!validated) {
    throw new Error('Qwen response failed validation')
  }

  return validated
}

export const vehicleService: VehicleService = {
  async getVehicle() {
    await delay(260)
    return activeVehicle
  },

  async getVehicleHealth(vehicleId: string) {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY

    if (!apiKey) {
      console.log('[Qwen Vehicle] No API key — falling back to mock')
      await delay(320)
      return mockVehicleHealth
    }

    try {
      const health = await fetchVehicleHealthFromQwen(vehicleId)
      return health
    } catch (error) {
      console.warn('[Qwen Vehicle] API call failed, falling back to mock:', error)
      await delay(320)
      return mockVehicleHealth
    }
  },
}
