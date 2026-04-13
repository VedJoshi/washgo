const BASE_URL =
  import.meta.env.VITE_QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
const API_KEY = import.meta.env.VITE_QWEN_API_KEY || ''

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

interface QwenChatOptions {
  model: string
  jsonMode?: boolean
  tools?: ToolDefinition[]
  temperature?: number
  maxTokens?: number
}

function buildHeaders(): HeadersInit {
  if (!API_KEY) {
    throw new Error('VITE_QWEN_API_KEY is not set')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

function buildBody(messages: ChatMessage[], options: QwenChatOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages,
    temperature: options.temperature ?? 0.7,
  }

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools
    body.tool_choice = 'auto'
  }

  if (options.maxTokens) {
    body.max_tokens = options.maxTokens
  }

  return body
}

export async function qwenChat(
  messages: ChatMessage[],
  options: QwenChatOptions,
): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(buildBody(messages, options)),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Qwen API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]

  if (!choice?.message) {
    throw new Error('Unexpected Qwen response format')
  }

  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    return JSON.stringify({
      tool_calls: choice.message.tool_calls.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    })
  }

  return choice.message.content || ''
}

export async function* qwenChatStream(
  messages: ChatMessage[],
  options: QwenChatOptions,
): AsyncGenerator<string | ToolCall> {
  const body = buildBody(messages, { ...options, temperature: options.temperature ?? 0.7 })
  body.stream = true

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Qwen streaming error (${response.status}): ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json.choices?.[0]?.delta

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              yield {
                id: tc.id || '',
                name: tc.function?.name || '',
                arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
              }
            }
          }

          if (delta?.content) {
            yield delta.content
          }
        } catch {
          continue
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function qwenVision(
  imageBase64: string,
  prompt: string,
): Promise<string> {
  const model = import.meta.env.VITE_QWEN_VISION_MODEL || 'qwen-vl-max'

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    },
  ]

  return qwenChat(messages, {
    model,
    jsonMode: true,
    temperature: 0.3,
  })
}
