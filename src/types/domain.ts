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
  href: '/' | '/vehicle' | '/booking' | '/assistant' | '/lens' | '/history' | '/telemetry'
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

export type GarageEntry = {
  id: string
  name: string
  address: string
  district: string
  city: 'hanoi' | 'hcmc'
  lat: number
  lng: number
  distanceKm: number
  rating: number
  reviewCount: number
  priceTier: 'budget' | 'mid' | 'premium'
  services: string[]
  certifications: string[]
  openNow: boolean
  warrantyDays: number
}

export type ServiceQuote = {
  garageId: string
  serviceType: string
  lineItems: { label: string; priceVnd: number }[]
  totalVnd: number
  estimatedDurationHours: number
  warrantyKm: number
}

export type BookingStatus = {
  bookingId: string
  step: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  currentStepLabel: string
  estimatedCompletionTime: string
}

export type ETCActivity = {
  date: string
  tollStation: string
  amountVnd: number
  direction: string
}

export type ETCWallet = {
  balanceVnd: number
  recentActivity: ETCActivity[]
}

export type ServiceRecordEntry = {
  id: string
  date: string
  odometerKm: number
  serviceType: string
  garageId: string
  garageName: string
  costVnd: number
  partsReplaced: string[]
  warrantyExpiryDate: string | null
  notes: string
  source: 'manual' | 'lens_extracted' | 'booking'
}

export type CarHealthRecord = {
  vehicleId: string
  entries: ServiceRecordEntry[]
  totalSpentVnd: number
  lastServiceDate: string
  nextDueDate: string | null
}

export type WarningLightResult = {
  symbolName: string
  explanation: string
  urgency: 'immediate' | 'soon' | 'monitor'
  recommendedAction: string
  suggestedServiceType: string
}

export type ServiceRecordExtraction = {
  entries: ServiceRecordEntry[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

export type TelemetryReading = {
  id: string
  vehicleId: string
  loggedAt: string
  fuelLevelPct: number | null
  tyrePressurePsi: {
    frontLeft: number | null
    frontRight: number | null
    rearLeft: number | null
    rearRight: number | null
  }
  oilLevelPct: number | null
  coolantLevelPct: number | null
  batteryVoltage: number | null
  notes: string
}

export type TelemetryAnalysis = {
  summary: string
  predictions: { label: string; detail: string }[]
  alerts: { metric: string; message: string; severity: 'low' | 'medium' | 'high' }[]
  bookingCta: { show: boolean; serviceType: string; reason: string }
}

export type ToolCall = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export type ToolResult = {
  toolCallId: string
  name: string
  content: string
}
