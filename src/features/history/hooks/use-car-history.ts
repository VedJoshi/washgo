import { useEffect, useState } from 'react'
import { useSessionStore } from '../../../store/session-store'
import { carHealthRecord } from '../../../lib/mocks/car-health-record'
import { activeVehicle } from '../../../lib/mocks/vehicle'
import { qwenChat } from '../../../lib/qwen/client'
import { buildValuationInsightPrompt } from '../../../lib/qwen/prompts'
import type { ServiceRecordEntry } from '../../../types/domain'

const VALUATION_FALLBACK = 'Your complete service history typically adds 5–10% to resale value. Keep it up.'

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
  }
}
