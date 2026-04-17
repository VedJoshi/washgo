# Phase 6 — Car Health Record Design

**Date:** 2026-04-17
**Phase:** 6 of 7
**Status:** Approved — ready for implementation planning

---

## Goal

Create the `/history` page that surfaces the live `carHealthRecordEntries` from the session store as a readable service timeline. Wire the assistant to use the same live entries instead of the static mock. Add a Qwen-generated valuation insight with deterministic fallback.

---

## Context

- `session-store.ts` already holds `carHealthRecordEntries: ServiceRecordEntry[]`, seeded from the mock and appendable via `appendCarHealthRecordEntries` (used by Lens)
- The assistant adapter (`qwen-assistant-service.ts`) currently imports `carHealthRecord` from the static mock — this needs to read live state instead
- No new domain types are needed — `ServiceRecordEntry`, `CarHealthRecord` are already defined in `src/types/domain.ts`

---

## Data Layer — `use-car-history.ts`

Location: `src/features/history/hooks/use-car-history.ts`

Reads `carHealthRecordEntries` from the session store and derives:

- **Sorted timeline** — entries sorted by date descending
- **Summary stats:**
  - `totalSpentVnd` — sum of all `costVnd` values
  - `servicesCompleted` — entry count
  - `nextDueDate` — from the mock's `nextDueDate` field (already in session store via seeded mock; not recomputed)
- **Valuation insight** — a single `qwen-plus` JSON-mode call with the following inputs: entry count, total spent VND, latest service date, vehicle make/model. Expected output: `{ insight: string }`. Cached in `useState` — called once on mount, not re-called on re-render. Deterministic fallback: `"Your complete service history typically adds 5–10% to resale value. Keep it up."`

---

## Components

### `HistoryPage` (`src/features/history/components/history-page.tsx`)

Page shell following the same gradient header card pattern as `LensPage`. Header contains title "Service History" and subtitle. Below the header: summary stats row, then `ServiceTimeline`, then `ValuationInsight`.

### `ServiceTimeline` (`src/features/history/components/service-timeline.tsx`)

Vertical list of `ServiceRecordEntry` cards, newest first. Each card shows:
- Date (formatted `DD MMM YYYY`)
- Garage name
- Service type (snake_case → Title Case, e.g. `oil_change` → "Oil Change")
- Cost in VND (formatted with thousands separator)
- Parts replaced as small tags (omitted if empty)
- Source badge: `lens_extracted` → "Lens", `booking` → "Booking", `manual` → "Manual"

Empty state: a simple message when no entries exist.

### `ValuationInsight` (`src/features/history/components/valuation-insight.tsx`)

Small card at the bottom of the page. Displays the Qwen-generated or fallback insight string. Shows a skeleton while the Qwen call is pending. Calm info tone — no urgency styling.

---

## Assistant Injection

File: `src/lib/api/adapters/qwen-assistant-service.ts`

Replace the static `carHealthRecord` import at both `buildAssistantSystemPrompt` call sites with:

```ts
const liveEntries = useSessionStore.getState().carHealthRecordEntries
const liveHealthRecord = { ...carHealthRecord, entries: liveEntries }
```

The `buildAssistantSystemPrompt` signature accepts a `CarHealthRecord` — passing `liveHealthRecord` satisfies the contract while keeping computed fields (totalSpentVnd etc.) from the mock as stable values. The assistant now sees any entries Lens has appended during the session.

---

## Route + Navigation

- New route: `/history` → `HistoryRoutePage` in `src/pages/history-page.tsx`
- Added to `src/app/router.tsx` inside the protected `AppShell` children
- Nav item added to `src/components/layout/top-nav.tsx` between Lens and Assistant:
  - Label: "History"
  - Icon: `ClipboardList` (lucide-react)

---

## Valuation Insight Prompt

```ts
export function buildValuationInsightPrompt(
  entryCount: number,
  totalSpentVnd: number,
  latestServiceDate: string,
  vehicleMake: string,
  vehicleModel: string,
): string
```

System: minimal. User message provides the stats. Expected JSON output: `{ "insight": string }` — one plain sentence connecting the service record completeness to resale value. No Bave references. Tasco/Qwen framing only.

---

## Fallback Behaviour

| Scenario | Behaviour |
|---|---|
| No API key | Deterministic fallback insight shown immediately |
| Qwen call fails or returns invalid JSON | Deterministic fallback insight shown |
| No service entries | Empty state in timeline, no valuation insight shown |

---

## Files

| File | Action |
|---|---|
| `src/features/history/hooks/use-car-history.ts` | Create |
| `src/features/history/components/history-page.tsx` | Create |
| `src/features/history/components/service-timeline.tsx` | Create |
| `src/features/history/components/valuation-insight.tsx` | Create |
| `src/pages/history-page.tsx` | Create |
| `src/lib/qwen/prompts.ts` | Add `buildValuationInsightPrompt` |
| `src/lib/api/adapters/qwen-assistant-service.ts` | Swap static mock for live session store entries |
| `src/app/router.tsx` | Add `/history` route |
| `src/components/layout/top-nav.tsx` | Add History nav item |

---

## Exit Criteria

- Build is green
- `/history` is navigable and shows the seeded entries
- Entries appended via Lens appear in the history page without a page reload
- Assistant references live entries (including any Lens-extracted ones) in its system prompt
- Valuation insight renders with Qwen output when key is present, fallback when not
