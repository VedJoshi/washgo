import { create } from 'zustand'
import { currentUser } from '../lib/mocks/user'
import { carHealthRecord } from '../lib/mocks/car-health-record'
import type { Language } from '../lib/i18n'
import type { DailyBrief, ServiceRecordEntry, VehicleHealth } from '../types/domain'

const UI_LANGUAGE_STORAGE_KEY = 'washgo.uiLanguage'

function getInitialUiLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)
  return stored === 'vi' ? 'vi' : 'en'
}

type SessionState = {
  user: typeof currentUser
  uiLanguage: Language
  activeVehicleId: string
  cachedDailyBrief?: DailyBrief
  cachedDailyBriefKey?: string
  selectedRecommendationId?: string
  selectedBookingOptionId?: string
  selectedGarageId?: string
  pendingAssistantPrompt?: string
  pendingAssistantVoiceCapture: boolean
  serviceFinderServiceType: 'car_wash' | 'car_repair'
  carHealthRecordEntries: ServiceRecordEntry[]
  liveVehicleHealth: VehicleHealth | null
  setUiLanguage: (language: Language) => void
  setCachedDailyBrief: (cacheKey: string, brief: DailyBrief) => void
  clearCachedDailyBrief: () => void
  setSelectedRecommendationId: (selectedRecommendationId?: string) => void
  setSelectedBookingOptionId: (selectedBookingOptionId?: string) => void
  setSelectedGarageId: (selectedGarageId?: string) => void
  setPendingAssistantPrompt: (pendingAssistantPrompt?: string) => void
  clearPendingAssistantPrompt: () => void
  setPendingAssistantVoiceCapture: (pendingAssistantVoiceCapture: boolean) => void
  setServiceFinderServiceType: (serviceFinderServiceType: 'car_wash' | 'car_repair') => void
  appendCarHealthRecordEntries: (entries: ServiceRecordEntry[]) => void
  setLiveVehicleHealth: (health: VehicleHealth) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentUser,
  uiLanguage: getInitialUiLanguage(),
  activeVehicleId: 'vehicle-01',
  cachedDailyBrief: undefined,
  cachedDailyBriefKey: undefined,
  selectedRecommendationId: 'rec-1',
  selectedBookingOptionId: 'slot-1',
  selectedGarageId: undefined,
  pendingAssistantPrompt: undefined,
  pendingAssistantVoiceCapture: false,
  serviceFinderServiceType: 'car_repair',
  carHealthRecordEntries: carHealthRecord.entries,
  liveVehicleHealth: null,
  setUiLanguage: (uiLanguage) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage)
    }
    set({ uiLanguage })
  },
  setCachedDailyBrief: (cacheKey, brief) =>
    set({ cachedDailyBriefKey: cacheKey, cachedDailyBrief: brief }),
  clearCachedDailyBrief: () => set({ cachedDailyBriefKey: undefined, cachedDailyBrief: undefined }),
  setSelectedRecommendationId: (selectedRecommendationId) =>
    set({ selectedRecommendationId, selectedBookingOptionId: undefined }),
  setSelectedBookingOptionId: (selectedBookingOptionId) => set({ selectedBookingOptionId }),
  setSelectedGarageId: (selectedGarageId) => set({ selectedGarageId }),
  setPendingAssistantPrompt: (pendingAssistantPrompt) => set({ pendingAssistantPrompt }),
  clearPendingAssistantPrompt: () => set({ pendingAssistantPrompt: undefined }),
  setPendingAssistantVoiceCapture: (pendingAssistantVoiceCapture) => set({ pendingAssistantVoiceCapture }),
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
