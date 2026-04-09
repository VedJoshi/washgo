import { seededConversation } from '../../mocks/chat'
import { delay } from '../../utils/delay'
import type { AssistantReply } from '../../../types/domain'
import type { AssistantService } from '../services/assistant-service'

function buildReply(message: string): AssistantReply {
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

export const assistantService: AssistantService = {
  async getConversation() {
    await delay(280)
    return seededConversation
  },
  async sendMessage({ message }) {
    await delay(420)
    // TODO: Replace with real Tasco assistant API and streaming responses.
    return buildReply(message)
  },
}
