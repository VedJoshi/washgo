import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth as mockVehicleHealth } from '../../mocks/recommendations'
import { bookingOptions } from '../../mocks/booking'
import { qwenChat } from '../../qwen/client'
import { buildBookingBriefPrompt } from '../../qwen/prompts'
import { useSessionStore } from '../../../store/session-store'
import type { ServiceRecommendation } from '../../../types/domain'

export type BookingBrief = {
  whyNow: string
  mechanicTip: string
  recommendedSlotId: string
  slotReason: string
  estimatedDuration: string
}

const FALLBACKS: Record<string, BookingBrief> = {
  oil: {
    whyNow: 'Oil degrades past the service interval, accelerating engine wear.',
    mechanicTip: 'Ask for 5W-30 fully synthetic oil and a new oil filter.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Same-day slot minimises further engine exposure.',
    estimatedDuration: '30–45 minutes',
  },
  battery: {
    whyNow: 'Short urban trips prevent the battery reaching full charge, compounding strain.',
    mechanicTip: 'Request a full load test, not just a voltage reading.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Closer garage reduces the risk of a dead battery en route.',
    estimatedDuration: '20–30 minutes',
  },
  tires: {
    whyNow: 'Uneven tread wear affects stopping distance and fuel efficiency.',
    mechanicTip: 'Ask for a four-wheel alignment check at the same visit.',
    recommendedSlotId: 'slot-2',
    slotReason: 'Morning slot allows time for a full rotation and alignment.',
    estimatedDuration: '45–60 minutes',
  },
  inspection: {
    whyNow: 'Delaying inspection risks missing faults before they become expensive repairs.',
    mechanicTip: 'Bring a note of any unusual sounds or warning lights you have seen.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Earlier slot gives the mechanic more time for a thorough check.',
    estimatedDuration: '60–90 minutes',
  },
  cleaning: {
    whyNow: 'Accumulated grime accelerates paint and trim deterioration.',
    mechanicTip: 'Ask about an interior detailing package if available.',
    recommendedSlotId: 'slot-2',
    slotReason: 'Morning light is better for inspecting paint finish quality.',
    estimatedDuration: '45–60 minutes',
  },
}

function validateBrief(data: unknown): BookingBrief | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d.whyNow !== 'string') return null
  if (typeof d.mechanicTip !== 'string') return null
  if (typeof d.recommendedSlotId !== 'string') return null
  if (typeof d.slotReason !== 'string') return null
  if (typeof d.estimatedDuration !== 'string') return null
  return d as BookingBrief
}

export async function fetchBookingBrief(recommendation: ServiceRecommendation): Promise<BookingBrief> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY
  const fallback = FALLBACKS[recommendation.category] ?? FALLBACKS.inspection

  if (!apiKey) return fallback

  const health = useSessionStore.getState().liveVehicleHealth ?? mockVehicleHealth

  const prompt = buildBookingBriefPrompt(
    recommendation,
    activeVehicle,
    health.score,
    bookingOptions,
  )

  try {
    const response = await qwenChat(
      [
        { role: 'system' as const, content: 'You are a car service advisor. Return valid JSON only.' },
        { role: 'user' as const, content: prompt },
      ],
      {
        model: import.meta.env.VITE_QWEN_FAST_MODEL || 'qwen-plus',
        jsonMode: true,
        temperature: 0.3,
      },
    )
    if (response.kind !== 'content') return fallback
    const parsed: unknown = JSON.parse(response.content)
    return validateBrief(parsed) ?? fallback
  } catch {
    return fallback
  }
}
