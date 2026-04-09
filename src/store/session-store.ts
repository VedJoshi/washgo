import { create } from 'zustand'
import { currentUser } from '../lib/mocks/user'

type SessionState = {
  user: typeof currentUser
  activeVehicleId: string
  selectedRecommendationId?: string
  selectedBookingOptionId?: string
  setSelectedRecommendationId: (selectedRecommendationId?: string) => void
  setSelectedBookingOptionId: (selectedBookingOptionId?: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentUser,
  activeVehicleId: 'vehicle-01',
  selectedRecommendationId: 'rec-1',
  selectedBookingOptionId: 'slot-1',
  setSelectedRecommendationId: (selectedRecommendationId) =>
    set({ selectedRecommendationId, selectedBookingOptionId: undefined }),
  setSelectedBookingOptionId: (selectedBookingOptionId) => set({ selectedBookingOptionId }),
}))
