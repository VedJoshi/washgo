import { EmptyState } from '../components/ui/empty-state'
import { Spinner } from '../components/ui/spinner'
import { BookingConfirmation } from '../features/booking/components/booking-confirmation'
import { BookingOptionsList } from '../features/booking/components/booking-options-list'
import { useBookingFlow } from '../features/booking/hooks/use-booking-flow'

export function BookingPage() {
  const {
    bookingOptions,
    confirmation,
    isLoading,
    isConfirming,
    selectOption,
    confirmBooking,
    selectedBookingOptionId,
  } = useBookingFlow()

  if (isLoading) {
    return <Spinner label="Finding nearby service slots..." />
  }

  if (!bookingOptions.length && !confirmation) {
    return (
      <EmptyState
        title="No slots available"
        description="Try picking another recommendation from the vehicle insight page."
      />
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {confirmation ? (
        <BookingConfirmation confirmation={confirmation} />
      ) : (
        <BookingOptionsList
          bookingOptions={bookingOptions}
          isConfirming={isConfirming}
          onConfirm={confirmBooking}
          onSelect={selectOption}
          selectedBookingOptionId={selectedBookingOptionId}
        />
      )}
    </div>
  )
}
