# WashGo x Qwen Implementation Plan

**Date:** 2026-04-10  
**Status:** Ready for execution  
**Spec:** `D:\washgo\washgo\docs\superpowers\specs\2026-04-10-washgo-qwen-design.md`  
**Codebase:** `D:\washgo\washgo`

## 1. Objective

Ship the hackathon build in phased, committable increments using the approved WashGo x Qwen spec. The plan prioritizes the highest-demo-value path first:

1. Foundation and mock refresh
2. AI vehicle recommendations
3. Streaming assistant
4. Tool calling + maps
5. Morning brief
6. Lens
7. Car Health Record
8. Polish and demo readiness
9. Stretch and reach features only if Phases 0-7 are complete

The build must remain functional at the end of every phase, with graceful fallbacks to mocks when API keys or external integrations are unavailable.

## 2. Constraints and Assumptions

- `npm run build` is the only required verification command in-repo today.
- `VITE_QWEN_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY` may not be available until hackathon day.
- All Qwen integrations must degrade to current mock behavior or deterministic local fallbacks.
- English UI remains the default. Vietnamese output is supported in assistant responses when the user writes Vietnamese.
- Toyota Vios 2021 replaces the current Mazda vehicle seed.
- Google Maps work is guarded by `VITE_MAPS_ENABLED`.
- Phases 8 and 9 are optional and must not delay Phases 0-7.

## 3. Working Rules During Implementation

- End each phase in a buildable state.
- Prefer adapter swaps over direct UI rewrites.
- Keep service interfaces stable where possible and add new interfaces only when required.
- Put prompt construction, DashScope fetch logic, and tool schemas under `src/lib/qwen/`.
- Treat mock data as first-class demo support, not temporary throwaway data.
- Log tool traces and failure reasons in development, but keep user-facing fallbacks simple.

## 4. Current Baseline

The following are already in place and should be extended rather than replaced:

- Auth flow via Supabase
- Routes: `/`, `/vehicle`, `/booking`, `/assistant`
- Mock service adapters under `src/lib/api/adapters/`
- Query hooks for dashboard, vehicle health, and assistant chat
- Zustand session store in `src/store/session-store.ts`
- Core domain types in `src/types/domain.ts`

Current integration points:

- `src/features/vehicle/hooks/use-vehicle-health.ts` imports `mock-vehicle-service`
- `src/features/assistant/hooks/use-assistant-chat.ts` imports `mock-assistant-service`
- `src/features/dashboard/hooks/use-dashboard-data.ts` imports `mock-dashboard-service`
- `src/app/router.tsx` needs new routes
- `src/components/layout/top-nav.tsx` needs new nav items

## 5. Delivery Order

| Phase | Outcome | Stop condition |
|---|---|---|
| 0 | Foundation and mock refresh | Types compile, Toyota Vios seed is live, Qwen scaffolding exists |
| 1 | AI vehicle recommendations | Vehicle page powered by Qwen adapter with fallback |
| 2 | Streaming assistant | Assistant streams text with safe non-stream fallback |
| 3 | Tool calling + maps | Assistant can find services and booking flow gains map support |
| 4 | Morning brief | Dashboard brief generated via Qwen adapter with fallback |
| 5 | Lens | Warning light and service book analysis working with mocked/demo-ready fallback |
| 6 | Car Health Record | History page added and assistant consumes history context |
| 7 | Polish + demo prep | Full demo path is stable end-to-end |
| 8 | Vietnamese UI toggle | Only if Phases 0-7 are complete |
| 9 | Telemetry logger | Only if Phases 0-8 are complete or explicitly prioritized |

## 6. Phase Plan

### Phase 0. Foundation, Types, and Mock Data

**Goal**  
Prepare the data model, mock assets, env contract, and Qwen scaffolding so feature work can proceed without rework.

**Primary files**

- `src/types/domain.ts`
- `src/lib/mocks/vehicle.ts`
- `src/lib/mocks/garages.ts`
- `src/lib/mocks/etc-activity.ts`
- `src/lib/mocks/car-health-record.ts`
- `src/lib/mocks/demo-images/`
- `src/lib/qwen/client.ts`
- `src/lib/qwen/prompts.ts`
- `src/lib/qwen/tools.ts`
- `.env.example`

**Tasks**

1. Extend `src/types/domain.ts` with:
   - `GarageEntry`
   - `ServiceQuote`
   - `BookingStatus`
   - `ETCActivity`
   - `ETCWallet`
   - `ServiceRecordEntry`
   - `CarHealthRecord`
   - `WarningLightResult`
   - `ServiceRecordExtraction`
   - Any tool-call helper types needed for assistant streaming
2. Refresh vehicle and ecosystem mock data:
   - Replace Mazda seed with Toyota Vios 2021
   - Seed 12-15 Hanoi/HCMC garages with mixed certifications and price tiers
   - Seed VETC wallet balance and recent toll activity
   - Seed 5 service history entries for the health record
3. Create Qwen scaffolding:
   - `client.ts` for non-streaming, streaming, and vision requests
   - `prompts.ts` for typed prompt builders
   - `tools.ts` for tool schema definitions and dispatcher contracts
4. Add env documentation to `.env.example` for Qwen and Google Maps.
5. Update any mock imports broken by the new mock file split.

**Verification**

- `npm run build`
- App still loads with mock-only behavior
- Vehicle shown in UI is Toyota Vios 2021

**Exit criteria**

- No type holes in new domain models
- Qwen library folder exists with compile-safe placeholders
- Mock data is aligned with the approved spec

### Phase 1. Dynamic Service Recommendations

**Goal**  
Replace hardcoded vehicle health output with Qwen-generated structured recommendations, while preserving the current vehicle page UI.

**Primary files**

- `src/lib/api/adapters/qwen-vehicle-service.ts`
- `src/lib/api/services/vehicle-service.ts`
- `src/features/vehicle/hooks/use-vehicle-health.ts`
- `src/lib/qwen/prompts.ts`
- `src/lib/mocks/car-health-record.ts`

**Tasks**

1. Implement `qwen-vehicle-service.ts` against the existing `vehicle-service` contract.
2. Build a `buildVehicleHealthPrompt()` helper that includes:
   - vehicle identity
   - odometer
   - last service date
   - seeded service history
3. Request JSON output from `qwen-plus` and validate the result before returning it.
4. Add fallback behavior:
   - malformed JSON -> retry once or return mock
   - API/network error -> return mock
5. Swap `use-vehicle-health.ts` from mock adapter import to the new adapter.
6. Keep UI components unchanged unless a small compatibility fix is required.

**Verification**

- `npm run build`
- Vehicle page renders without UI regression
- Changing seeded `lastServiceDate` changes output when Qwen key is available
- Without key, page still renders mock health data

**Exit criteria**

- Vehicle page is adapter-driven, not hardcoded
- Fallback path is proven

### Phase 2. Streaming Assistant, Text Only

**Goal**  
Replace the keyword assistant with a real streaming Qwen chat flow, without tool calling yet.

**Primary files**

- `src/lib/api/adapters/qwen-assistant-service.ts`
- `src/lib/api/services/assistant-service.ts`
- `src/features/assistant/hooks/use-assistant-chat.ts`
- `src/features/assistant/components/message-list.tsx`
- `src/features/assistant/components/chat-panel.tsx`
- `src/features/assistant/components/suggestion-chips.tsx`
- `src/lib/qwen/client.ts`
- `src/lib/qwen/prompts.ts`

**Tasks**

1. Implement `qwen-assistant-service.ts` using `qwen-max`.
2. Build assistant system prompt assembly with:
   - vehicle snapshot
   - current health result
   - recent history entries
   - simulated date and location
   - language behavior instruction for Vietnamese replies
3. Extend the assistant hook to support:
   - optimistic user message append
   - streaming assistant placeholder message
   - token-by-token updates
   - fallback to non-stream response if SSE parsing fails
4. Update message UI for:
   - partial assistant rendering
   - animated cursor while streaming
   - refreshed follow-up suggestions after each reply
5. Preserve existing interaction speed when running on mock fallback.

**Verification**

- `npm run build`
- Assistant accepts input and streams text when key is available
- If streaming fails, a full reply still appears
- Vietnamese prompt receives Vietnamese output when the model is reachable

**Exit criteria**

- No more keyword-matching assistant in the main chat path
- Streaming and non-stream fallback both work

### Phase 3. Function Calling and Google Maps Service Finder

**Goal**  
Turn the assistant into an agent that can discover nearby services, quote, book, and track status. Add a live or feature-flagged map into booking.

**Primary files**

- `src/lib/qwen/tools.ts`
- `src/lib/api/adapters/qwen-assistant-service.ts`
- `src/lib/api/adapters/mock-booking-service.ts`
- `src/features/assistant/components/ToolCallIndicator.tsx`
- `src/features/booking/components/booking-options-list.tsx`
- `src/features/map/components/ServiceMap.tsx`
- `src/pages/booking-page.tsx`
- `src/app/router.tsx`
- `src/store/session-store.ts`

**Tasks**

1. Define tool schemas and dispatcher handlers for:
   - `findNearbyServices`
   - `getVehicleStatus`
   - `getServiceQuote`
   - `bookService`
   - `getBookingStatus`
2. Implement the assistant tool-call loop:
   - max 5 rounds
   - append tool messages into model conversation
   - stop with canned fallback if no final text by round 5
3. Add development logging for tool traces and failures.
4. Add `ServiceMap.tsx` using Google Maps loader behind `VITE_MAPS_ENABLED`.
5. Create service discovery plumbing:
   - real Places API path for `car_wash` and `car_repair`
   - mock garage fallback when Maps is disabled or key is absent
6. Update booking page to present both:
   - existing booking options list
   - map-based selection path
7. Add an inline tool activity UI component for assistant status chips.
8. Extend Zustand store only as needed for selected map result, booking state, or service finder context.

**Verification**

- `npm run build`
- Assistant can complete a nearby-service query end-to-end
- Tool indicators render in chat
- Booking continues working without Google Maps
- Map pins render when Maps is enabled and key is present

**Exit criteria**

- The assistant can take an action, not just answer
- Booking page supports the service-finder narrative for the demo

### Phase 4. Qwen Morning Brief

**Goal**  
Replace the dashboard's hardcoded daily brief with Qwen-generated structured output and session-level caching.

**Primary files**

- `src/lib/api/adapters/qwen-dashboard-service.ts`
- `src/lib/api/services/dashboard-service.ts`
- `src/features/dashboard/hooks/use-dashboard-data.ts`
- `src/store/session-store.ts`
- `src/lib/qwen/prompts.ts`
- `src/lib/mocks/etc-activity.ts`

**Tasks**

1. Implement `qwen-dashboard-service.ts` against the current dashboard service contract.
2. Build a morning brief prompt from:
   - date/day of week
   - vehicle identity
   - health score and top issue
   - VETC balance and toll activity
   - any upcoming service due soon
3. Cache the generated brief for the session so it is not regenerated on every re-render.
4. Preserve mock brief fallback on API or parsing failure.
5. Keep current dashboard card layout unless a minor copy/layout change is needed.

**Verification**

- `npm run build`
- Dashboard loads with no regression
- Brief content references VETC and vehicle-specific state
- Mock fallback still works without keys

**Exit criteria**

- First screen in demo is AI-generated, not static

### Phase 5. Dashboard Lens

**Goal**  
Add the strongest visual AI demo surface: warning-light explanation and service-book extraction.

**Primary files**

- `src/lib/api/services/vision-service.ts`
- `src/lib/api/adapters/qwen-vision-service.ts`
- `src/features/lens/components/LensPage.tsx`
- `src/features/lens/components/PhotoUploader.tsx`
- `src/features/lens/components/AnalysisResultCard.tsx`
- `src/features/lens/components/LensActionBar.tsx`
- `src/features/lens/hooks/use-lens-analysis.ts`
- `src/pages/lens-page.tsx`
- `src/app/router.tsx`
- `src/components/layout/top-nav.tsx`

**Tasks**

1. Add `vision-service.ts` interface and implement `qwen-vision-service.ts`.
2. Create `/lens` route and nav item.
3. Build the lens flow with two tabs:
   - Warning Light Explainer
   - Service Book Extractor
4. Support file upload and preview first; camera capture can be added if trivial.
5. Define prompt templates and result parsing for both result shapes.
6. Wire service-book extraction to append entries into the car health record state/store.
7. Add CTAs:
   - Ask assistant about this
   - Book a service
8. Store 2-3 demo-ready images under `src/lib/mocks/demo-images/`.
9. Add robust fallbacks for unreadable images or invalid model output.

**Verification**

- `npm run build`
- `/lens` route is navigable
- Known-good image produces a structured result
- Extracted records can be added to history state

**Exit criteria**

- Lens is demo-safe with either live Qwen-VL or deterministic fallback behavior

### Phase 6. Car Health Record

**Goal**  
Create the persistent story layer that ties together recommendations, assistant context, bookings, and lens extraction.

**Primary files**

- `src/features/history/components/HistoryPage.tsx`
- `src/features/history/components/ServiceTimeline.tsx`
- `src/features/history/components/ValuationInsight.tsx`
- `src/features/history/hooks/use-car-history.ts`
- `src/pages/history-page.tsx`
- `src/app/router.tsx`
- `src/components/layout/top-nav.tsx`
- `src/store/session-store.ts`
- `src/types/domain.ts`

**Tasks**

1. Add `/history` route and nav item.
2. Create history feature folder and timeline UI.
3. Add summary stats:
   - total spent
   - services completed
   - next due date
4. Decide history state source:
   - start with seeded mock data
   - append lens-extracted entries
   - optionally append completed bookings if easy
5. Inject the full car health record into assistant context assembly.
6. Add a small valuation insight line. Use Qwen if cheap and stable; otherwise derive a deterministic placeholder aligned with the spec.

**Verification**

- `npm run build`
- `/history` loads seeded entries
- Assistant can answer questions about last service from the same shared history

**Exit criteria**

- The data moat narrative is visible in-product

### Phase 7. Polish and Demo Prep

**Goal**  
Stabilize the full judge flow and remove avoidable failure points.

**Primary files**

- Any touched feature files from Phases 0-6
- `.env.example`
- Optional deployment helpers if needed for CORS or proxying

**Tasks**

1. Review the full 3-minute demo path:
   - dashboard brief
   - vehicle health
   - assistant with service discovery and booking
   - lens
   - history
2. Tighten copy, loading states, and empty/error messaging.
3. Ensure all adapters fail soft when:
   - API key missing
   - API response malformed
   - image unreadable
   - Maps unavailable
4. If DashScope direct browser calls hit CORS, add a minimal proxy path only if necessary.
5. Clean up console noise except for deliberate development traces.
6. Capture demo seed assumptions so they are reproducible on demo day.

**Verification**

- `npm run build`
- Full demo rehearsal completes without blocking errors
- Every AI surface has a user-facing fallback

**Exit criteria**

- Demo can run with keys
- Demo can still be shown with partial outages

### Phase 8. Vietnamese UI Toggle (Stretch)

**Goal**  
Add a lightweight UI language toggle without destabilizing the main demo.

**Primary files**

- `src/store/session-store.ts`
- `src/components/layout/top-nav.tsx`
- Pages and shared labels that need language-aware copy

**Tasks**

1. Add a UI language preference to state.
2. Externalize visible labels that matter for the demo.
3. Keep implementation intentionally narrow:
   - nav
   - key cards
   - assistant helper labels
4. Do not refactor the whole app for full i18n.

**Verification**

- `npm run build`
- Toggle works on key screens only

**Exit criteria**

- Only ship if it costs little and does not threaten stability

### Phase 9. Telemetry Logger and AI Predictions (Reach)

**Goal**  
Add a proactive data-entry and prediction feature only after the core story is complete.

**Primary files**

- `src/features/telemetry/components/TelemetryPage.tsx`
- `src/features/telemetry/components/ReadingForm.tsx`
- `src/features/telemetry/components/TelemetryAnalysisCard.tsx`
- `src/features/telemetry/components/ReadingHistory.tsx`
- `src/features/telemetry/hooks/use-telemetry.ts`
- `src/pages/telemetry-page.tsx`
- `src/app/router.tsx`
- `src/types/domain.ts`
- `src/lib/qwen/prompts.ts`

**Tasks**

1. Add telemetry types and local state/history support.
2. Create manual reading form with optional fields only.
3. Use `qwen-plus` structured output for prediction and alert generation.
4. Append logged readings into shared history context if feasible.
5. Keep route isolated so it can be omitted from the main demo if unfinished.

**Verification**

- `npm run build`
- Manual reading -> structured analysis -> booking CTA path works

**Exit criteria**

- Reach feature only; never block core submission

## 7. Cross-Cutting Implementation Notes

### Service adapter strategy

- Preserve existing service interface pattern.
- Prefer swapping imports in hooks over rewriting feature components.
- When interfaces need new methods for streaming or vision, add them explicitly and keep existing consumers compiling during the transition.

### State management

- Keep ephemeral streaming state in feature hooks where possible.
- Keep shared business state in Zustand:
  - active vehicle context
  - selected recommendation / booking
  - car health record
  - optional morning brief cache
  - optional map selection state

### Prompt design

- Centralize all prompts in `src/lib/qwen/prompts.ts`.
- Keep them typed and small enough to test and adjust quickly.
- Separate prompt builders by feature:
  - vehicle health
  - assistant system context
  - morning brief
  - warning light analysis
  - service-book extraction
  - telemetry analysis

### Failure handling

- JSON mode feature adapters must validate output and retry once or fall back.
- Streaming assistant must downgrade to non-stream if stream parsing fails.
- Vision flows must surface a readable failure state and allow retry.
- Maps must never be a required dependency for booking.

## 8. Verification Checklist by Milestone

### After Phase 0

- `npm run build`
- New types compile
- Toyota Vios appears

### After Phase 1

- Vehicle recommendations render
- No UI break on fallback

### After Phase 2

- Streaming text appears
- Non-stream fallback works

### After Phase 3

- Assistant can discover nearby services
- Booking path still works
- Maps do not block build

### After Phase 4

- Dashboard brief is generated or safely mocked

### After Phase 5

- Lens route works with known-good demo inputs

### After Phase 6

- History route works
- Assistant references history correctly

### After Phase 7

- Demo rehearsal completes cleanly

## 9. Recommended Commit Boundaries

Use one commit per phase where practical:

1. `phase-0-foundation-and-mocks`
2. `phase-1-qwen-vehicle-health`
3. `phase-2-streaming-assistant`
4. `phase-3-tools-and-maps`
5. `phase-4-morning-brief`
6. `phase-5-lens`
7. `phase-6-history`
8. `phase-7-polish`

If a phase becomes too large, split by technical seam, not by random file count.

## 10. Execution Recommendation

Recommended mode after this planning step: **Subagent-driven by phase or subsystem ownership**, with one owner on the critical path and parallel owners only for disjoint areas such as:

- mocks/types/Qwen scaffolding
- vehicle adapter
- assistant streaming/tooling
- lens/history pages

If working solo, execute strictly in phase order and do not start Lens before Phases 1-4 are stable.

## 11. Immediate Next Actions

1. Run `npm run build` to confirm current baseline before edits.
2. Execute Phase 0 fully.
3. Stop and verify before starting Phase 1.
4. Provision `.env.local` on hackathon day with:
   - `VITE_QWEN_API_KEY`
   - `VITE_QWEN_BASE_URL`
   - `VITE_QWEN_TEXT_MODEL`
   - `VITE_QWEN_FAST_MODEL`
   - `VITE_QWEN_VISION_MODEL`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_MAPS_ENABLED`

## 12. Non-Blocking Open Questions

None. The current decisions log and approved spec are sufficient to start implementation.
