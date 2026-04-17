# Handoff — WashGo Phase 6 Complete + Demo Polish — 2026-04-17

## Goal
Ship Phase 6 (Car Health Record) and polish the full app for hackathon demo submission. The app is a Qwen-powered car copilot for Vietnamese car owners competing in the Tasco Open Mobility Challenge for up to $10k seed investment.

## Completed

### Phase 6 — Car Health Record (all committed to `main`)
- `src/lib/qwen/prompts.ts` — added `buildValuationInsightPrompt` (qwen-plus, JSON mode, no Bave refs)
- `src/features/history/hooks/use-car-history.ts` — derives sorted entries, stats, Qwen valuation insight with fallback
- `src/features/history/components/service-timeline.tsx` — entry cards with date, garage, service type (Title Case), VND cost, parts tags, source badge (Lens/Booking/Manual)
- `src/features/history/components/valuation-insight.tsx` — Qwen insight card with inline skeleton loading state
- `src/features/history/components/history-page.tsx` — gradient header, 3-stat row, timeline, insight
- `src/pages/history-page.tsx` — route wrapper
- `/history` route added to `src/app/router.tsx`
- History nav item (ClipboardList icon) added to `src/components/layout/top-nav.tsx` between Lens and Assistant
- `src/lib/api/adapters/qwen-assistant-service.ts` — both `buildAssistantSystemPrompt` call sites now use `useSessionStore.getState().carHealthRecordEntries` (live entries including Lens extractions) instead of static mock

### Phase 5 — Lens (teammate pushed, confirmed green)
- Full vision adapter, LensPage, PhotoUploader, AnalysisResultCard, LensActionBar
- 4 demo images bundled: engine warning, tire pressure, receipt, service book
- `session-store.ts` extended with `carHealthRecordEntries` + `appendCarHealthRecordEntries`
- `qwen/client.ts` updated: `qwenVision` now accepts full data URL (not just base64)

### Polish (committed `6407a50`)
- Removed all dev-facing notes exposed in UI:
  - QuickActions: "Keep the demo moving..." → meaningful copy
  - BookingOptionsList CTA: dev note → "Your selected slot will be held for 15 minutes."
  - LensPage eyebrow: "Phase 5 Lens MVP" → "Dashboard Lens"
- Wired dynamic copy from Qwen data:
  - `VehicleDiagnosticPanel`: hardcoded "Battery is the main watch item" → `health.issues[0]`
  - `StatusOverview`: hardcoded Battery/City-heavy → top recommendation category + health status
  - Dashboard "Why this matters today" card: hardcoded battery copy → `primaryRecommendation.title` + `.description`
- Booking map: raw garage ID → resolved garage name from mock
- `analysis-result-card.tsx`: `serviceType.replace('_', ' ')` → proper Title Case

### Docs
- `docs/devpost-submission.md` — full Devpost submission ready to copy-paste
- `docs/demo-script.md` — 3-minute judge demo script with exact lines
- `docs/superpowers/specs/2026-04-17-phase6-car-health-record-design.md` — Phase 6 spec
- `docs/superpowers/plans/2026-04-17-phase6-car-health-record.md` — Phase 6 implementation plan

### Build
- `npm run build` — green (only pre-existing chunk size warning, not an error)

## In Progress
- Nothing actively in flight — the session ended cleanly after polish

## Not Working / Blockers
- **Qwen API key not set**: Morning brief, vehicle health, assistant, and Lens all run in fallback/mock mode without `VITE_QWEN_API_KEY` in `.env`. All fallbacks are deterministic and demo-safe, but live AI behaviour needs the key. Smoke-test each feature with the key before the demo.
- **Google Maps disabled**: `VITE_MAPS_ENABLED=false` in `.env.example`. Map shows mock garages. To enable live Places API: set `VITE_GOOGLE_MAPS_API_KEY` + `VITE_MAPS_ENABLED=true` and remove the HCMC coordinate lock in `src/features/map/components/service-map.tsx`.
- **Nav overflow on mobile**: 5 nav items (Dashboard, Vehicle, Lens, History, Assistant) — not verified on narrow viewports. Worth a quick browser check before the demo.
- **Daily brief card subtitle**: Always appends `"{vehicle.nickname} is ready for today."` regardless of Qwen's greeting — could feel redundant. Low priority but worth reviewing.

## Key Decisions
- **`useSessionStore.getState()` in assistant adapter**: Zustand supports this outside React components — reads live entries including Lens extractions without prop-drilling through hooks
- **Valuation insight cached on mount**: `useEffect` with empty dep array — intentionally doesn't re-call when Lens appends entries during the session, to avoid unnecessary API calls mid-demo
- **No Bave references anywhere**: All copy references Tasco only — confirmed in spec and all new files
- **Fallback-first for all Qwen calls**: Every adapter has a deterministic fallback so the demo never breaks regardless of network/key state

## Next Steps
1. (P0) Set `VITE_QWEN_API_KEY` in `.env` and smoke-test all 5 Qwen features: morning brief, vehicle health, assistant streaming + tool calls, Lens warning light, Lens service book extraction, History valuation insight
2. (P0) Submit Devpost — copy from `docs/devpost-submission.md`, add screenshots/video
3. (P1) Check nav wrapping on a narrow viewport (iPhone-width) — may need to reduce label text or adjust padding with 5 items
4. (P1) Record demo video following `docs/demo-script.md` as the script
5. (P2) Phase 7 polish: Vietnamese UI responses, booking page map/slots tab visual cleanup
6. (P2) Enable live Google Maps if time allows: set env vars + remove HCMC coordinate lock in `service-map.tsx`

## Context
- **Branch**: `main` (all work committed directly to main throughout the hackathon)
- **Stack**: React 19, Vite, TypeScript, Tailwind, Supabase Auth, TanStack Query, Zustand
- **Key files changed this session**:
  - `src/features/history/` — entire folder created (new)
  - `src/pages/history-page.tsx` — new
  - `src/lib/api/adapters/qwen-assistant-service.ts` — live session store wiring
  - `src/lib/qwen/prompts.ts` — `buildValuationInsightPrompt` added
  - `src/store/session-store.ts` — `carHealthRecordEntries` + `appendCarHealthRecordEntries` (teammate)
  - `src/pages/dashboard-page.tsx`, `src/features/dashboard/components/status-overview.tsx`, `src/features/vehicle/components/vehicle-diagnostic-panel.tsx` — dynamic copy
  - `docs/demo-script.md`, `docs/devpost-submission.md` — new
- **Commands to resume**:
  ```bash
  cd D:/washgo/washgo
  npm run dev          # start dev server at http://localhost:5173
  npm run build        # verify build is green
  ```
- **Open questions**:
  - Is the Qwen API key available and working? Smoke-test before the demo.
  - Will the demo be on localhost or a hosted URL? If hosted, check DashScope CORS — may need the Vercel Edge Function proxy (`vercel.json` is already in the repo).
  - Submission deadline — how much time is left for Phase 7 polish?
