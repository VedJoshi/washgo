export const queryKeys = {
  dailyBrief: (userId: string, vehicleId: string) => ['daily-brief', userId, vehicleId] as const,
  vehicle: (userId: string) => ['vehicle', userId] as const,
  vehicleHealth: (vehicleId: string) => ['vehicle-health', vehicleId] as const,
  bookingOptions: (vehicleId: string, recommendationId?: string) =>
    ['booking-options', vehicleId, recommendationId ?? 'default'] as const,
  conversation: (vehicleId: string) => ['conversation', vehicleId] as const,
}
