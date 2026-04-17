# Phase 6 — Car Health Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/history` page showing the live service timeline from session store, a Qwen-generated valuation insight, and wire the assistant to use live entries instead of the static mock.

**Architecture:** A `use-car-history` hook reads `carHealthRecordEntries` from the Zustand session store (already seeded + appendable by Lens) and derives sorted timeline, summary stats, and a Qwen valuation insight. Three focused UI components render the data. The assistant adapter swaps its static `carHealthRecord` import for `useSessionStore.getState()` so it always sees live entries including any Lens extractions.

**Tech Stack:** React 19, TypeScript, Zustand (`useSessionStore.getState()` for non-hook context), TanStack Query (none needed — hook uses `useState`/`useEffect`), Tailwind CSS, lucide-react, existing UI primitives (`Card`, `Badge`, `EmptyState`, `Spinner`).

**Note:** This project has no test framework configured. Verification steps use `npm run build` and manual smoke-testing instead of automated tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/qwen/prompts.ts` | Modify | Add `buildValuationInsightPrompt` |
| `src/features/history/hooks/use-car-history.ts` | Create | Derive sorted entries, stats, valuation insight |
| `src/features/history/components/service-timeline.tsx` | Create | Render sorted entry cards |
| `src/features/history/components/valuation-insight.tsx` | Create | Render Qwen insight with skeleton |
| `src/features/history/components/history-page.tsx` | Create | Page shell — header, stats row, timeline, insight |
| `src/pages/history-page.tsx` | Create | Route wrapper (matches lens-page.tsx pattern) |
| `src/lib/api/adapters/qwen-assistant-service.ts` | Modify | Swap static mock for live session store entries at 2 call sites |
| `src/app/router.tsx` | Modify | Add `/history` route |
| `src/components/layout/top-nav.tsx` | Modify | Add History nav item |

---

## Task 1: Add `buildValuationInsightPrompt` to prompts.ts

**Files:**
- Modify: `src/lib/qwen/prompts.ts`

- [ ] **Step 1: Add the prompt function**

Open `src/lib/qwen/prompts.ts` and add this function at the end of the file (after `buildServiceBookExtractionPrompt`):

```ts
export function buildValuationInsightPrompt(
  entryCount: number,
  totalSpentVnd: number,
  latestServiceDate: string,
  vehicleMake: string,
  vehicleModel: string,
): string {
  return `You are an automotive advisor. A ${vehicleMake} ${vehicleModel} owner has ${entryCount} verified service records totalling ${totalSpentVnd.toLocaleString()} VND, with the most recent service on ${latestServiceDate}.

Return a JSON object with a single field:
{
  "insight": string (one plain sentence about how this service record affects resale value — reference Tasco's service network where relevant, no other brand references)
}

Keep the insight positive, factual, and under 25 words.`
}
```

- [ ] **Step 2: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd D:/washgo/washgo && git add src/lib/qwen/prompts.ts && git commit -m "feat(history): add buildValuationInsightPrompt to qwen prompts"
```

---

## Task 2: Create `use-car-history` hook

**Files:**
- Create: `src/features/history/hooks/use-car-history.ts`

- [ ] **Step 1: Create the hook file**

Create `src/features/history/hooks/use-car-history.ts`:

```ts
import { useEffect, useState } from 'react'
import { useSessionStore } from '../../../store/session-store'
import { carHealthRecord } from '../../../lib/mocks/car-health-record'
import { activeVehicle } from '../../../lib/mocks/vehicle'
import { qwenChat } from '../../../lib/qwen/client'
import { buildValuationInsightPrompt } from '../../../lib/qwen/prompts'
import type { ServiceRecordEntry } from '../../../types/domain'

const VALUATION_FALLBACK = 'Your complete service history typically adds 5–10% to resale value. Keep it up.'

function formatServiceType(raw: string): string {
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function deriveStats(entries: ServiceRecordEntry[]) {
  const totalSpentVnd = entries.reduce((sum, e) => sum + e.costVnd, 0)
  const servicesCompleted = entries.length
  const nextDueDate = carHealthRecord.nextDueDate
  return { totalSpentVnd, servicesCompleted, nextDueDate }
}

async function fetchValuationInsight(entries: ServiceRecordEntry[]): Promise<string> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY
  if (!apiKey || entries.length === 0) return VALUATION_FALLBACK

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const totalSpentVnd = entries.reduce((sum, e) => sum + e.costVnd, 0)
  const latestServiceDate = sorted[0]?.date ?? 'unknown'

  const prompt = buildValuationInsightPrompt(
    entries.length,
    totalSpentVnd,
    latestServiceDate,
    activeVehicle.make,
    activeVehicle.model,
  )

  try {
    const response = await qwenChat(
      [{ role: 'user', content: prompt }],
      {
        model: import.meta.env.VITE_QWEN_TEXT_MODEL || 'qwen-plus',
        jsonMode: true,
        temperature: 0.4,
      },
    )
    if (response.kind === 'content') {
      const raw = response.content.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
      const parsed = JSON.parse(raw) as { insight?: string }
      if (typeof parsed.insight === 'string' && parsed.insight.length > 0) {
        return parsed.insight
      }
    }
  } catch {
    // fall through to fallback
  }

  return VALUATION_FALLBACK
}

export function useCarHistory() {
  const entries = useSessionStore((state) => state.carHealthRecordEntries)
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const stats = deriveStats(entries)

  const [valuationInsight, setValuationInsight] = useState<string | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)

  useEffect(() => {
    if (entries.length === 0) return
    setIsLoadingInsight(true)
    void fetchValuationInsight(entries).then((insight) => {
      setValuationInsight(insight)
      setIsLoadingInsight(false)
    })
    // run once on mount — intentionally no entries dependency to avoid re-calling on Lens append
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    sortedEntries: sorted,
    stats,
    valuationInsight,
    isLoadingInsight,
    formatServiceType,
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.

- [ ] **Step 3: Commit**

```bash
cd D:/washgo/washgo && git add src/features/history/hooks/use-car-history.ts && git commit -m "feat(history): add use-car-history hook with stats and valuation insight"
```

---

## Task 3: Create `ServiceTimeline` component

**Files:**
- Create: `src/features/history/components/service-timeline.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/history/components/service-timeline.tsx`:

```tsx
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import type { ServiceRecordEntry } from '../../../types/domain'

const SOURCE_BADGE: Record<ServiceRecordEntry['source'], { label: string; tone: 'neutral' | 'good' | 'warn' }> = {
  lens_extracted: { label: 'Lens', tone: 'warn' },
  booking: { label: 'Booking', tone: 'good' },
  manual: { label: 'Manual', tone: 'neutral' },
}

function formatDate(dateStr: string): string {
  if (dateStr === 'unknown') return 'Unknown date'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatVnd(amount: number): string {
  if (amount === 0) return '—'
  return `${amount.toLocaleString('en-US')} VND`
}

function formatServiceType(raw: string): string {
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface ServiceTimelineProps {
  entries: ServiceRecordEntry[]
}

export function ServiceTimeline({ entries }: ServiceTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No service records yet"
        description="Use Dashboard Lens to extract records from your service book, or book a service to start building your history."
      />
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const source = SOURCE_BADGE[entry.source] ?? SOURCE_BADGE.manual
        return (
          <Card key={entry.id} className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">{formatDate(entry.date)}</p>
                <p className="mt-0.5 font-semibold text-ink">{formatServiceType(entry.serviceType)}</p>
                <p className="text-sm text-ink/70">{entry.garageName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={source.tone}>{source.label}</Badge>
                <span className="text-sm font-semibold text-ink">{formatVnd(entry.costVnd)}</span>
              </div>
            </div>
            {entry.partsReplaced.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.partsReplaced.map((part) => (
                  <span
                    key={part}
                    className="rounded-full bg-ink/6 px-2.5 py-0.5 text-[11px] text-ink/70"
                  >
                    {part}
                  </span>
                ))}
              </div>
            )}
            {entry.notes && (
              <p className="text-xs text-ink/55 leading-5">{entry.notes}</p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.

- [ ] **Step 3: Commit**

```bash
cd D:/washgo/washgo && git add src/features/history/components/service-timeline.tsx && git commit -m "feat(history): add ServiceTimeline component"
```

---

## Task 4: Create `ValuationInsight` component

**Files:**
- Create: `src/features/history/components/valuation-insight.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/history/components/valuation-insight.tsx`:

```tsx
import { Card } from '../../../components/ui/card'
import { Spinner } from '../../../components/ui/spinner'

interface ValuationInsightProps {
  insight: string | null
  isLoading: boolean
}

export function ValuationInsight({ insight, isLoading }: ValuationInsightProps) {
  if (!isLoading && !insight) return null

  return (
    <Card className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/8 text-base">
        📈
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Resale Value Insight</p>
        {isLoading ? (
          <div className="mt-2 flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            <span className="text-sm text-ink/55">Generating insight…</span>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-6 text-ink/80">{insight}</p>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Check Spinner import path**

Verify `src/components/ui/spinner.tsx` exists:

```bash
ls D:/washgo/washgo/src/components/ui/spinner.tsx
```

If the file does not exist, replace the Spinner with an inline skeleton instead:

```tsx
// Replace the Spinner block with:
{isLoading ? (
  <div className="mt-2 h-4 w-48 animate-pulse rounded bg-ink/10" />
) : (
  <p className="mt-1 text-sm leading-6 text-ink/80">{insight}</p>
)}
```

And remove the `Spinner` import line.

- [ ] **Step 3: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.

- [ ] **Step 4: Commit**

```bash
cd D:/washgo/washgo && git add src/features/history/components/valuation-insight.tsx && git commit -m "feat(history): add ValuationInsight component"
```

---

## Task 5: Create `HistoryPage` component

**Files:**
- Create: `src/features/history/components/history-page.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/history/components/history-page.tsx`:

```tsx
import { Card } from '../../../components/ui/card'
import { useCarHistory } from '../hooks/use-car-history'
import { ServiceTimeline } from './service-timeline'
import { ValuationInsight } from './valuation-insight'

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('en-US')} VND`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HistoryPage() {
  const { sortedEntries, stats, valuationInsight, isLoadingInsight } = useCarHistory()

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(12,36,58,1)_0%,_rgba(21,57,90,1)_52%,_rgba(245,125,41,0.94)_100%)] text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/62">Car Health Record</p>
        <p className="mt-2 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">Service History</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
          Your complete service timeline — built from bookings, manual entries, and Lens extractions.
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Services</p>
          <p className="mt-1 font-display text-3xl">{stats.servicesCompleted}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Total Spent</p>
          <p className="mt-1 font-display text-xl leading-tight">{formatVnd(stats.totalSpentVnd)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45">Next Due</p>
          <p className="mt-1 font-display text-xl leading-tight">{formatDate(stats.nextDueDate)}</p>
        </Card>
      </div>

      <ServiceTimeline entries={sortedEntries} />

      <ValuationInsight insight={valuationInsight} isLoading={isLoadingInsight} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.

- [ ] **Step 3: Commit**

```bash
cd D:/washgo/washgo && git add src/features/history/components/history-page.tsx && git commit -m "feat(history): add HistoryPage component with stats and timeline"
```

---

## Task 6: Wire route, page wrapper, and nav item

**Files:**
- Create: `src/pages/history-page.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/components/layout/top-nav.tsx`

- [ ] **Step 1: Create the page wrapper**

Create `src/pages/history-page.tsx`:

```tsx
import { HistoryPage } from '../features/history/components/history-page'

export function HistoryRoutePage() {
  return <HistoryPage />
}
```

- [ ] **Step 2: Add route to router**

Open `src/app/router.tsx`. Add the import:

```ts
import { HistoryRoutePage } from '../pages/history-page'
```

Add the route inside the `AppShell` children array, after the `lens` route:

```ts
{ path: 'history', element: <HistoryRoutePage /> },
```

The full children array should look like:

```ts
children: [
  { index: true, element: <DashboardPage /> },
  { path: 'vehicle', element: <VehiclePage /> },
  { path: 'booking', element: <BookingPage /> },
  { path: 'assistant', element: <AssistantPage /> },
  { path: 'lens', element: <LensRoutePage /> },
  { path: 'history', element: <HistoryRoutePage /> },
],
```

- [ ] **Step 3: Add nav item**

Open `src/components/layout/top-nav.tsx`. Add `ClipboardList` to the lucide import:

```ts
import { CarFront, Camera, ClipboardList, LogOut, MessageSquareText, Wrench } from 'lucide-react'
```

Add the History nav item between Lens and Assistant:

```ts
const navItems = [
  { to: '/', label: 'Dashboard', icon: CarFront },
  { to: '/vehicle', label: 'Vehicle', icon: Wrench },
  { to: '/lens', label: 'Lens', icon: Camera },
  { to: '/history', label: 'History', icon: ClipboardList },
  { to: '/assistant', label: 'Assistant', icon: MessageSquareText },
]
```

- [ ] **Step 4: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.

- [ ] **Step 5: Commit**

```bash
cd D:/washgo/washgo && git add src/pages/history-page.tsx src/app/router.tsx src/components/layout/top-nav.tsx && git commit -m "feat(history): add /history route and nav item"
```

---

## Task 7: Wire assistant adapter to live session store entries

**Files:**
- Modify: `src/lib/api/adapters/qwen-assistant-service.ts`

- [ ] **Step 1: Add session store import**

Open `src/lib/api/adapters/qwen-assistant-service.ts`. After the existing imports, add:

```ts
import { useSessionStore } from '../../../store/session-store'
```

- [ ] **Step 2: Replace first call site (non-streaming path, line ~170)**

Find the block:

```ts
const systemPrompt = buildAssistantSystemPrompt(
  activeVehicle,
  vehicleHealth,
  carHealthRecord,
  null,
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  'Ho Chi Minh City, District 1',
)
```

The first occurrence (inside the non-streaming `sendMessage` method). Replace with:

```ts
const liveEntries = useSessionStore.getState().carHealthRecordEntries
const liveHealthRecord = { ...carHealthRecord, entries: liveEntries }
const systemPrompt = buildAssistantSystemPrompt(
  activeVehicle,
  vehicleHealth,
  liveHealthRecord,
  null,
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  'Ho Chi Minh City, District 1',
)
```

- [ ] **Step 3: Replace second call site (streaming path, line ~233)**

Find the second identical `buildAssistantSystemPrompt` block (inside `sendMessageStreaming`). Replace with:

```ts
const liveEntries = useSessionStore.getState().carHealthRecordEntries
const liveHealthRecord = { ...carHealthRecord, entries: liveEntries }
const systemPrompt = buildAssistantSystemPrompt(
  activeVehicle,
  vehicleHealth,
  liveHealthRecord,
  null,
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  'Ho Chi Minh City, District 1',
)
```

- [ ] **Step 4: Verify build**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd D:/washgo/washgo && git add src/lib/api/adapters/qwen-assistant-service.ts && git commit -m "feat(history): wire assistant to live session store entries"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Start dev server**

```bash
npm --prefix D:/washgo/washgo run dev
```

- [ ] **Step 2: Verify history page**

Navigate to `http://localhost:5173/history`. Confirm:
- Page loads without error
- 5 seeded service entries appear, newest first (2026-01-15 at top)
- Stats row shows: 5 services, 4,930,000 VND total, 15 Apr 2026 next due
- Each entry shows service type (formatted), garage name, cost, parts tags, source badge
- Valuation insight card appears (skeleton while loading, then text)

- [ ] **Step 3: Verify Lens → History flow**

Navigate to `/lens`. Pick "Use engine warning" demo image and run analysis. Click "Analyze warning light". Then switch tab to Service Book, pick "Use sample receipt", click "Extract service history", then click "Add extracted entries to history". Navigate to `/history` — the extracted entry should appear at the top of the timeline with a "Lens" badge.

- [ ] **Step 4: Verify nav**

Confirm the "History" nav item appears between Lens and Assistant in the top nav, with the correct active highlight when on `/history`.

- [ ] **Step 5: Final build check**

```bash
npm --prefix D:/washgo/washgo run build
```

Expected: green build.
