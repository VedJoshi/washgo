import { useMutation, useQuery } from '@tanstack/react-query'
import { bookingService } from '../../../lib/api/adapters/mock-booking-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'

export function useBookingFlow() {
  const vehicleId = useSessionStore((state) => state.activeVehicleId)
  const selectedRecommendationId = useSessionStore((state) => state.selectedRecommendationId)
  const selectedBookingOptionId = useSessionStore((state) => state.selectedBookingOptionId)
  const setSelectedBookingOptionId = useSessionStore((state) => state.setSelectedBookingOptionId)

  const bookingOptionsQuery = useQuery({
    queryKey: queryKeys.bookingOptions(vehicleId, selectedRecommendationId),
    queryFn: () =>
      bookingService.getBookingOptions({
        vehicleId,
        recommendationId: selectedRecommendationId,
      }),
  })

  const confirmationMutation = useMutation({
    mutationFn: () => {
      if (!selectedBookingOptionId) {
        throw new Error('No booking option selected')
      }

      return bookingService.createBooking({
        vehicleId,
        bookingOptionId: selectedBookingOptionId,
      })
    },
  })

  return {
    bookingOptions: bookingOptionsQuery.data ?? [],
    selectedBookingOptionId,
    selectOption: setSelectedBookingOptionId,
    confirmBooking: () => confirmationMutation.mutate(),
    confirmation: confirmationMutation.data,
    isLoading: bookingOptionsQuery.isLoading,
    isConfirming: confirmationMutation.isPending,
  }
}
