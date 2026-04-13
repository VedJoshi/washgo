# WashGo × Qwen — Design Specification

**Date:** 2026-04-10  
**Hackathon:** Qwen AI Build Day — Tasco Mobility Track  
**Track:** Open Mobility Challenge  
**Prize:** Up to $10,000 seed investment (up to 3 teams)  
**Status:** Approved — ready for implementation planning

---

## 1. Problem Statement

Vietnamese car owners interact with their vehicles reactively. They wait until something breaks, then scramble to find a trustworthy garage, negotiate a fair price, and figure out what actually happened. There is no trusted, intelligent daily companion for car ownership in Vietnam.

Tasco's ecosystem already has the infrastructure: 4.1 million car owners, 163 showrooms, 75% of the national ETC toll market (2 million transactions per day), ~300 parking lots, and 650,000 car repairs per year. But those touchpoints are transactional. Users pay a toll, park a car, book a service — then leave. There is no reason to open the app tomorrow.

The challenge, stated directly by Tasco: **increase user engagement from MAU to DAU.**

Bave's own investor decks identify the seven questions every Vietnamese car owner asks before a service visit (slide 17 of the WurthGO and Castrol presentations):

1. Which garage should I bring my car to?
2. How do people rate that garage?
3. How much will it cost?
4. Are the spare parts genuine or fake?
5. Will they replace my car's equipment?
6. What is the commitment to quality and warranty?
7. How do I keep track of the repair procedure?

These are natural-language questions. They are exactly what a capable AI assistant should answer. No existing product in Vietnam answers all seven of them in one place.

---

## 2. Solution Overview

**WashGo** is a Qwen-powered AI copilot for Vietnamese car owners, built on top of the Tasco/Bave ecosystem. It gives every driver a trusted daily companion that answers those seven questions — proactively each morning and on-demand through conversation.

**Positioning statement:**
> WashGo is the Qwen-powered concierge that answers the seven questions every Vietnamese car owner actually asks — turning Tasco's 4.1M driver network from a monthly touchpoint into a daily one.

**The daily loop that drives MAU → DAU:**

Every morning the app generates a personalised brief: what your car needs today, your VETC balance, nearby services open now. During the day the AI assistant answers any car-related question in real time, can find a nearby car wash or garage on the map, book a slot, and track the procedure. Over time it builds a Car Health Record — the same data moat Bave's own deck (slide 20) identifies as the key to unlocking used car valuation and finance.

**AI mandate:** All intelligence is powered by Qwen (Alibaba Cloud Model Studio / DashScope). Three distinct Qwen capabilities are used — structured text generation, streaming chat with function calling, and vision — making the AI use genuinely load-bearing rather than decorative.

---

## 3. Existing Codebase

**Location:** `D:\washgo\washgo`  
**Stack:** React 19, Vite, TypeScript, Tailwind CSS, Supabase (auth only), TanStack Query v5, Zustand v5, React Router v7

**Current working state:**
- Supabase magic-link auth is functional
- Four working screens: Dashboard, Vehicle Health, Booking, Assistant
- Car health check UI and service location finder UI are the strongest existing demo surfaces
- All data is mocked; AI assistant does keyword matching only
- Service adapter pattern is in place — every service has an interface contract in `src/lib/api/services/` and a swappable mock implementation in `src/lib/api/adapters/`

**Critical files:**
| File | Role |
|---|---|
| `src/types/domain.ts` | All domain types — extended by this spec |
| `src/lib/api/adapters/mock-assistant-service.ts` | Replaced by Qwen adapter in Phase 2 |
| `src/lib/mocks/` | All mock data — refreshed in Phase 0 |
| `src/store/session-store.ts` | Zustand state — extended for health record and map state |
| `src/app/router.tsx` | Routes — two new routes added |

---

## 4. Feature Specifications

### Feature 1 — Dynamic Service Recommendations
**Phase:** 1 | **Qwen capability:** qwen-plus, JSON structured output

**What it does:** Replaces the hardcoded `VehicleHealth` object with an AI-generated assessment. Given the vehicle's make, model, year, current odometer, last service date, and seeded service history, Qwen generates a health score (0–100), status (`good` / `watch` / `needs_service`), a plain-English issues list, and a ranked list of `ServiceRecommendation` objects with urgency, estimated price range in VND, and actionable descriptions.

**Why it matters:** The vehicle page is the strongest existing demo surface. Making it AI-generated is the lowest-risk, highest-visible-impact first Qwen integration. Changing the mock `lastServiceDate` causes Qwen to generate a different health score — demonstrating live AI reasoning to judges.

**Data flow:**
```
vehicle mock data + car health record mock
  → buildVehicleHealthPrompt()
  → qwen-plus (JSON mode)
  → VehicleHealth (validated)
  → use-vehicle-health.ts hook
  → vehicle page UI (no UI changes needed)
```

**Adapter:** `src/lib/api/adapters/qwen-vehicle-service.ts`  
**Fallback:** On JSON parse failure or API error, return mock `VehicleHealth` — page never breaks.

**Output schema (TypeScript):**
```ts
type VehicleHealth = {
  vehicleId: string
  score: number           // 0–100
  status: 'good' | 'watch' | 'needs_service'
  issues: string[]
  recommendations: ServiceRecommendation[]
}
```

---

### Feature 2 — Streaming Trust Layer Assistant
**Phase:** 2–3 | **Qwen capability:** qwen-max, streaming SSE + function calling

**What it does:** Replaces the 57-line keyword-matching mock with a real conversational AI that knows the user's vehicle, health record, and the Tasco ecosystem. Streams responses token-by-token. In Phase 3, gains tool access so it can act as an agent — finding garages, fetching quotes, booking services, and tracking repair status.

**Why it matters:** Directly answers all seven driver questions. The streaming UI is the most viscerally impressive feature in the demo. Tool use elevates it from "chatbot" to "agent" — judges can ask it to do something and it does it.

**System prompt context injected on every call:**
- Vehicle: make, model, year, plate, odometer, fuel type
- Health: current score, status, active issues, top recommendation
- Car Health Record: last 5 service entries (date, type, garage, cost)
- Today's date and simulated location (Ho Chi Minh City, District 1)
- Instruction to respond in Vietnamese if the user writes in Vietnamese

**Tools (Phase 3):**

| Tool name | Parameters | Returns | Backed by |
|---|---|---|---|
| `findNearbyServices` | `serviceType`, `lat`, `lng`, `radiusKm` | Array of `GarageEntry` (top 5) | Google Places API Nearby Search |
| `getVehicleStatus` | — | Current `Vehicle` + `VehicleHealth` snapshot | Zustand store |
| `getServiceQuote` | `garageId`, `serviceType` | `ServiceQuote` with line items in VND | Mock quote generator |
| `bookService` | `garageId`, `serviceType`, `slotLabel` | `BookingConfirmation` | Existing `mock-booking-service.ts` |
| `getBookingStatus` | `bookingId` | `BookingStatus` with current step | Zustand booking store |

**Tool call loop:** Max 5 rounds. If round 5 returns another tool call (no final text), return a canned fallback message. Log full trace to console.

**UI additions:**
- Streaming partial message renders with animated cursor while `isSending` is true
- `ToolCallIndicator` chip renders inline between messages (e.g. *"Checking nearby car washes…"*)
- Follow-up suggestion chips updated after each reply

**Adapter:** `src/lib/api/adapters/qwen-assistant-service.ts`  
**Fallback:** `stream: false` if SSE parsing breaks — full response in one shot, spinner instead of streaming.

---

### Feature 3 — Google Maps Service Finder
**Phase:** 3 (alongside Function Calling) | **External API:** Google Places API

**What it does:** A map view embedded in the service finder / booking flow. Shows pins for nearby car washes and garages based on the user's real location. Used as the data source for the assistant's `findNearbyServices` tool call — the assistant reasons over the live results and recommends the best option.

**Why it matters:** Car wash is the highest-frequency car service (weekly vs. monthly for repairs) — the strongest MAU→DAU argument. Real Places API data means judges can verify the feature is live, not mocked. Tasco's ecosystem explicitly includes car wash (VETC Cycle 2, slide 2).

**Data flow:**
```
User location (navigator.geolocation)
  → Google Places Nearby Search (car_wash | car_repair, radius 5km)
  → GarageEntry[] results
  → Two paths simultaneously:
    (a) Rendered as map pins in MapView component
    (b) Passed to Qwen as tool result → model recommends best option
```

**New component:** `src/features/map/components/ServiceMap.tsx`
- Embedded in the booking page (`src/pages/booking-page.tsx`) as a new tab alongside the existing booking options list
- Renders embedded Google Map via `@googlemaps/js-api-loader`
- Pins coloured by service type (car wash = blue, garage = orange)
- Clicking a pin shows a summary card: name, rating, distance, opening hours, "Ask assistant about this" CTA
- Feature-flagged via `VITE_MAPS_ENABLED` — falls back to static mock list when false

**New env var:** `VITE_GOOGLE_MAPS_API_KEY`

**Note:** Google Cloud billing account required even for free-tier usage. Set up before hackathon day.

---

### Feature 4 — Qwen Morning Brief
**Phase:** 4 | **Qwen capability:** qwen-plus, JSON structured output

**What it does:** Replaces the hardcoded `DailyBrief` with a Qwen-generated personalised morning card. Generated once per session (cached in Zustand store; regenerated on app restart / new session). Uses today's date, vehicle health, VETC balance, recent toll activity, and the top service recommendation to write a greeting, a 2-sentence summary, and 2–3 alert cards.

**Why it matters:** This is the DAU hook. The brief changes daily — gives users a genuine reason to open the app each morning. It's also the first thing judges see in the demo, and a Qwen-written greeting landing on the screen signals immediately that AI is running.

**Prompt context:**
- Today's date and day of week
- Vehicle make, model, plate
- Health score and top issue
- VETC wallet balance and number of recent toll passes this week
- Any upcoming service due within 7 days

**Output schema:**
```ts
type DailyBrief = {
  greeting: string           // "Good morning — your Vios is ready for today."
  summary: string            // 2 sentences max
  alerts: DriverAlert[]      // 2–3 items, each with title, message, severity
  suggestedActions: QuickAction[]
}
```

**Adapter:** `src/lib/api/adapters/qwen-dashboard-service.ts`  
**Fallback:** Mock brief on API error — dashboard never breaks.

---

### Feature 5 — Dashboard Lens (Vision)
**Phase:** 5 | **Qwen capability:** qwen-vl-max, vision

**What it does:** A new `/lens` page with two modes:

**Mode A — Warning Light Explainer**
User uploads or takes a photo of a dashboard with a warning light. Qwen-VL identifies the warning symbol, explains what it means in plain English, assesses urgency, and recommends a specific action. A CTA deep-links directly to the booking flow with the relevant service type pre-filled.

**Mode B — Service Book Extractor**
User uploads a photo of a paper service book or a receipt. Qwen-VL extracts structured service history entries and appends them to the Car Health Record. This builds the data moat that enables used car valuation (Bave slide 20).

**Why it matters:** This is the demo wow moment. No other team will have vision in their submission. It directly answers "which service do I need?" and builds the Car Health Record. It's the most concrete demonstration of Qwen's AI capabilities beyond text.

**Output schemas:**
```ts
type WarningLightResult = {
  symbolName: string           // "Engine Temperature Warning"
  explanation: string          // plain English, 2–3 sentences
  urgency: 'immediate' | 'soon' | 'monitor'
  recommendedAction: string
  suggestedServiceType: string // maps to booking service types
}

type ServiceRecordExtraction = {
  entries: ServiceRecordEntry[]
  confidence: 'high' | 'medium' | 'low'
  notes: string                // "Partially legible — 2 of 4 entries extracted"
}
```

**Components:**
- `LensPage` — tab switcher (Warning Light / Service Book)
- `PhotoUploader` — drag-and-drop file input + camera capture, preview, retry
- `AnalysisResultCard` — renders either result type with urgency badge
- `LensActionBar` — *"Ask assistant about this"* (pre-fills assistant chat) + *"Book a service"* (pre-fills booking flow)

**New route:** `/lens`  
**New service interface:** `src/lib/api/services/vision-service.ts`  
**New adapter:** `src/lib/api/adapters/qwen-vision-service.ts`

**Demo preparation:** Prepare 2–3 known-good test images before the demo (a clear dashboard warning light photo, a readable service document). Keep them in `src/lib/mocks/demo-images/`.

---

### Feature 6 — Car Health Record
**Phase:** 6 | **Supporting feature — aggregates Features 1–5**

**What it does:** A new `/history` page showing the vehicle's full service timeline. Seeded from mock data, extended by any entries extracted via Dashboard Lens. The full record is injected into the assistant's system prompt as long-context history, enabling genuinely personalised answers like *"Your last oil change was 8,200 km ago — you're due for another."*

**Why it matters:** This is the strategic data moat from Bave slide 20. A complete, verifiable service history adds 5–10% to used car resale value. Building it in the app — even with seeded data — closes the narrative loop for judges: every Qwen feature feeds this record, and this record feeds every Qwen feature.

**Sections on the page:**
1. **Timeline** — chronological `ServiceRecordEntry` list (date, mileage, service, garage, cost, parts replaced, warranty expiry)
2. **Summary stats** — total spent, services completed, next due date
3. **Valuation insight** — a single Qwen-generated line: *"A complete service history like this typically adds 5–10% to resale value on Bave Car-Trading."*

**New route:** `/history`  
**New feature folder:** `src/features/history/`

---

### Feature 7 — Vehicle Telemetry Logger + AI Predictions *(Reach feature — Phase 9)*
**Phase:** 9 | **Qwen capability:** qwen-plus, JSON structured output

**What it does:** A manual data entry form where the driver logs real vehicle readings — tyre pressure per wheel, fuel level, oil level, coolant level, and battery voltage. Qwen analyses the logged values against the vehicle's profile and service history, then returns structured predictions, maintenance alerts, and a proactive booking nudge if a reading is critical.

**Why it matters:**
- Moves WashGo from reactive to genuinely **proactive** — predicts problems before they happen
- Strong MAU→DAU reinforcement: logging a reading takes 30 seconds and gives instant value
- Logged readings append to the Car Health Record, enriching the data moat over time
- The assistant can reference the latest reading in conversation: *"Your battery voltage logged this morning was 12.1V — that's consistent with the concern I flagged earlier"*
- Natural pitch extension: *"OBD-II auto-ingestion is the post-hackathon roadmap"* (manual input for hackathon, hardware integration as future state)

**Qwen output schema:**
```ts
type TelemetryReading = {
  id: string
  vehicleId: string
  loggedAt: string
  fuelLevelPct: number | null          // 0–100
  tyrePressurePsi: {
    frontLeft: number | null
    frontRight: number | null
    rearLeft: number | null
    rearRight: number | null
  }
  oilLevelPct: number | null
  coolantLevelPct: number | null
  batteryVoltage: number | null        // e.g. 12.6
  notes: string
}

type TelemetryAnalysis = {
  summary: string
  predictions: { label: string; detail: string }[]
  alerts: { metric: string; message: string; severity: 'low' | 'medium' | 'high' }[]
  bookingCta: { show: boolean; serviceType: string; reason: string }
}
```

**Example Qwen outputs:**
- *"At your current fuel consumption rate (~9L/100km city), you'll need to refuel in approximately 180 km."*
- *"Front-left tyre is 26 PSI — 4 PSI below the recommended 30 PSI for your Vios. Check before any highway driving."*
- *"Battery voltage has dropped from 12.6V → 12.1V across 3 readings. This matches the battery concern in your health record — consider booking a diagnostic soon."*

**New route:** `/telemetry`

**New feature folder:** `src/features/telemetry/`
- `TelemetryPage` — form + reading history + analysis card
- `ReadingForm` — all fields optional; user fills what they know
- `TelemetryAnalysisCard` — colour-coded alerts (green/amber/red), prediction list, booking CTA
- `ReadingHistory` — chronological list of past readings with sparkline trends

**Scope boundary:** Manual input only. No OBD-II or hardware in scope for the hackathon. Flag as post-hackathon roadmap in the pitch.

---

## 5. Technical Architecture

### New files and folders

```
src/
├── lib/
│   ├── qwen/
│   │   ├── client.ts          # Single DashScope fetch wrapper (streaming + non-streaming)
│   │   ├── prompts.ts         # All system prompts as typed template functions
│   │   └── tools.ts           # Function-calling schemas + dispatcher
│   ├── api/
│   │   ├── services/
│   │   │   └── vision-service.ts           # New interface
│   │   └── adapters/
│   │       ├── qwen-assistant-service.ts   # Replaces mock
│   │       ├── qwen-dashboard-service.ts   # Replaces mock
│   │       ├── qwen-vehicle-service.ts     # Replaces mock
│   │       └── qwen-vision-service.ts      # New
│   └── mocks/
│       ├── garages.ts                      # 12 Tasco/WurthGO/independent garages
│       ├── etc-activity.ts                 # VETC toll history + wallet balance
│       ├── car-health-record.ts            # 5 seeded past service entries
│       └── demo-images/                    # 2–3 known-good test images for Lens demo
├── features/
│   ├── lens/                  # New — Dashboard Lens
│   │   ├── components/
│   │   │   ├── LensPage.tsx
│   │   │   ├── PhotoUploader.tsx
│   │   │   ├── AnalysisResultCard.tsx
│   │   │   └── LensActionBar.tsx
│   │   └── hooks/
│   │       └── use-lens-analysis.ts
│   ├── history/               # New — Car Health Record
│   │   ├── components/
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── ServiceTimeline.tsx
│   │   │   └── ValuationInsight.tsx
│   │   └── hooks/
│   │       └── use-car-history.ts
│   ├── map/                   # New — Service Map
│   │   └── components/
│   │       └── ServiceMap.tsx
│   └── telemetry/             # New (reach) — Telemetry Logger
│       ├── components/
│       │   ├── TelemetryPage.tsx
│       │   ├── ReadingForm.tsx
│       │   ├── TelemetryAnalysisCard.tsx
│       │   └── ReadingHistory.tsx
│       └── hooks/
│           └── use-telemetry.ts
└── types/
    └── domain.ts              # Extended with new types (see below)
```

### New domain types (additions to `domain.ts`)

```ts
// Garage directory
type GarageEntry = {
  id: string
  name: string
  address: string
  district: string
  city: 'hanoi' | 'hcmc'
  lat: number
  lng: number
  distanceKm: number
  rating: number             // 1–5
  reviewCount: number
  priceTier: 'budget' | 'mid' | 'premium'
  services: string[]
  certifications: string[]   // e.g. ['Tasco-certified', 'WurthGO']
  openNow: boolean
  warrantyDays: number
}

// Service quote
type ServiceQuote = {
  garageId: string
  serviceType: string
  lineItems: { label: string; priceVnd: number }[]
  totalVnd: number
  estimatedDurationHours: number
  warrantyKm: number
}

// Booking status
type BookingStatus = {
  bookingId: string
  step: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  currentStepLabel: string
  estimatedCompletionTime: string
}

// VETC / ETC activity
type ETCActivity = {
  date: string
  tollStation: string
  amountVnd: number
  direction: string
}

type ETCWallet = {
  balanceVnd: number
  recentActivity: ETCActivity[]
}

// Car Health Record
type ServiceRecordEntry = {
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

type CarHealthRecord = {
  vehicleId: string
  entries: ServiceRecordEntry[]
  totalSpentVnd: number
  lastServiceDate: string
  nextDueDate: string | null
}

// Vision outputs
type WarningLightResult = {
  symbolName: string
  explanation: string
  urgency: 'immediate' | 'soon' | 'monitor'
  recommendedAction: string
  suggestedServiceType: string
}

type ServiceRecordExtraction = {
  entries: ServiceRecordEntry[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
}
```

### Environment variables

Add to `.env.local` and `.env.example`:

```
# Qwen / DashScope
VITE_QWEN_API_KEY=sk-...
VITE_QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
VITE_QWEN_TEXT_MODEL=qwen-max
VITE_QWEN_FAST_MODEL=qwen-plus
VITE_QWEN_VISION_MODEL=qwen-vl-max

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_MAPS_ENABLED=true
```

### `src/lib/qwen/client.ts` contract

```ts
// Non-streaming: resolves when full response is ready
export async function qwenChat(
  messages: ChatCompletionMessage[],
  options: { model: string; jsonMode?: boolean; tools?: Tool[] }
): Promise<string>

// Streaming: yields token chunks as they arrive
export async function* qwenChatStream(
  messages: ChatCompletionMessage[],
  options: { model: string; tools?: Tool[] }
): AsyncGenerator<string | ToolCall>

// Vision: encodes image + runs qwen-vl-max
export async function qwenVision(
  imageBase64: string,
  prompt: string
): Promise<string>
```

---

## 6. Incremental Build Sequence

Each phase ends with a working, committable state. Phases are independent — stopping after any phase leaves a functional demo.

| Phase | Feature | Qwen capability | Est. hours | Verification |
|---|---|---|---|---|
| 0 | Foundation: Tasco mock data, Qwen client scaffold, domain types | — | 2–3 | App loads, Toyota Vios shows, no TS errors |
| 1 | Dynamic Recommendations | qwen-plus JSON | 3–4 | Vehicle page shows AI-generated health score; changing `lastServiceDate` changes output |
| 2 | Streaming Assistant (text only) | qwen-max streaming | 5–6 | Tokens appear in real time; Vietnamese input → Vietnamese response |
| 3 | Function Calling + Google Maps | qwen-max tools + Places API | 10–12 | Ask "find me a car wash near me" → tool call indicators → map pins + Qwen recommendation |
| 4 | Morning Brief | qwen-plus JSON | 4–5 | Landing page shows AI-written greeting; VETC balance referenced; refreshing changes content |
| 5 | Dashboard Lens (vision) | qwen-vl-max | 8–10 | Upload warning light photo → explanation + urgency + booking CTA |
| 6 | Car Health Record | long-context assembly | 4–5 | History page shows timeline; assistant answers "what was my last service?" correctly |
| 7 | Polish + demo prep | — | 4–6 | Full 3-min demo runs clean; all Qwen calls degrade gracefully on invalid key |
| 8 | Vietnamese UI toggle | — | 4–6 | *Stretch only* |
| 9 | Telemetry Logger + AI Predictions | qwen-plus JSON | 6–8 | *Reach only* |
| **Total (P0–P7)** | | | **40–51 hrs** | |

---

## 7. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| CORS errors on DashScope direct calls | Medium | Add 15-line Vercel Edge Function proxy in `/api/qwen.ts`; `vercel.json` already in repo |
| API key not available until hackathon day | Low-medium | All adapters fall back to mocks on error; Phases 0–1 buildable without key |
| SSE streaming parsing breaks | Low-medium | Fall back to `stream: false`; full response in one shot with spinner |
| Function calling loop doesn't terminate | Low | Hard cap at 5 rounds; canned fallback message on cap hit |
| Google Places billing/quota | Low | `VITE_MAPS_ENABLED` flag; static mock list as fallback |
| qwen-vl image returns invalid JSON | Medium | Try/catch + retry with stricter prompt + "couldn't read image" fallback |
| JSON mode returns malformed JSON | Low | Try/catch + retry once + fall back to mock |
| App name / branding decision blocks progress | Real | Keep "WashGo" in code; finalise demo name on Devpost submission day |

---

## 8. Demo Script (3 minutes)

1. **(0:00–0:30)** Open the app. The landing page loads with a Qwen-generated morning brief — personalised greeting, VETC balance, today's top car priority. *"Every morning, Qwen reads your car's state and writes this brief."*

2. **(0:30–1:00)** Navigate to Vehicle Health. Dynamic AI-generated health score and ranked recommendations for the Toyota Vios. *"These aren't hardcoded — Qwen assessed the vehicle's mileage, service history, and last service date."*

3. **(1:00–2:00)** Open the assistant. Type *"Find me a car wash near me open right now."* Watch tool call indicators fire (*"Checking nearby services…"*), see map pins appear, Qwen names a specific recommendation with distance, rating, and price. Ask *"Book it for Saturday morning"* — confirmation code returned. *"Qwen isn't just answering questions — it's acting on them."*

4. **(2:00–2:40)** Navigate to Lens. Upload a dashboard photo with a warning light. Qwen-VL identifies the symbol, explains it, recommends a service, shows a booking CTA. *"Point your camera at your dashboard — Qwen tells you what it means and what to do."*

5. **(2:40–3:00)** Navigate to Car Health Record. Show the full service timeline. *"Every interaction builds this record. It's what makes used car valuation transparent — the Bave ecosystem's core data moat."*

---

## 9. Submission Checklist (Devpost)

- [ ] Project name + team member details
- [ ] Short summary: *"AI-powered daily car copilot for Vietnamese drivers, powered by Qwen"*
- [ ] Problem statement: fragmented market, no transparency, reactive not proactive
- [ ] How it works: seven questions, three Qwen capabilities, daily brief → assistant → lens → record
- [ ] Qwen tools used: qwen-max (streaming + function calling), qwen-plus (JSON structured output), qwen-vl-max (vision)
- [ ] Demo video: 3-minute walkthrough of demo script above
- [ ] Screenshots: Dashboard brief, Vehicle health, Map + assistant, Lens result, Car Health Record
- [ ] Live demo link (Vercel deployment) or repository link
- [ ] `decisions.md` and this spec as supporting materials

---

*Spec written 2026-04-10. Approved by user. Proceed to implementation planning.*
