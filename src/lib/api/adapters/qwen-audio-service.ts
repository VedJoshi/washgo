import { qwenAudioTranscription, qwenAudioTranscriptionViaChat } from '../../qwen/client'
import type { AudioService, AudioTranscriptionResult } from '../services/audio-service'

function parseTranscriptionPayload(payload: unknown): AudioTranscriptionResult | null {
  if (!payload || typeof payload !== 'object') return null

  const data = payload as Record<string, unknown>
  const results = Array.isArray(data.results) ? data.results : []
  const firstResult = (results[0] && typeof results[0] === 'object') ? (results[0] as Record<string, unknown>) : null
  const output = (data.output && typeof data.output === 'object') ? (data.output as Record<string, unknown>) : null

  const textCandidates = [
    data.text,
    data.transcript,
    output?.text,
    output?.transcript,
    firstResult?.text,
  ]
  const text = textCandidates.find((value) => typeof value === 'string' && value.trim().length > 0)
  if (typeof text !== 'string') return null

  const confidenceCandidates = [
    data.confidence,
    firstResult?.confidence,
  ]
  const confidence = confidenceCandidates.find((value) => typeof value === 'number')

  return {
    text: text.trim(),
    confidence: typeof confidence === 'number' ? confidence : undefined,
  }
}

function parseCompatibleChatPayload(payload: unknown): AudioTranscriptionResult | null {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as Record<string, unknown>
  const choices = Array.isArray(data.choices) ? data.choices : []
  const firstChoice = choices[0] && typeof choices[0] === 'object' ? (choices[0] as Record<string, unknown>) : null
  const message = firstChoice?.message && typeof firstChoice.message === 'object'
    ? (firstChoice.message as Record<string, unknown>)
    : null

  if (!message) return null
  const content = message.content
  if (typeof content === 'string' && content.trim().length > 0) {
    return { text: content.trim() }
  }
  if (Array.isArray(content)) {
    const textPart = content.find(
      (item) => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).text === 'string',
    ) as Record<string, unknown> | undefined
    if (textPart && typeof textPart.text === 'string' && textPart.text.trim().length > 0) {
      return { text: textPart.text.trim() }
    }
  }
  return null
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return `data:${blob.type || 'audio/webm'};base64,${base64}`
}

export const audioService: AudioService = {
  async transcribeAudio({ blob, mimeType, language }) {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY
    const configuredModel = import.meta.env.VITE_QWEN_STT_MODEL as string | undefined
    const primaryModel = configuredModel || 'qwen3-asr-flash'
    if (!apiKey) {
      throw new Error('Voice transcription is not configured. Add VITE_QWEN_API_KEY.')
    }

    const normalizedMimeType = mimeType.startsWith('audio/') ? mimeType : 'audio/webm'
    const normalizedBlob = blob.type === normalizedMimeType ? blob : new Blob([blob], { type: normalizedMimeType })

    try {
      const payload = await qwenAudioTranscription(normalizedBlob, {
        model: primaryModel,
        language,
      })
      const parsed = parseTranscriptionPayload(payload)
      if (parsed) {
        return parsed
      }
    } catch {
      // Fallback below
    }

    const dataUrl = await blobToDataUrl(normalizedBlob)
    const fallbackModels = primaryModel === 'qwen3-asr-flash' ? [primaryModel] : [primaryModel, 'qwen3-asr-flash']
    let lastError: Error | null = null

    for (const model of fallbackModels) {
      try {
        const payload = await qwenAudioTranscriptionViaChat(dataUrl, {
          model,
          language,
        })
        const parsed = parseCompatibleChatPayload(payload)
        if (parsed) {
          return parsed
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown STT error')
      }
    }

    throw lastError ?? new Error('Qwen STT returned an unreadable response format.')
  },
}
