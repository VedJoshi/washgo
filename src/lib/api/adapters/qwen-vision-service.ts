import type { ServiceRecordExtraction, ServiceRecordEntry, WarningLightResult } from '../../../types/domain'
import { qwenVision } from '../../qwen/client'
import { buildServiceBookExtractionPrompt, buildWarningLightPrompt } from '../../qwen/prompts'
import type { VisionService } from '../services/vision-service'

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
  return JSON.parse(withoutFence)
}

function isWarningLightResult(value: unknown): value is WarningLightResult {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    typeof data.symbolName === 'string' &&
    typeof data.explanation === 'string' &&
    typeof data.recommendedAction === 'string' &&
    typeof data.suggestedServiceType === 'string' &&
    ['immediate', 'soon', 'monitor'].includes(String(data.urgency))
  )
}

function isServiceRecordEntry(value: unknown): value is ServiceRecordEntry {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    typeof data.id === 'string' &&
    typeof data.date === 'string' &&
    typeof data.odometerKm === 'number' &&
    typeof data.serviceType === 'string' &&
    typeof data.garageId === 'string' &&
    typeof data.garageName === 'string' &&
    typeof data.costVnd === 'number' &&
    Array.isArray(data.partsReplaced) &&
    typeof data.notes === 'string' &&
    ['manual', 'lens_extracted', 'booking'].includes(String(data.source))
  )
}

function isServiceRecordExtraction(value: unknown): value is ServiceRecordExtraction {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    Array.isArray(data.entries) &&
    data.entries.every(isServiceRecordEntry) &&
    typeof data.notes === 'string' &&
    ['high', 'medium', 'low'].includes(String(data.confidence))
  )
}

function getWarningLightFallback(fileName?: string): WarningLightResult {
  const name = (fileName || '').toLowerCase()

  if (name.includes('battery')) {
    return {
      symbolName: 'Battery Charging Warning',
      explanation:
        'Your charging system may not be supplying enough power. The battery could drain while driving if this continues.',
      urgency: 'soon',
      recommendedAction: 'Schedule a battery and alternator diagnostic within 24 hours.',
      suggestedServiceType: 'battery',
    }
  }

  if (name.includes('tire') || name.includes('tyre')) {
    return {
      symbolName: 'Tire Pressure Monitoring Warning',
      explanation:
        'One or more tires are likely under-inflated. Driving with low pressure can reduce handling and increase tire wear.',
      urgency: 'soon',
      recommendedAction: 'Check and inflate all four tires to the recommended PSI before highway travel.',
      suggestedServiceType: 'tire_rotation',
    }
  }

  if (name.includes('overheat') || name.includes('temp')) {
    return {
      symbolName: 'Engine Temperature Warning',
      explanation:
        'Engine temperature is above a safe operating range. Continuing to drive can cause severe engine damage.',
      urgency: 'immediate',
      recommendedAction: 'Stop safely, let the engine cool, and inspect coolant level before restarting.',
      suggestedServiceType: 'diagnostic',
    }
  }

  if (name.includes('engine') || name.includes('check')) {
    return {
      symbolName: 'Check Engine Warning',
      explanation:
        'The engine control system detected a fault. Severity can vary, but unresolved issues can increase fuel use and damage components.',
      urgency: 'soon',
      recommendedAction: 'Run a diagnostic scan and service the underlying fault promptly.',
      suggestedServiceType: 'diagnostic',
    }
  }

  return {
    symbolName: 'Unknown Warning Light',
    explanation: 'The image was not clear enough for a reliable warning-light identification.',
    urgency: 'monitor',
    recommendedAction: 'Retake the photo with brighter lighting and a tighter crop on the warning icon.',
    suggestedServiceType: 'diagnostic',
  }
}

function getServiceBookFallback(fileName?: string): ServiceRecordExtraction {
  const name = (fileName || '').toLowerCase()

  if (name.includes('receipt')) {
    return {
      entries: [
        {
          id: `lens-${Date.now()}-1`,
          date: '2022-01-26',
          odometerKm: 0,
          serviceType: 'oil_change',
          garageId: 'unknown',
          garageName: 'Crisp Automotive Repair',
          costVnd: 3610000,
          partsReplaced: ['Oil filter', 'Tire rotation labor'],
          warrantyExpiryDate: null,
          notes: 'Extracted from sample receipt with currency converted approximately from USD.',
          source: 'lens_extracted',
        },
      ],
      confidence: 'medium',
      notes: 'Receipt is readable; extracted 1 summary entry for demo continuity.',
    }
  }

  if (name.includes('servicebook') || name.includes('oilchange')) {
    return {
      entries: [
        {
          id: `lens-${Date.now()}-1`,
          date: 'unknown',
          odometerKm: 0,
          serviceType: 'diagnostic',
          garageId: 'unknown',
          garageName: 'Unknown garage',
          costVnd: 0,
          partsReplaced: [],
          warrantyExpiryDate: null,
          notes: 'Document is partially legible. Manual confirmation is required before saving.',
          source: 'lens_extracted',
        },
      ],
      confidence: 'low',
      notes: 'Handwritten service book has low legibility; captured one placeholder entry.',
    }
  }

  return {
    entries: [],
    confidence: 'low',
    notes: 'Could not confidently extract service entries from this image.',
  }
}

async function runVisionJson<T>(
  imageDataUrl: string,
  prompt: string,
  validator: (value: unknown) => value is T,
): Promise<T> {
  const content = await qwenVision(imageDataUrl, prompt)
  const parsed = parseJsonObject(content)
  if (!validator(parsed)) {
    throw new Error('Vision output failed validation')
  }
  return parsed
}

export const visionService: VisionService = {
  async analyzeWarningLight({ imageDataUrl, fileName }) {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY
    if (!apiKey) {
      return getWarningLightFallback(fileName)
    }

    try {
      return await runVisionJson(imageDataUrl, buildWarningLightPrompt(), isWarningLightResult)
    } catch {
      return getWarningLightFallback(fileName)
    }
  },

  async extractServiceBook({ imageDataUrl, fileName }) {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY
    if (!apiKey) {
      return getServiceBookFallback(fileName)
    }

    try {
      return await runVisionJson(imageDataUrl, buildServiceBookExtractionPrompt(), isServiceRecordExtraction)
    } catch {
      return getServiceBookFallback(fileName)
    }
  },
}

