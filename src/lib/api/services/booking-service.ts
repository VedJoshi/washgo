import type { BookingConfirmation, BookingOption } from '../../../types/domain'

export interface BookingService {
  getBookingOptions(input: {
    vehicleId: string
    recommendationId?: string
  }): Promise<BookingOption[]>
  createBooking(input: {
    vehicleId: string
    bookingOptionId: string
  }): Promise<BookingConfirmation>
}
