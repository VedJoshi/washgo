# Spec — Qwen Data Flow Fix + Booking Page Intelligence
_2026-04-17_

## Problem

The live Qwen vehicle health result (score, issues, recommendations) is generated on the Vehicle page but never stored globally. Every other feature that needs health context — the morning brief prompt and the assistant system prompt — imports the static mock instead. A judge who visits the Vehicle page and then asks the assistant "what's wrong with my car?" gets an answer based on stale hardcoded data, not the live Qwen analysis.

The Booking page has zero AI involvement: the slot list is 100% mock and there is no Qwen reasoning shown anywhere in the flow.

---

## Part 1 — Cross-Feature Health Data Flow

### Session Store
Add to `SessionState`:
```ts
liveVehicleHealth: VehicleHealth | null
setLiveVehicleHealth: (health: VehicleHealth) => void
```
Initial value: `null`. Getter via `useSessionStore.getState().liveVehicleHealth`.

### Write path
`use-vehicle-health.ts`: after the TanStack Query resolves successfully, a `useEffect` calls `setLiveVehicleHealth(health)`. This mirrors how `appendCarHealthRecordEntries` is written from the Lens hook.

### Read path
Both adapter files read via `useSessionStore.getState()` (Zustand outside-React pattern already used in the assistant adapter):

- `qwen-dashboard-service.ts`: replace `vehicleHealth` mock import with `useSessionStore.getState().liveVehicleHealth ?? vehicleHealth`
- `qwen-assistant-service.ts`: same replacement for the health object passed to `buildAssistantSystemPrompt`

If the user hasn't visited the Vehicle page yet (store is null), both fall back to the mock — same behaviour as today, no regression.

---

## Part 2 — Booking Page: Qwen Service Brief Card

### New component: `BookingServiceBriefCard`
Positioned **above** `BookingOptionsList` in the slots tab.

Behaviour:
- Skeleton loading state while Qwen call is in flight (same pattern as `ValuationInsight`)
- Shows four fields:
  - **Why now** — 1-sentence urgency explanation for this specific vehicle
  - **Tell your mechanic** — 1-sentence prep tip
  - **Recommended slot** — which of the two mock slots to pick, and a 1-line reason
  - **Estimated time** — e.g. "30–45 minutes"
- Fetched once on mount via `useBookingBrief` hook

### New prompt: `buildBookingBriefPrompt`
Added to `src/lib/qwen/prompts.ts`. Inputs: `recommendation` (title, issue, urgency, estimatedPriceRange, recommendedWithinDays), `vehicle` (make, model, currentOdometerKm), `healthScore` (number), `slots` (array of `{ id, providerName, slotLabel, priceEstimate, distanceKm }`).

Returns JSON:
```json
{
  "whyNow": "string",
  "mechanicTip": "string",
  "recommendedSlotId": "slot-1 | slot-2",
  "slotReason": "string",
  "estimatedDuration": "string"
}
```

### New adapter: `qwen-booking-service.ts`
- Calls `qwenChat` with `qwen-plus`, `jsonMode: true`, `temperature: 0.3`
- Validates the five fields
- Deterministic fallback keyed to `recommendation.category` (oil / battery / tire / inspection / cleaning)

### New hook: `use-booking-brief.ts`
- Reads `selectedRecommendationId` from session store
- Reads `liveVehicleHealth` from session store
- Calls `qwen-booking-service` with the resolved data
- Returns `{ brief, isLoading }`

---

## Part 3 — Booking Page: Nearby Tasco Garages Card

### New component: `NearbyGaragesCard`
Positioned **below** `BookingOptionsList` in the slots tab.

Shows:
- Header: "Find a Tasco garage near you"
- 4–5 result cards, each with: name, address, phone (tap-to-call `tel:` link), rating, Google Maps directions button
- Skeleton loading; empty state if no results

### SerpAPI proxy — `api/garages.ts` (Vercel Edge Function)
```
GET /api/garages?q=Tasco+oil+change&location=Ho+Chi+Minh+City,Vietnam
```
- Server-side env var `SERPAPI_KEY` (no VITE_ prefix)
- Proxies to `https://serpapi.com/search?engine=google_local`
- Fixed params: `gl=vn`, `hl=en`, `num=5`
- Returns normalised array: `{ name, address, phone, rating, mapsUrl }`
- `mapsUrl` constructed from `gps_coordinates` if `links.directions` is absent

### New adapter: `serpapi-garage-service.ts`
- In `import.meta.env.DEV`: returns 3 entries from existing mock garages (enriched with placeholder phone + Google Maps links) — no network call
- In prod: `fetch('/api/garages?q=Tasco+{serviceType}&location=Ho+Chi+Minh+City,Vietnam')`
- Falls back to mock list on any error

### New hook: `use-nearby-garages.ts`
- Reads `selectedRecommendationId` → resolves `serviceType` → calls `serpapi-garage-service`
- Standard TanStack Query, `staleTime: 10 * 60 * 1000` (10 min, within quota)

### New type: `NearbyGarage`
```ts
type NearbyGarage = {
  name: string
  address: string
  phone?: string
  rating?: number
  mapsUrl?: string
}
```

---

## Layout — Booking Page (slots tab)

```
[existing tab bar]
[BookingServiceBriefCard]   ← NEW
[BookingOptionsList]        ← unchanged
[NearbyGaragesCard]         ← NEW
```

The map tab is unchanged.

---

## New env vars required

| Var | Where | Purpose |
|-----|-------|---------|
| `SERPAPI_KEY` | Vercel project settings (server-side) | SerpAPI proxy auth |

---

## Files changed

| Action | File |
|--------|------|
| modify | `src/store/session-store.ts` |
| modify | `src/features/vehicle/hooks/use-vehicle-health.ts` |
| modify | `src/lib/api/adapters/qwen-dashboard-service.ts` |
| modify | `src/lib/api/adapters/qwen-assistant-service.ts` |
| modify | `src/lib/qwen/prompts.ts` |
| modify | `src/pages/booking-page.tsx` |
| create | `src/lib/api/adapters/qwen-booking-service.ts` |
| create | `src/features/booking/hooks/use-booking-brief.ts` |
| create | `src/features/booking/hooks/use-nearby-garages.ts` |
| create | `src/features/booking/components/booking-service-brief-card.tsx` |
| create | `src/features/booking/components/nearby-garages-card.tsx` |
| create | `src/lib/api/adapters/serpapi-garage-service.ts` |
| create | `api/garages.ts` |

---

## Non-goals
- Dynamic booking slot generation by Qwen (slots remain mock)
- Google Maps API integration (Maps tab unchanged)
- ETC wallet dynamism
- Vietnamese UI strings
