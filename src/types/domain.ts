export type UserProfile = {
  id: string
  name: string
  city: string
  memberTier: 'standard' | 'premium'
}

export type Vehicle = {
  id: string
  nickname: string
  make: string
  model: string
  year: number
  fuelType: 'gasoline' | 'hybrid' | 'ev'
  plateNumber: string
  currentOdometerKm: number
  lastServiceDate: string
  nextServiceDueKm: number
}

export type DriverAlert = {
  id: string
  type: 'maintenance' | 'traffic' | 'parking' | 'toll'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

export type QuickAction = {
  id: string
  label: string
  href: '/' | '/vehicle' | '/booking' | '/assistant'
}

export type DailyBrief = {
  greeting: string
  summary: string
  alerts: DriverAlert[]
  suggestedActions: QuickAction[]
}

export type ServiceRecommendation = {
  id: string
  category: 'oil' | 'tires' | 'battery' | 'inspection' | 'cleaning'
  title: string
  description: string
  issue: string
  impact: string
  actionLabel: string
  urgency: 'low' | 'medium' | 'high'
  estimatedPriceRange: string
  recommendedWithinDays: number
}

export type VehicleHealth = {
  vehicleId: string
  score: number
  status: 'good' | 'watch' | 'needs_service'
  issues: string[]
  recommendations: ServiceRecommendation[]
}

export type BookingOption = {
  id: string
  providerName: string
  serviceName: string
  slotLabel: string
  priceEstimate: string
  distanceKm: number
}

export type BookingConfirmation = {
  confirmationCode: string
  providerName: string
  slotLabel: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type AssistantReply = {
  message: ChatMessage
  followUpSuggestions: string[]
}
