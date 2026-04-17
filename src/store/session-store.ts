import { create } from 'zustand'
import { currentUser } from '../lib/mocks/user'
import { carHealthRecord } from '../lib/mocks/car-health-record'
import type { DailyBrief, ServiceRecordEntry, VehicleHealth } from '../types/domain'

type SessionState = {
  user: typeof currentUser
  activeVehicleId: string
  cachedDailyBrief?: DailyBrief
  cachedDailyBriefKey?: string
  selectedRecommendationId?: string
  selectedBookingOptionId?: string
  selectedGarageId?: string
  pendingAssistantPrompt?: string
  serviceFinderServiceType: 'car_wash' | 'car_repair'
  carHealthRecordEntries: ServiceRecordEntry[]
  liveVehicleHealth: VehicleHealth | null
  setCachedDailyBrief: (cacheKey: string, brief: DailyBrief) => void
  clearCachedDailyBrief: () => void
  setSelectedRecommendationId: (selectedRecommendationId?: string) => void
  setSelectedBookingOptionId: (selectedBookingOptionId?: string) => void
  setSelectedGarageId: (selectedGarageId?: string) => void
  setPendingAssistantPrompt: (pendingAssistantPrompt?: string) => void
  clearPendingAssistantPrompt: () => void
  setServiceFinderServiceType: (serviceFinderServiceType: 'car_wash' | 'car_repair') => void
  appendCarHealthRecordEntries: (entries: ServiceRecordEntry[]) => void
  setLiveVehicleHealth: (health: VehicleHealth) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentUser,
  activeVehicleId: 'vehicle-01',
  cachedDailyBrief: undefined,
  cachedDailyBriefKey: undefined,
  selectedRecommendationId: 'rec-1',
  selectedBookingOptionId: 'slot-1',
  selectedGarageId: undefined,
  pendingAssistantPrompt: undefined,
  serviceFinderServiceType: 'car_repair',
  carHealthRecordEntries: carHealthRecord.entries,
  liveVehicleHealth: null,
  setCachedDailyBrief: (cacheKey, brief) =>
    set({ cachedDailyBriefKey: cacheKey, cachedDailyBrief: brief }),
  clearCachedDailyBrief: () => set({ cachedDailyBriefKey: undefined, cachedDailyBrief: undefined }),
  setSelectedRecommendationId: (selectedRecommendationId) =>
    set({ selectedRecommendationId, selectedBookingOptionId: undefined }),
  setSelectedBookingOptionId: (selectedBookingOptionId) => set({ selectedBookingOptionId }),
  setSelectedGarageId: (selectedGarageId) => set({ selectedGarageId }),
  setPendingAssistantPrompt: (pendingAssistantPrompt) => set({ pendingAssistantPrompt }),
  clearPendingAssistantPrompt: () => set({ pendingAssistantPrompt: undefined }),
  setServiceFinderServiceType: (serviceFinderServiceType) => set({ serviceFinderServiceType }),
  appendCarHealthRecordEntries: (entries) =>
    set((state) => ({
      carHealthRecordEntries: [
        ...state.carHealthRecordEntries,
        ...entries.filter(
          (entry) =>
            !state.carHealthRecordEntries.some(
              (existing) =>
                existing.date === entry.date &&
                existing.serviceType === entry.serviceType &&
                existing.garageName === entry.garageName,
            ),
        ),
      ],
    })),
  setLiveVehicleHealth: (health) => set({ liveVehicleHealth: health }),
}))
