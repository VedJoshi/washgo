import { activeVehicle } from '../../mocks/vehicle'
import { vehicleHealth } from '../../mocks/recommendations'
import { carHealthRecord } from '../../mocks/car-health-record'
import { seededConversation } from '../../mocks/chat'
import { delay } from '../../utils/delay'
import { qwenChat } from '../../qwen/client'
import { buildAssistantSystemPrompt } from '../../qwen/prompts'
import { allTools, dispatchToolCall, getToolLabel } from '../../qwen/tools'
import type { AssistantService } from '../services/assistant-service'
import type { AssistantReply, ChatMessage } from '../../../types/domain'
import type { ChatMessage as QwenChatMessage } from '../../qwen/client'
import { useSessionStore } from '../../../store/session-store'

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

async function fetchNonStreamingReply(
  conversationHistory: QwenChatMessage[],
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

function toConversationHistory(messages: ChatMessage[]): QwenChatMessage[] {
  return messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

function streamTextContent(content: string, onChunk: (chunk: string) => void) {
  const parts = content.split(/(\s+)/).filter(Boolean)
  for (const part of parts) {
    onChunk(part)
  }
}

async function runAssistantToolLoop(
  conversationHistory: QwenChatMessage[],
  onToolActivity?: (activity: string) => void,
): Promise<string> {
  const model = import.meta.env.VITE_QWEN_TEXT_MODEL || 'qwen-max'
  const messages: QwenChatMessage[] = [...conversationHistory]

  for (let round = 1; round <= 5; round += 1) {
    const response = await qwenChat(messages, {
      model,
      temperature: 0.7,
      tools: allTools,
    })

    if (response.kind === 'content' && response.content.trim()) {
      return response.content
    }

    if (response.kind !== 'tool_calls' || response.toolCalls.length === 0) {
      break
    }

    console.log(
      `[Qwen Assistant] tool round ${round}`,
      response.toolCalls.map((toolCall) => toolCall.name),
    )

    messages.push({
      role: 'assistant',
      content: '',
      tool_calls: response.toolCalls.map((toolCall) => ({
        id: toolCall.id,
        type: 'function',
        function: {
          name: toolCall.name,
          arguments: JSON.stringify(toolCall.arguments),
        },
      })),
    })

    for (const toolCall of response.toolCalls) {
      const label = getToolLabel(toolCall.name)
      onToolActivity?.(label)

      let toolResult: unknown
      try {
        toolResult = await dispatchToolCall(toolCall.name, toolCall.arguments)
      } catch (error) {
        console.warn(`[Qwen Assistant] tool ${toolCall.name} failed`, error)
        toolResult = { error: error instanceof Error ? error.message : 'Unknown tool execution error' }
      }

      console.log(`[Qwen Assistant] tool ${toolCall.name} result`, toolResult)
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      })
    }
  }

  return 'I can help with that, but I could not complete the full action flow right now. Please try once more and I will retry nearby services and booking options.'
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

    const conversationHistory = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ]

    try {
      const content = await runAssistantToolLoop(conversationHistory)
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
  onToolActivity?: (activity: string) => void,
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

  const conversationHistory: QwenChatMessage[] = [
    { role: 'system' as const, content: systemPrompt },
    ...toConversationHistory(existingMessages),
    { role: 'user' as const, content: message },
  ]

  try {
    const content = await runAssistantToolLoop(conversationHistory, onToolActivity)
    streamTextContent(content, onChunk)
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
      streamTextContent(content, onChunk)
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
