# Qwen Data Flow Fix + Booking Intelligence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the live Qwen vehicle health result across all features, and add a Qwen service brief card + SerpAPI nearby garage finder to the Booking page.

**Architecture:** Session store gains `liveVehicleHealth`; the Vehicle health hook writes into it on success; the dashboard and assistant adapters read from it instead of the mock. The Booking page gains two new cards rendered in the slots tab: `BookingServiceBriefCard` (Qwen brief, above slot list) and `NearbyGaragesCard` (SerpAPI, below slot list). A Vercel Edge Function at `api/garages.ts` proxies SerpAPI server-side so the key is never exposed.

**Tech Stack:** React 19, Zustand, TanStack Query, Vite/TypeScript, Tailwind, Vercel Edge Functions, SerpAPI `google_local` engine

---

## File Map

| Action | File |
|--------|------|
| modify | `src/types/domain.ts` |
| modify | `src/store/session-store.ts` |
| modify | `src/features/vehicle/hooks/use-vehicle-health.ts` |
| modify | `src/lib/api/adapters/qwen-dashboard-service.ts` |
| modify | `src/lib/api/adapters/qwen-assistant-service.ts` |
| modify | `src/lib/qwen/prompts.ts` |
| modify | `src/pages/booking-page.tsx` |
| create | `src/lib/api/adapters/qwen-booking-service.ts` |
| create | `src/features/booking/hooks/use-booking-brief.ts` |
| create | `src/features/booking/components/booking-service-brief-card.tsx` |
| create | `src/lib/api/adapters/serpapi-garage-service.ts` |
| create | `src/features/booking/hooks/use-nearby-garages.ts` |
| create | `src/features/booking/components/nearby-garages-card.tsx` |
| create | `api/garages.ts` |

---

## Task 1: Add NearbyGarage type to domain.ts

**Files:**
- Modify: `src/types/domain.ts`

- [ ] Append to the end of `src/types/domain.ts`:

```typescript
export type NearbyGarage = {
  name: string
  address: string
  phone?: string
  rating?: number
  mapsUrl?: string
}
```

- [ ] Commit:
```bash
git add src/types/domain.ts
git commit -m "feat: add NearbyGarage type"
```

---

## Task 2: Add liveVehicleHealth to session store

**Files:**
- Modify: `src/store/session-store.ts`

- [ ] Replace the full contents of `src/store/session-store.ts` with:

```typescript
import { create } from 'zustand'
import { currentUser } from '../lib/mocks/user'
import { carHealthRecord } from '../lib/mocks/car-health-record'
import type { DailyBrief, ServiceRecordEntry, VehicleHealth } from '../types/domain'

type SessionState = {
  user: typeof currentUser
  activeVehicleId: string
  cachedDailyBrief?: DailyBrief
  cachedDailyBriefKey?: string
  selectedRecommendationId?: string
  selectedBookingOptionId?: string
  selectedGarageId?: string
  pendingAssistantPrompt?: string
  serviceFinderServiceType: 'car_wash' | 'car_repair'
  carHealthRecordEntries: ServiceRecordEntry[]
  liveVehicleHealth: VehicleHealth | null
  setCachedDailyBrief: (cacheKey: string, brief: DailyBrief) => void
  clearCachedDailyBrief: () => void
  setSelectedRecommendationId: (selectedRecommendationId?: string) => void
  setSelectedBookingOptionId: (selectedBookingOptionId?: string) => void
  setSelectedGarageId: (selectedGarageId?: string) => void
  setPendingAssistantPrompt: (pendingAssistantPrompt?: string) => void
  clearPendingAssistantPrompt: () => void
  setServiceFinderServiceType: (serviceFinderServiceType: 'car_wash' | 'car_repair') => void
  appendCarHealthRecordEntries: (entries: ServiceRecordEntry[]) => void
  setLiveVehicleHealth: (health: VehicleHealth) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentUser,
  activeVehicleId: 'vehicle-01',
  cachedDailyBrief: undefined,
  cachedDailyBriefKey: undefined,
  selectedRecommendationId: 'rec-1',
  selectedBookingOptionId: 'slot-1',
  selectedGarageId: undefined,
  pendingAssistantPrompt: undefined,
  serviceFinderServiceType: 'car_repair',
  carHealthRecordEntries: carHealthRecord.entries,
  liveVehicleHealth: null,
  setCachedDailyBrief: (cacheKey, brief) =>
    set({ cachedDailyBriefKey: cacheKey, cachedDailyBrief: brief }),
  clearCachedDailyBrief: () => set({ cachedDailyBriefKey: undefined, cachedDailyBrief: undefined }),
  setSelectedRecommendationId: (selectedRecommendationId) =>
    set({ selectedRecommendationId, selectedBookingOptionId: undefined }),
  setSelectedBookingOptionId: (selectedBookingOptionId) => set({ selectedBookingOptionId }),
  setSelectedGarageId: (selectedGarageId) => set({ selectedGarageId }),
  setPendingAssistantPrompt: (pendingAssistantPrompt) => set({ pendingAssistantPrompt }),
  clearPendingAssistantPrompt: () => set({ pendingAssistantPrompt: undefined }),
  setServiceFinderServiceType: (serviceFinderServiceType) => set({ serviceFinderServiceType }),
  appendCarHealthRecordEntries: (entries) =>
    set((state) => ({
      carHealthRecordEntries: [
        ...state.carHealthRecordEntries,
        ...entries.filter(
          (entry) =>
            !state.carHealthRecordEntries.some(
              (existing) =>
                existing.date === entry.date &&
                existing.serviceType === entry.serviceType &&
                existing.garageName === entry.garageName,
            ),
        ),
      ],
    })),
  setLiveVehicleHealth: (health) => set({ liveVehicleHealth: health }),
}))
```

- [ ] Commit:
```bash
git add src/store/session-store.ts
git commit -m "feat: add liveVehicleHealth to session store"
```

---

## Task 3: Write live health into store from use-vehicle-health

**Files:**
- Modify: `src/features/vehicle/hooks/use-vehicle-health.ts`

- [ ] Replace the full contents with:

```typescript
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vehicleService } from '../../../lib/api/adapters/qwen-vehicle-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'

export function useVehicleHealth() {
  const vehicleId = useSessionStore((state) => state.activeVehicleId)
  const setLiveVehicleHealth = useSessionStore((state) => state.setLiveVehicleHealth)

  const query = useQuery({
    queryKey: queryKeys.vehicleHealth(vehicleId),
    queryFn: () => vehicleService.getVehicleHealth(vehicleId),
  })

  useEffect(() => {
    if (query.data) setLiveVehicleHealth(query.data)
  }, [query.data, setLiveVehicleHealth])

  return {
    health: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
```

- [ ] Commit:
```bash
git add src/features/vehicle/hooks/use-vehicle-health.ts
git commit -m "feat: write Qwen vehicle health into session store"
```

---

## Task 4: Fix qwen-dashboard-service to read live health

**Files:**
- Modify: `src/lib/api/adapters/qwen-dashboard-service.ts`

- [ ] Add the session store import after the existing imports (after line 5):

```typescript
import { useSessionStore } from '../../../store/session-store'
```

- [ ] Replace the `vehicleHealth,` argument on line 73 (inside `fetchMorningBriefFromQwen`) — the call to `buildMorningBriefPrompt`:

Old:
```typescript
  const prompt = buildMorningBriefPrompt(
    dateLabel,
    dayOfWeek,
    activeVehicle,
    vehicleHealth,
    etcWallet,
    nextServiceDue,
  )
```

New:
```typescript
  const liveHealth = useSessionStore.getState().liveVehicleHealth ?? vehicleHealth
  const prompt = buildMorningBriefPrompt(
    dateLabel,
    dayOfWeek,
    activeVehicle,
    liveHealth,
    etcWallet,
    nextServiceDue,
  )
```

- [ ] Commit:
```bash
git add src/lib/api/adapters/qwen-dashboard-service.ts
git commit -m "feat: morning brief uses live Qwen health from session store"
```

---

## Task 5: Fix qwen-assistant-service to read live health (two call sites)

**Files:**
- Modify: `src/lib/api/adapters/qwen-assistant-service.ts`

The `useSessionStore` import is already present on line 12. `vehicleHealth` is used twice: line 175 and line 240.

- [ ] Replace the first call site (non-streaming, around line 173):

Old:
```typescript
    const systemPrompt = buildAssistantSystemPrompt(
      activeVehicle,
      vehicleHealth,
      liveHealthRecord,
```

New:
```typescript
    const liveHealth = useSessionStore.getState().liveVehicleHealth ?? vehicleHealth
    const systemPrompt = buildAssistantSystemPrompt(
      activeVehicle,
      liveHealth,
      liveHealthRecord,
```

- [ ] Replace the second call site (streaming, around line 238):

Old:
```typescript
  const systemPrompt = buildAssistantSystemPrompt(
    activeVehicle,
    vehicleHealth,
    liveHealthRecord,
```

New:
```typescript
  const liveHealth = useSessionStore.getState().liveVehicleHealth ?? vehicleHealth
  const systemPrompt = buildAssistantSystemPrompt(
    activeVehicle,
    liveHealth,
    liveHealthRecord,
```

- [ ] Commit:
```bash
git add src/lib/api/adapters/qwen-assistant-service.ts
git commit -m "feat: assistant system prompt uses live Qwen health from session store"
```

---

## Task 6: Add buildBookingBriefPrompt to prompts.ts

**Files:**
- Modify: `src/lib/qwen/prompts.ts`

- [ ] Append this function to the end of `src/lib/qwen/prompts.ts`:

```typescript
export function buildBookingBriefPrompt(
  recommendation: {
    title: string
    issue: string
    urgency: string
    estimatedPriceRange: string
    recommendedWithinDays: number
    category: string
  },
  vehicle: { make: string; model: string; currentOdometerKm: number },
  healthScore: number,
  slots: Array<{ id: string; providerName: string; slotLabel: string; priceEstimate: string; distanceKm: number }>,
): string {
  const slotLines = slots
    .map((s) => `- id: "${s.id}", "${s.slotLabel}" at ${s.providerName}, ${s.priceEstimate}, ${s.distanceKm} km away`)
    .join('\n')

  return `You are a car service advisor for a Vietnamese car owner.

Vehicle: ${vehicle.make} ${vehicle.model} at ${vehicle.currentOdometerKm.toLocaleString()} km
Health score: ${healthScore}/100
Service needed: ${recommendation.title} (urgency: ${recommendation.urgency})
Issue: ${recommendation.issue}
Estimated price: ${recommendation.estimatedPriceRange}
Should be done within: ${recommendation.recommendedWithinDays} days

Available booking slots:
${slotLines}

Return a JSON object with exactly these five fields:
{
  "whyNow": "one sentence explaining urgency specific to this vehicle's mileage and issue",
  "mechanicTip": "one sentence on what to tell or ask the mechanic",
  "recommendedSlotId": "the id string of the better slot",
  "slotReason": "one sentence explaining why that slot is better for this service",
  "estimatedDuration": "estimated service time e.g. '30–45 minutes'"
}`
}
```

- [ ] Commit:
```bash
git add src/lib/qwen/prompts.ts
git commit -m "feat: add buildBookingBriefPrompt"
```

---

## Task 7: Create qwen-booking-service.ts

**Files:**
- Create: `src/lib/api/adapters/qwen-booking-service.ts`

- [ ] Create the file:

```typescript
import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth as mockVehicleHealth } from '../../mocks/recommendations'
import { bookingOptions } from '../../mocks/booking'
import { qwenChat } from '../../qwen/client'
import { buildBookingBriefPrompt } from '../../qwen/prompts'
import { useSessionStore } from '../../../store/session-store'
import type { ServiceRecommendation } from '../../../types/domain'

export type BookingBrief = {
  whyNow: string
  mechanicTip: string
  recommendedSlotId: string
  slotReason: string
  estimatedDuration: string
}

const FALLBACKS: Record<string, BookingBrief> = {
  oil: {
    whyNow: 'Oil degrades past the service interval, accelerating engine wear.',
    mechanicTip: 'Ask for 5W-30 fully synthetic oil and a new oil filter.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Same-day slot minimises further engine exposure.',
    estimatedDuration: '30–45 minutes',
  },
  battery: {
    whyNow: 'Short urban trips prevent the battery reaching full charge, compounding strain.',
    mechanicTip: 'Request a full load test, not just a voltage reading.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Closer garage reduces the risk of a dead battery en route.',
    estimatedDuration: '20–30 minutes',
  },
  tires: {
    whyNow: 'Uneven tread wear affects stopping distance and fuel efficiency.',
    mechanicTip: 'Ask for a four-wheel alignment check at the same visit.',
    recommendedSlotId: 'slot-2',
    slotReason: 'Morning slot allows time for a full rotation and alignment.',
    estimatedDuration: '45–60 minutes',
  },
  inspection: {
    whyNow: 'Delaying inspection risks missing faults before they become expensive repairs.',
    mechanicTip: 'Bring a note of any unusual sounds or warning lights you have seen.',
    recommendedSlotId: 'slot-1',
    slotReason: 'Earlier slot gives the mechanic more time for a thorough check.',
    estimatedDuration: '60–90 minutes',
  },
  cleaning: {
    whyNow: 'Accumulated grime accelerates paint and trim deterioration.',
    mechanicTip: 'Ask about an interior detailing package if available.',
    recommendedSlotId: 'slot-2',
    slotReason: 'Morning light is better for inspecting paint finish quality.',
    estimatedDuration: '45–60 minutes',
  },
}

function validateBrief(data: unknown): BookingBrief | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d.whyNow !== 'string') return null
  if (typeof d.mechanicTip !== 'string') return null
  if (typeof d.recommendedSlotId !== 'string') return null
  if (typeof d.slotReason !== 'string') return null
  if (typeof d.estimatedDuration !== 'string') return null
  return d as BookingBrief
}

export async function fetchBookingBrief(recommendation: ServiceRecommendation): Promise<BookingBrief> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY
  const fallback = FALLBACKS[recommendation.category] ?? FALLBACKS.inspection

  if (!apiKey) return fallback

  const health = useSessionStore.getState().liveVehicleHealth ?? mockVehicleHealth

  const prompt = buildBookingBriefPrompt(
    recommendation,
    activeVehicle,
    health.score,
    bookingOptions,
  )

  try {
    const response = await qwenChat(
      [
        { role: 'system' as const, content: 'You are a car service advisor. Return valid JSON only.' },
        { role: 'user' as const, content: prompt },
      ],
      {
        model: import.meta.env.VITE_QWEN_FAST_MODEL || 'qwen-plus',
        jsonMode: true,
        temperature: 0.3,
      },
    )
    if (response.kind !== 'content') return fallback
    const parsed: unknown = JSON.parse(response.content)
    return validateBrief(parsed) ?? fallback
  } catch {
    return fallback
  }
}
```

- [ ] Commit:
```bash
git add src/lib/api/adapters/qwen-booking-service.ts
git commit -m "feat: add qwen-booking-service with brief + fallbacks"
```

---

## Task 8: Create use-booking-brief.ts hook

**Files:**
- Create: `src/features/booking/hooks/use-booking-brief.ts`

- [ ] Create the file:

```typescript
import { useEffect, useState } from 'react'
import { fetchBookingBrief } from '../../../lib/api/adapters/qwen-booking-service'
import type { BookingBrief } from '../../../lib/api/adapters/qwen-booking-service'
import type { ServiceRecommendation } from '../../../types/domain'

export function useBookingBrief(recommendation: ServiceRecommendation | undefined) {
  const [brief, setBrief] = useState<BookingBrief | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!recommendation) return
    setIsLoading(true)
    setBrief(null)
    fetchBookingBrief(recommendation)
      .then(setBrief)
      .finally(() => setIsLoading(false))
  }, [recommendation?.id])

  return { brief, isLoading }
}
```

- [ ] Commit:
```bash
git add src/features/booking/hooks/use-booking-brief.ts
git commit -m "feat: add useBookingBrief hook"
```

---

## Task 9: Create BookingServiceBriefCard component

**Files:**
- Create: `src/features/booking/components/booking-service-brief-card.tsx`

- [ ] Create the file:

```typescript
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { bookingOptions } from '../../../lib/mocks/booking'
import { useBookingBrief } from '../hooks/use-booking-brief'
import type { ServiceRecommendation } from '../../../types/domain'

export function BookingServiceBriefCard({ recommendation }: { recommendation: ServiceRecommendation | undefined }) {
  const { brief, isLoading } = useBookingBrief(recommendation)

  if (!recommendation) return null

  if (isLoading) {
    return (
      <Card className="space-y-3 border-none bg-[linear-gradient(180deg,_rgba(244,239,230,1)_0%,_rgba(255,252,248,1)_100%)]">
        <div className="h-5 w-36 animate-pulse rounded-full bg-ink/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[18px] bg-ink/6" />
          ))}
        </div>
      </Card>
    )
  }

  if (!brief) return null

  const recommendedSlot = bookingOptions.find((s) => s.id === brief.recommendedSlotId)

  return (
    <Card className="border-none bg-[linear-gradient(180deg,_rgba(244,239,230,1)_0%,_rgba(255,252,248,1)_100%)]">
      <div className="mb-4">
        <Badge tone="warn">Qwen service brief</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">Why now</p>
          <p className="mt-2 text-sm leading-6 text-ink">{brief.whyNow}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">Tell your mechanic</p>
          <p className="mt-2 text-sm leading-6 text-ink">{brief.mechanicTip}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">Recommended slot</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {recommendedSlot?.slotLabel ?? brief.recommendedSlotId}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/60">{brief.slotReason}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">Estimated time</p>
          <p className="mt-2 text-sm font-semibold text-ink">{brief.estimatedDuration}</p>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] Commit:
```bash
git add src/features/booking/components/booking-service-brief-card.tsx
git commit -m "feat: add BookingServiceBriefCard component"
```

---

## Task 10: Create Vercel Edge Function api/garages.ts

**Files:**
- Create: `api/garages.ts`

- [ ] Create the file:

```typescript
export const config = { runtime: 'edge' }

interface SerpLocalResult {
  title: string
  address?: string
  phone?: string
  rating?: number
  links?: { directions?: string }
  gps_coordinates?: { latitude: number; longitude: number }
}

interface SerpApiResponse {
  local_results?: SerpLocalResult[]
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? 'Tasco service center'
  const location = searchParams.get('location') ?? 'Ho Chi Minh City, Vietnam'
  const apiKey = process.env.SERPAPI_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ garages: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine', 'google_local')
  url.searchParams.set('q', q)
  url.searchParams.set('location', location)
  url.searchParams.set('gl', 'vn')
  url.searchParams.set('hl', 'en')
  url.searchParams.set('num', '5')
  url.searchParams.set('api_key', apiKey)

  const response = await fetch(url.toString())
  const data = (await response.json()) as SerpApiResponse

  const garages = (data.local_results ?? []).map((r) => ({
    name: r.title,
    address: r.address ?? '',
    phone: r.phone,
    rating: r.rating,
    mapsUrl:
      r.links?.directions ??
      (r.gps_coordinates
        ? `https://www.google.com/maps/search/?api=1&query=${r.gps_coordinates.latitude},${r.gps_coordinates.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.title + ' Ho Chi Minh City')}`),
  }))

  return new Response(JSON.stringify({ garages }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] Commit:
```bash
git add api/garages.ts
git commit -m "feat: add SerpAPI proxy Vercel Edge Function"
```

---

## Task 11: Create serpapi-garage-service.ts

**Files:**
- Create: `src/lib/api/adapters/serpapi-garage-service.ts`

- [ ] Create the file:

```typescript
import type { NearbyGarage } from '../../../types/domain'

const MOCK_GARAGES: NearbyGarage[] = [
  {
    name: 'Tasco Service Hub District 1',
    address: '123 Le Loi Street, Ben Nghe Ward, District 1, HCMC',
    phone: '+84 28 3822 1234',
    rating: 4.7,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tasco+Service+Hub+District+1+Ho+Chi+Minh+City',
  },
  {
    name: 'Tasco Mobility Care Thu Duc',
    address: '45 Vo Van Ngan Street, Linh Chieu Ward, Thu Duc City, HCMC',
    phone: '+84 28 3896 5678',
    rating: 4.5,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tasco+Mobility+Care+Thu+Duc+Ho+Chi+Minh+City',
  },
  {
    name: 'WurthGO Auto Center District 7',
    address: '88 Nguyen Thi Thap Street, Tan Phong Ward, District 7, HCMC',
    phone: '+84 28 5412 9900',
    rating: 4.8,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=WurthGO+Auto+Center+District+7+Ho+Chi+Minh+City',
  },
]

const SERVICE_LABEL: Record<string, string> = {
  oil: 'oil change',
  battery: 'battery diagnostic',
  tires: 'tire rotation alignment',
  inspection: 'vehicle inspection',
  cleaning: 'car wash detailing',
}

export async function fetchNearbyGarages(category: string): Promise<NearbyGarage[]> {
  if (import.meta.env.DEV) return MOCK_GARAGES

  const label = SERVICE_LABEL[category] ?? 'auto service'

  try {
    const res = await fetch(
      `/api/garages?q=${encodeURIComponent('Tasco ' + label)}&location=Ho+Chi+Minh+City,Vietnam`,
    )
    if (!res.ok) return MOCK_GARAGES
    const data = (await res.json()) as { garages?: NearbyGarage[] }
    return data.garages?.length ? data.garages : MOCK_GARAGES
  } catch {
    return MOCK_GARAGES
  }
}
```

- [ ] Commit:
```bash
git add src/lib/api/adapters/serpapi-garage-service.ts
git commit -m "feat: add serpapi-garage-service with dev fallback"
```

---

## Task 12: Create use-nearby-garages.ts hook

**Files:**
- Create: `src/features/booking/hooks/use-nearby-garages.ts`

- [ ] Create the file:

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchNearbyGarages } from '../../../lib/api/adapters/serpapi-garage-service'
import { useSessionStore } from '../../../store/session-store'
import { vehicleHealth as mockVehicleHealth } from '../../../lib/mocks/recommendations'

function resolveCategory(
  liveRecs: Array<{ id: string; category: string }> | undefined,
  selectedId: string | undefined,
): string {
  if (!selectedId || !liveRecs) return mockVehicleHealth.recommendations[0]?.category ?? 'oil'
  return liveRecs.find((r) => r.id === selectedId)?.category
    ?? liveRecs[0]?.category
    ?? 'oil'
}

export function useNearbyGarages() {
  const selectedRecommendationId = useSessionStore((s) => s.selectedRecommendationId)
  const liveVehicleHealth = useSessionStore((s) => s.liveVehicleHealth)
  const category = resolveCategory(liveVehicleHealth?.recommendations, selectedRecommendationId)

  return useQuery({
    queryKey: ['nearbyGarages', category],
    queryFn: () => fetchNearbyGarages(category),
    staleTime: 10 * 60 * 1000,
  })
}
```

- [ ] Commit:
```bash
git add src/features/booking/hooks/use-nearby-garages.ts
git commit -m "feat: add useNearbyGarages hook"
```

---

## Task 13: Create NearbyGaragesCard component

**Files:**
- Create: `src/features/booking/components/nearby-garages-card.tsx`

- [ ] Create the file:

```typescript
import { MapPin, Phone, ExternalLink } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { useNearbyGarages } from '../hooks/use-nearby-garages'

export function NearbyGaragesCard() {
  const { data: garages, isLoading } = useNearbyGarages()

  if (isLoading) {
    return (
      <Card className="space-y-3">
        <div className="h-4 w-44 animate-pulse rounded-full bg-ink/10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[18px] bg-ink/6" />
        ))}
      </Card>
    )
  }

  if (!garages?.length) return null

  return (
    <Card>
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">Find a garage</p>
        <p className="mt-1 font-display text-[1.6rem] leading-tight">Nearby Tasco garages</p>
        <p className="mt-1 text-sm text-ink/60">Contact directly to confirm availability</p>
      </div>
      <div className="space-y-3">
        {garages.map((garage, i) => (
          <div key={i} className="rounded-[18px] border border-ink/8 bg-sand/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-ink">{garage.name}</p>
                {garage.rating != null ? (
                  <p className="mt-0.5 text-xs text-amber-500">{'★'.repeat(Math.round(garage.rating))} {garage.rating.toFixed(1)}</p>
                ) : null}
                <div className="mt-2 flex items-start gap-1.5 text-sm text-ink/65">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40" />
                  <span>{garage.address}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {garage.phone ? (
                <a
                  href={`tel:${garage.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
                >
                  <Phone className="h-3 w-3" />
                  {garage.phone}
                </a>
              ) : null}
              {garage.mapsUrl ? (
                <a
                  href={garage.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
                >
                  <ExternalLink className="h-3 w-3" />
                  Directions
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

- [ ] Commit:
```bash
git add src/features/booking/components/nearby-garages-card.tsx
git commit -m "feat: add NearbyGaragesCard component"
```

---

## Task 14: Wire new cards into booking-page.tsx

**Files:**
- Modify: `src/pages/booking-page.tsx`

- [ ] Replace the full contents of `src/pages/booking-page.tsx` with:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui/empty-state'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { BookingConfirmation } from '../features/booking/components/booking-confirmation'
import { BookingOptionsList } from '../features/booking/components/booking-options-list'
import { BookingServiceBriefCard } from '../features/booking/components/booking-service-brief-card'
import { NearbyGaragesCard } from '../features/booking/components/nearby-garages-card'
import { useBookingFlow } from '../features/booking/hooks/use-booking-flow'
import { ServiceMap } from '../features/map/components/service-map'
import { garages } from '../lib/mocks/garages'
import { vehicleHealth as mockVehicleHealth } from '../lib/mocks/recommendations'
import { useSessionStore } from '../store/session-store'
import type { GarageEntry } from '../types/domain'

export function BookingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'slots' | 'map'>('slots')
  const selectedGarageId = useSessionStore((state) => state.selectedGarageId)
  const serviceFinderServiceType = useSessionStore((state) => state.serviceFinderServiceType)
  const setSelectedGarageId = useSessionStore((state) => state.setSelectedGarageId)
  const setPendingAssistantPrompt = useSessionStore((state) => state.setPendingAssistantPrompt)
  const setServiceFinderServiceType = useSessionStore((state) => state.setServiceFinderServiceType)
  const liveVehicleHealth = useSessionStore((state) => state.liveVehicleHealth)
  const selectedRecommendationId = useSessionStore((state) => state.selectedRecommendationId)

  const healthRecs = liveVehicleHealth?.recommendations ?? mockVehicleHealth.recommendations
  const currentRecommendation =
    healthRecs.find((r) => r.id === selectedRecommendationId) ?? healthRecs[0]

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

  if (!bookingOptions.length && !confirmation && activeTab === 'slots') {
    return (
      <EmptyState
        title="No slots available"
        description="Try picking another recommendation from the vehicle insight page."
      />
    )
  }

  const handleAskAssistant = (garage: GarageEntry) => {
    setSelectedGarageId(garage.id)
    const serviceLabel = serviceFinderServiceType === 'car_wash' ? 'car wash' : 'car repair'
    setPendingAssistantPrompt(
      `I picked ${garage.name} for ${serviceLabel}. Please compare price, warranty, and best available booking slot for my Toyota Vios now.`,
    )
    navigate('/assistant')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={activeTab === 'slots' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('slots')}>
          Booking slots
        </Button>
        <Button variant={activeTab === 'map' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('map')}>
          Service map
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_repair' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_repair')}
        >
          Car repair
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_wash' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_wash')}
        >
          Car wash
        </Button>
      </div>

      {activeTab === 'map' ? (
        <ServiceMap
          serviceType={serviceFinderServiceType}
          selectedGarageId={selectedGarageId}
          onSelectGarage={setSelectedGarageId}
          onAskAssistant={handleAskAssistant}
        />
      ) : null}

      {confirmation ? (
        <BookingConfirmation confirmation={confirmation} />
      ) : activeTab === 'slots' ? (
        <>
          <BookingServiceBriefCard recommendation={currentRecommendation} />
          <BookingOptionsList
            bookingOptions={bookingOptions}
            isConfirming={isConfirming}
            onConfirm={confirmBooking}
            onSelect={selectOption}
            selectedBookingOptionId={selectedBookingOptionId}
          />
          <NearbyGaragesCard />
        </>
      ) : null}

      {activeTab === 'map' && selectedGarageId ? (
        <p className="text-sm text-ink/65">
          Selected from map:{' '}
          <span className="font-semibold text-ink">
            {garages.find((g) => g.id === selectedGarageId)?.name ?? selectedGarageId}
          </span>
        </p>
      ) : null}
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/pages/booking-page.tsx
git commit -m "feat: wire BookingServiceBriefCard and NearbyGaragesCard into booking page"
```

---

## Task 15: Verify build and push

- [ ] Run build:
```bash
cd D:/washgo/washgo && npm run build
```
Expected: `✓ built in X.Xs` with no new errors (pre-existing chunk size warning is fine)

- [ ] If build passes, push:
```bash
git push origin main
```

- [ ] Add `SERPAPI_KEY` to Vercel project environment variables (Production, no VITE_ prefix) if not already done — required for `api/garages.ts` to return live results.
