import { activeVehicle } from '../mocks/vehicle'
import { vehicleHealth } from '../mocks/recommendations'
import { carHealthRecord } from '../mocks/car-health-record'
import { garages } from '../mocks/garages'
import type { BookingStatus, GarageEntry, ServiceQuote } from '../../types/domain'
import type { ToolDefinition } from './client'

type FindNearbyServicesArgs = {
  serviceType: string
  lat?: number
  lng?: number
  radiusKm?: number
}

const bookingStatusStore = new Map<string, BookingStatus>()

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} VND`
}

function normalizeServiceType(serviceType: string): string {
  if (serviceType === 'car_wash') return 'car_wash'
  if (serviceType === 'car_repair') return 'car_repair'
  return serviceType
}

function mapServiceTypeToPlacesType(serviceType: string): 'car_wash' | 'car_repair' {
  return serviceType === 'car_wash' ? 'car_wash' : 'car_repair'
}

function buildMockServices({ serviceType, lat, lng, radiusKm }: FindNearbyServicesArgs): GarageEntry[] {
  const normalizedType = normalizeServiceType(serviceType)
  const effectiveRadius = typeof radiusKm === 'number' && radiusKm > 0 ? radiusKm : 5

  return garages
    .map((garage) => {
      const distanceKm =
        typeof lat === 'number' && typeof lng === 'number'
          ? haversineKm(lat, lng, garage.lat, garage.lng)
          : garage.distanceKm

      return {
        ...garage,
        distanceKm: Number(distanceKm.toFixed(1)),
      }
    })
    .filter((garage) => {
      const matchesService =
        normalizedType === 'car_repair'
          ? garage.services.includes('diagnostic') || garage.services.includes('battery') || garage.services.includes('oil_change')
          : garage.services.includes(normalizedType)

      return matchesService && garage.distanceKm <= effectiveRadius
    })
    .sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating)
    .slice(0, 5)
}

async function fetchGooglePlacesNearby({ serviceType, lat, lng, radiusKm }: FindNearbyServicesArgs): Promise<GarageEntry[] | null> {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null
  }

  const mapsEnabled = import.meta.env.VITE_MAPS_ENABLED === 'true'
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!mapsEnabled || !mapsApiKey) {
    return null
  }

  const mappedType = mapServiceTypeToPlacesType(normalizeServiceType(serviceType))
  const radiusMeters = Math.round(((typeof radiusKm === 'number' && radiusKm > 0 ? radiusKm : 5) * 1000))
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', String(radiusMeters))
  url.searchParams.set('type', mappedType)
  url.searchParams.set('key', mapsApiKey)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Google Places API error (${response.status})`)
  }

  const data = await response.json()
  if (!Array.isArray(data.results)) {
    return null
  }

  const mapped = data.results
    .map((place: Record<string, unknown>, index: number): GarageEntry | null => {
      const geometry = place.geometry as { location?: { lat?: number; lng?: number } } | undefined
      const placeLat = geometry?.location?.lat
      const placeLng = geometry?.location?.lng
      if (typeof placeLat !== 'number' || typeof placeLng !== 'number') {
        return null
      }

      const distanceKm = haversineKm(lat, lng, placeLat, placeLng)
      const services = mappedType === 'car_wash' ? ['car_wash', 'interior_cleaning'] : ['car_repair', 'diagnostic', 'oil_change']

      return {
        id: String(place.place_id || `place-${index}`),
        name: String(place.name || 'Nearby service'),
        address: String(place.vicinity || place.name || 'Address unavailable'),
        district: 'Nearby',
        city: String(place.vicinity || '').toLowerCase().includes('hanoi') ? 'hanoi' : 'hcmc',
        lat: placeLat,
        lng: placeLng,
        distanceKm: Number(distanceKm.toFixed(1)),
        rating: typeof place.rating === 'number' ? place.rating : 4,
        reviewCount: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : 0,
        priceTier: 'mid',
        services,
        certifications: [],
        openNow: Boolean((place.opening_hours as { open_now?: boolean } | undefined)?.open_now ?? true),
        warrantyDays: mappedType === 'car_wash' ? 14 : 60,
      }
    })
    .filter((item: GarageEntry | null): item is GarageEntry => item !== null)
    .sort((a: GarageEntry, b: GarageEntry) => a.distanceKm - b.distanceKm || b.rating - a.rating)
    .slice(0, 5)

  return mapped
}

export async function findNearbyServices(args: FindNearbyServicesArgs): Promise<GarageEntry[]> {
  try {
    const places = await fetchGooglePlacesNearby(args)
    if (places && places.length > 0) {
      return places
    }
  } catch (error) {
    console.warn('[Qwen Tools] Places lookup failed, falling back to mock services:', error)
  }

  return buildMockServices(args)
}

function buildServiceQuote(garageId: string, serviceType: string): ServiceQuote {
  const garage = garages.find((item) => item.id === garageId)
  const tierMultiplier = garage?.priceTier === 'premium' ? 1.2 : garage?.priceTier === 'budget' ? 0.85 : 1

  const baseCosts: Record<string, number> = {
    car_wash: 180000,
    car_repair: 850000,
    oil_change: 750000,
    battery: 480000,
    tire_rotation: 260000,
    brake_service: 1600000,
    diagnostic: 350000,
  }

  const base = (baseCosts[serviceType] ?? 550000) * tierMultiplier
  const lineItems = [
    { label: `${serviceType.replace('_', ' ')} inspection`, priceVnd: Math.round(base * 0.55) },
    { label: 'Labor and consumables', priceVnd: Math.round(base * 0.45) },
  ]

  return {
    garageId,
    serviceType,
    lineItems,
    totalVnd: lineItems.reduce((sum, item) => sum + item.priceVnd, 0),
    estimatedDurationHours: serviceType === 'car_wash' ? 1 : 2,
    warrantyKm: serviceType === 'car_wash' ? 0 : 5000,
  }
}

function buildToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    findNearbyServices: 'Checking nearby services',
    getVehicleStatus: 'Reading current vehicle status',
    getServiceQuote: 'Calculating service quote',
    bookService: 'Reserving service slot',
    getBookingStatus: 'Checking booking status',
  }

  return labels[toolName] ?? `Running ${toolName}`
}

export function getToolLabel(toolName: string): string {
  return buildToolLabel(toolName)
}

export async function dispatchToolCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (toolName) {
    case 'findNearbyServices': {
      const services = await findNearbyServices({
        serviceType: typeof args.serviceType === 'string' ? args.serviceType : 'car_repair',
        lat: typeof args.lat === 'number' ? args.lat : undefined,
        lng: typeof args.lng === 'number' ? args.lng : undefined,
        radiusKm: typeof args.radiusKm === 'number' ? args.radiusKm : 5,
      })
      return services
    }

    case 'getVehicleStatus':
      return {
        vehicle: activeVehicle,
        health: vehicleHealth,
        recentHistory: carHealthRecord.entries.slice(0, 5),
      }

    case 'getServiceQuote': {
      const garageId = typeof args.garageId === 'string' ? args.garageId : 'garage-01'
      const serviceType = typeof args.serviceType === 'string' ? args.serviceType : 'diagnostic'
      const quote = buildServiceQuote(garageId, serviceType)
      return {
        ...quote,
        totalFormatted: formatVnd(quote.totalVnd),
      }
    }

    case 'bookService': {
      const garageId = typeof args.garageId === 'string' ? args.garageId : 'garage-01'
      const serviceType = typeof args.serviceType === 'string' ? args.serviceType : 'diagnostic'
      const slotLabel = typeof args.slotLabel === 'string' ? args.slotLabel : 'Tomorrow · 9:00 AM'
      const garage = garages.find((item) => item.id === garageId)
      const bookingId = `WG-${Math.floor(10000 + Math.random() * 89999)}`

      bookingStatusStore.set(bookingId, {
        bookingId,
        step: 'confirmed',
        currentStepLabel: 'Confirmed',
        estimatedCompletionTime: slotLabel,
      })

      return {
        bookingId,
        confirmationCode: bookingId,
        providerName: garage?.name ?? 'Tasco Service Hub',
        serviceType,
        slotLabel,
        status: 'confirmed',
      }
    }

    case 'getBookingStatus': {
      const bookingId = typeof args.bookingId === 'string' ? args.bookingId : ''
      return (
        bookingStatusStore.get(bookingId) ?? {
          bookingId,
          step: 'in_progress',
          currentStepLabel: 'Preparing service bay',
          estimatedCompletionTime: 'Today · 6:00 PM',
        }
      )
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

export const findNearbyServicesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findNearbyServices',
    description:
      'Find nearby car service garages and car washes based on location and service type. Returns up to 5 results sorted by distance and rating.',
    parameters: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          description: 'Type of service needed: car_wash, car_repair, oil_change, battery, tire_rotation, brake_service, diagnostic',
          enum: ['car_wash', 'car_repair', 'oil_change', 'battery', 'tire_rotation', 'brake_service', 'diagnostic'],
        },
        lat: {
          type: 'number',
          description: 'User latitude',
        },
        lng: {
          type: 'number',
          description: 'User longitude',
        },
        radiusKm: {
          type: 'number',
          description: 'Search radius in kilometers',
          default: 5,
        },
      },
      required: ['serviceType', 'lat', 'lng'],
    },
  },
}

export const getVehicleStatusTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getVehicleStatus',
    description:
      'Get the current vehicle status including health score, odometer, and last service date.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
}

export const getServiceQuoteTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getServiceQuote',
    description:
      'Get a detailed price quote for a specific service at a specific garage. Returns line items in VND.',
    parameters: {
      type: 'object',
      properties: {
        garageId: {
          type: 'string',
          description: 'ID of the garage',
        },
        serviceType: {
          type: 'string',
          description: 'Type of service to quote',
        },
      },
      required: ['garageId', 'serviceType'],
    },
  },
}

export const bookServiceTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'bookService',
    description:
      'Book a service appointment at a garage. Returns a booking confirmation with confirmation code.',
    parameters: {
      type: 'object',
      properties: {
        garageId: {
          type: 'string',
          description: 'ID of the garage to book at',
        },
        serviceType: {
          type: 'string',
          description: 'Type of service to book',
        },
        slotLabel: {
          type: 'string',
          description: 'Preferred time slot (e.g., "Saturday 9:00 AM")',
        },
      },
      required: ['garageId', 'serviceType', 'slotLabel'],
    },
  },
}

export const getBookingStatusTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getBookingStatus',
    description:
      'Check the current status of a booking by its ID.',
    parameters: {
      type: 'object',
      properties: {
        bookingId: {
          type: 'string',
          description: 'The booking confirmation code',
        },
      },
      required: ['bookingId'],
    },
  },
}

export const allTools: ToolDefinition[] = [
  findNearbyServicesTool,
  getVehicleStatusTool,
  getServiceQuoteTool,
  bookServiceTool,
  getBookingStatusTool,
]
