import { dashboardBrief } from '../../mocks/dashboard'
import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth } from '../../mocks/recommendations'
import { etcWallet } from '../../mocks/etc-activity'
import { carHealthRecord } from '../../mocks/car-health-record'
import { delay } from '../../utils/delay'
import { normalizeDisplayText } from '../../utils/normalize-display-text'
import { qwenChat } from '../../qwen/client'
import { buildMorningBriefPrompt } from '../../qwen/prompts'
import { type Language } from '../../i18n'
import { useSessionStore } from '../../../store/session-store'
import type { DailyBrief, DriverAlert, QuickAction } from '../../../types/domain'
import type { DashboardService } from '../services/dashboard-service'

const VALID_ALERT_TYPES: DriverAlert['type'][] = ['maintenance', 'traffic', 'parking', 'toll']
const VALID_SEVERITIES: DriverAlert['severity'][] = ['low', 'medium', 'high']
const VALID_ACTION_HREFS: QuickAction['href'][] = [
  '/',
  '/vehicle',
  '/booking',
  '/assistant',
  '/lens',
  '/history',
  '/telemetry',
]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateDailyBrief(data: unknown): DailyBrief | null {
  if (!isObject(data)) return null

  if (typeof data.greeting !== 'string' || !data.greeting.trim()) return null
  if (typeof data.summary !== 'string' || !data.summary.trim()) return null
  if (!Array.isArray(data.alerts) || data.alerts.length === 0) return null
  if (!Array.isArray(data.suggestedActions) || data.suggestedActions.length === 0) return null

  for (const alert of data.alerts) {
    if (!isObject(alert)) return null
    if (typeof alert.id !== 'string' || !alert.id.trim()) return null
    if (typeof alert.title !== 'string' || !alert.title.trim()) return null
    if (typeof alert.message !== 'string' || !alert.message.trim()) return null
    if (!VALID_ALERT_TYPES.includes(alert.type as DriverAlert['type'])) return null
    if (!VALID_SEVERITIES.includes(alert.severity as DriverAlert['severity'])) return null
  }

  for (const action of data.suggestedActions) {
    if (!isObject(action)) return null
    if (typeof action.id !== 'string' || !action.id.trim()) return null
    if (typeof action.label !== 'string' || !action.label.trim()) return null
    if (!VALID_ACTION_HREFS.includes(action.href as QuickAction['href'])) return null
  }

  return data as DailyBrief
}

function normalizeDailyBrief(brief: DailyBrief): DailyBrief {
  return {
    ...brief,
    greeting: normalizeDisplayText(brief.greeting),
    summary: normalizeDisplayText(brief.summary),
    alerts: brief.alerts.map((alert) => ({
      ...alert,
      title: normalizeDisplayText(alert.title),
      message: normalizeDisplayText(alert.message),
    })),
    suggestedActions: brief.suggestedActions.map((action) => ({
      ...action,
      label: normalizeDisplayText(action.label),
    })),
  }
}

async function fetchMorningBriefFromQwen(): Promise<DailyBrief> {
  const uiLanguage = useSessionStore.getState().uiLanguage
  const today = new Date()
  const locale = uiLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const dayOfWeek = today.toLocaleDateString(locale, { weekday: 'long' })
  const dateLabel = today.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const remainingKm = Math.max(activeVehicle.nextServiceDueKm - activeVehicle.currentOdometerKm, 0)
  const nextServiceDue = carHealthRecord.nextDueDate
    ? `${carHealthRecord.nextDueDate} (${remainingKm.toLocaleString()} km remaining)`
    : null

  const liveHealth = useSessionStore.getState().liveVehicleHealth ?? vehicleHealth
  const prompt = buildMorningBriefPrompt(
    dateLabel,
    dayOfWeek,
    activeVehicle,
    liveHealth,
    etcWallet,
    nextServiceDue,
    uiLanguage,
  )

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are WashGo Daily Brief AI. Return valid JSON only and ensure all href values use approved app routes.',
    },
    { role: 'user' as const, content: prompt },
  ]

  const model = import.meta.env.VITE_QWEN_FAST_MODEL || 'qwen-plus'
  const response = await qwenChat(messages, {
    model,
    jsonMode: true,
    temperature: 0.4,
  })

  if (response.kind !== 'content') {
    throw new Error('Unexpected tool_calls response from morning brief prompt')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(response.content)
  } catch {
    throw new Error('Qwen returned invalid JSON for morning brief')
  }

  const validated = validateDailyBrief(parsed)
  if (!validated) {
    throw new Error('Qwen morning brief response failed validation')
  }

  return normalizeDailyBrief(validated)
}

function localizeMockBrief(brief: DailyBrief, language: Language): DailyBrief {
  if (language !== 'vi') return brief

  const actionLabelByHref: Partial<Record<QuickAction['href'], string>> = {
    '/': 'Mo tong quan',
    '/vehicle': 'Xem tinh trang xe',
    '/booking': 'Dat lich dich vu de xuat',
    '/assistant': 'Hoi tro ly',
    '/lens': 'Mo Lens',
    '/history': 'Xem lich su',
  }

  return normalizeDailyBrief({
    ...brief,
    greeting: 'Chao buoi sang, Minh.',
    summary:
      'Xe cua ban hien van on cho hom nay, nhung moc bao duong dang toi gan va tin hieu ac quy nen duoc xu ly truoc cuoi tuan. Dat lich som se giup viec di lai on dinh hon.',
    alerts: brief.alerts.map((alert, index) => {
      if (index === 0) {
        return {
          ...alert,
          title: 'Moc bao duong dang toi gan',
          message: 'Chi con 2.790 km truoc moc bao duong duoc khuyen nghi.',
        }
      }
      if (index === 1) {
        return {
          ...alert,
          title: 'Phat hien nhieu chuyen di ngan',
          message: 'Kieu chay dung-do trong do thi co the lam ac quy hao nhanh hon.',
        }
      }
      return alert
    }),
    suggestedActions: brief.suggestedActions.map((action) => ({
      ...action,
      label: actionLabelByHref[action.href] ?? action.label,
    })),
  })
}

export const dashboardService: DashboardService = {
  async getDailyBrief() {
    const uiLanguage = useSessionStore.getState().uiLanguage
    const apiKey = import.meta.env.VITE_QWEN_API_KEY

    if (!apiKey) {
      console.log('[Qwen Dashboard] No API key - falling back to mock brief')
      await delay(300)
      return localizeMockBrief(dashboardBrief, uiLanguage)
    }

    try {
      return await fetchMorningBriefFromQwen()
    } catch (error) {
      console.warn('[Qwen Dashboard] API call failed, falling back to mock brief:', error)
      await delay(300)
      return localizeMockBrief(dashboardBrief, uiLanguage)
    }
  },
}
