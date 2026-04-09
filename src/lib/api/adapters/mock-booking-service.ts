import { bookingConfirmation, bookingOptions } from '../../mocks/booking'
import { delay } from '../../utils/delay'
import type { BookingService } from '../services/booking-service'

export const bookingService: BookingService = {
  async getBookingOptions() {
    await delay(350)
    return bookingOptions
  },
  async createBooking() {
    await delay(550)
    return bookingConfirmation
  },
}
