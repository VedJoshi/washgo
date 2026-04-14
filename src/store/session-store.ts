import { create } from 'zustand'
import { currentUser } from '../lib/mocks/user'

type SessionState = {
  user: typeof currentUser
  activeVehicleId: string
  selectedRecommendationId?: string
  selectedBookingOptionId?: string
  selectedGarageId?: string
  pendingAssistantPrompt?: string
  serviceFinderServiceType: 'car_wash' | 'car_repair'
  setSelectedRecommendationId: (selectedRecommendationId?: string) => void
  setSelectedBookingOptionId: (selectedBookingOptionId?: string) => void
  setSelectedGarageId: (selectedGarageId?: string) => void
  setPendingAssistantPrompt: (pendingAssistantPrompt?: string) => void
  clearPendingAssistantPrompt: () => void
  setServiceFinderServiceType: (serviceFinderServiceType: 'car_wash' | 'car_repair') => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentUser,
  activeVehicleId: 'vehicle-01',
  selectedRecommendationId: 'rec-1',
  selectedBookingOptionId: 'slot-1',
  selectedGarageId: undefined,
  pendingAssistantPrompt: undefined,
  serviceFinderServiceType: 'car_repair',
  setSelectedRecommendationId: (selectedRecommendationId) =>
    set({ selectedRecommendationId, selectedBookingOptionId: undefined }),
  setSelectedBookingOptionId: (selectedBookingOptionId) => set({ selectedBookingOptionId }),
  setSelectedGarageId: (selectedGarageId) => set({ selectedGarageId }),
  setPendingAssistantPrompt: (pendingAssistantPrompt) => set({ pendingAssistantPrompt }),
  clearPendingAssistantPrompt: () => set({ pendingAssistantPrompt: undefined }),
  setServiceFinderServiceType: (serviceFinderServiceType) => set({ serviceFinderServiceType }),
}))
