import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth } from '../../mocks/recommendations'
import { carHealthRecord } from '../../mocks/car-health-record'
import { seededConversation } from '../../mocks/chat'
import { delay } from '../../utils/delay'
import { qwenChat, qwenChatStream } from '../../qwen/client'
import { buildAssistantSystemPrompt } from '../../qwen/prompts'
import type { AssistantService } from '../services/assistant-service'
import type { AssistantReply, ChatMessage } from '../../../types/domain'

function generateSuggestions(content: string): string[] {
  const lower = content.toLowerCase()
  if (lower.includes('oil') || lower.includes('service')) {
    return ['How much will it cost?', 'Find the nearest garage', 'Can I delay this?']
  }
  if (lower.includes('battery')) {
    return ['How urgent is this?', 'Compare booking options', 'What signs should I watch for?']
  }
  if (lower.includes('tire') || lower.includes('tyre')) {
    return ['Where can I get them checked?', 'What is the cost?', 'Is it safe to drive?']
  }
  return ['What should I prioritize?', 'Find a nearby service', 'Explain more about this']
}

async function fetchStreamingReply(
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const model = import.meta.env.VITE_QWEN_TEXT_MODEL || 'qwen-max'
  let fullContent = ''

  const stream = qwenChatStream(conversationHistory, {
    model,
    temperature: 0.7,
  })

  for await (const chunk of stream) {
    if (typeof chunk === 'string') {
      fullContent += chunk
      onChunk(chunk)
    }
  }

  return fullContent
}

async function fetchNonStreamingReply(
  conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const model = import.meta.env.VITE_QWEN_TEXT_MODEL || 'qwen-max'

  const response = await qwenChat(conversationHistory, {
    model,
    temperature: 0.7,
  })

  if (response.kind === 'tool_calls') {
    return 'I can help you with that. Let me check the available options for your vehicle.'
  }

  return response.content
}

export const assistantService: AssistantService = {
  async getConversation() {
    await delay(280)
    return seededConversation
  },

  async sendMessage({ vehicleId: _vehicleId, message }) {
    const apiKey = import.meta.env.VITE_QWEN_API_KEY

    if (!apiKey) {
      await delay(420)
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('battery')) {
        return {
          message: {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              'Battery strain looks elevated because recent usage patterns and service timing suggest weaker cold-start stability. Booking a diagnostic this week reduces the risk of a no-start incident.',
            createdAt: new Date().toISOString(),
          },
          followUpSuggestions: ['How urgent is this?', 'Compare booking options', 'What signs should I watch for?'],
        }
      }
      if (lowerMessage.includes('delay') || lowerMessage.includes('later')) {
        return {
          message: {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              'You can delay briefly, but the tradeoff is higher wear and less predictable downtime. For the demo, I would recommend booking the earliest low-friction slot and framing it as preventative action.',
            createdAt: new Date().toISOString(),
          },
          followUpSuggestions: ['Show me the fastest slot', 'Summarize the risk', 'Why this recommendation?'],
        }
      }
      return {
        message: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content:
            "Based on today's vehicle signals, the best next move is to act on the top recommendation and secure a nearby service slot. The flow is optimized for quick decision-making and daily engagement.",
          createdAt: new Date().toISOString(),
        },
        followUpSuggestions: ['Explain the recommendation', 'Find the fastest option today', 'Can I postpone this?'],
      }
    }

    const systemPrompt = buildAssistantSystemPrompt(
      activeVehicle,
      vehicleHealth,
      carHealthRecord,
      null,
      new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      'Ho Chi Minh City, District 1',
    )

    const conversationHistory = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ]

    try {
      const content = await fetchNonStreamingReply(conversationHistory)
      return {
        message: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
          createdAt: new Date().toISOString(),
        },
        followUpSuggestions: generateSuggestions(content),
      }
    } catch (error) {
      console.warn('[Qwen Assistant] API call failed, falling back to mock:', error)
      await delay(420)
      return {
        message: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting right now, but based on your vehicle's current state, I'd recommend checking the top service recommendation.",
          createdAt: new Date().toISOString(),
        },
        followUpSuggestions: ['Try again', 'Show me recommendations', 'What is my health score?'],
      }
    }
  },
}

export async function sendMessageStreaming(
  _vehicleId: string,
  message: string,
  existingMessages: ChatMessage[],
  onChunk: (chunk: string) => void,
): Promise<AssistantReply> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY

  if (!apiKey) {
    await delay(420)
    return {
      message: {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm running in mock mode. Your vehicle looks good overall, but I'd recommend staying on top of the next service window.",
        createdAt: new Date().toISOString(),
      },
      followUpSuggestions: ['What is my health score?', 'Find a nearby garage', 'Can I delay service?'],
    }
  }

  const systemPrompt = buildAssistantSystemPrompt(
    activeVehicle,
    vehicleHealth,
    carHealthRecord,
    null,
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    'Ho Chi Minh City, District 1',
  )

  const conversationHistory = [
    { role: 'system' as const, content: systemPrompt },
    ...existingMessages.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const content = await fetchStreamingReply(conversationHistory, onChunk)
    return {
      message: {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
      },
      followUpSuggestions: generateSuggestions(content),
    }
  } catch (error) {
    console.warn('[Qwen Assistant Streaming] Failed, falling back to non-stream:', error)
    try {
      const content = await fetchNonStreamingReply(conversationHistory)
      return {
        message: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
          createdAt: new Date().toISOString(),
        },
        followUpSuggestions: generateSuggestions(content),
      }
    } catch {
      return {
        message: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again.",
          createdAt: new Date().toISOString(),
        },
        followUpSuggestions: ['Try again', 'Show me recommendations'],
      }
    }
  }
}
