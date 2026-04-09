import type { BookingConfirmation, BookingOption } from '../../types/domain'

export const bookingOptions: BookingOption[] = [
  {
    id: 'slot-1',
    providerName: 'Tasco Service Hub District 7',
    serviceName: 'Battery and fluid diagnostic',
    slotLabel: 'Today · 4:30 PM',
    priceEstimate: '550,000 VND',
    distanceKm: 3.2,
  },
  {
    id: 'slot-2',
    providerName: 'Tasco Mobility Care Thu Duc',
    serviceName: 'Battery and fluid diagnostic',
    slotLabel: 'Tomorrow · 9:00 AM',
    priceEstimate: '520,000 VND',
    distanceKm: 6.1,
  },
]

export const bookingConfirmation: BookingConfirmation = {
  confirmationCode: 'WG-40291',
  providerName: 'Tasco Service Hub District 7',
  slotLabel: 'Today · 4:30 PM',
}
