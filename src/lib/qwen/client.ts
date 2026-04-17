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

export type QwenResponse =
  | { kind: 'content'; content: string }
  | { kind: 'tool_calls'; toolCalls: ToolCall[] }

interface QwenChatOptions {
  model: string
  jsonMode?: boolean
  tools?: ToolDefinition[]
  temperature?: number
  maxTokens?: number
}

function buildAuthHeaders(): HeadersInit {
  if (!API_KEY) {
    throw new Error('VITE_QWEN_API_KEY is not set')
  }
  return {
    Authorization: `Bearer ${API_KEY}`,
  }
}

function buildHeaders(): HeadersInit {
  const authHeaders = buildAuthHeaders()
  return {
    ...authHeaders,
    'Content-Type': 'application/json',
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
): Promise<QwenResponse> {
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
    return {
      kind: 'tool_calls',
      toolCalls: choice.message.tool_calls.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    }
  }

  return { kind: 'content', content: choice.message.content || '' }
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

  interface ToolCallAccumulator {
    id: string
    name: string
    argsBuffer: string
  }

  const toolCallMap = new Map<number, ToolCallAccumulator>()

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
              const index = tc.index ?? 0
              let acc = toolCallMap.get(index)
              if (!acc) {
                acc = { id: '', name: '', argsBuffer: '' }
                toolCallMap.set(index, acc)
              }
              if (tc.id) acc.id = tc.id
              if (tc.function?.name) acc.name = tc.function.name
              if (tc.function?.arguments) acc.argsBuffer += tc.function.arguments
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

    for (const acc of toolCallMap.values()) {
      if (acc.id && acc.name) {
        try {
          yield {
            id: acc.id,
            name: acc.name,
            arguments: acc.argsBuffer ? JSON.parse(acc.argsBuffer) : {},
          }
        } catch {
          console.warn('[Qwen Stream] Failed to parse tool call arguments:', acc.argsBuffer)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function qwenVision(imageDataUrl: string, prompt: string): Promise<string> {
  const model = import.meta.env.VITE_QWEN_VISION_MODEL || 'qwen-vl-max'

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: imageDataUrl },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    },
  ]

  const response = await qwenChat(messages, {
    model,
    jsonMode: true,
    temperature: 0.3,
  })

  if (response.kind === 'tool_calls') {
    throw new Error('Unexpected tool_calls response from vision model')
  }

  return response.content
}

export async function qwenAudioTranscription(
  audioBlob: Blob,
  options: { model: string; language?: 'en' | 'vi' },
): Promise<unknown> {
  const formData = new FormData()
  const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm'
  formData.append('file', audioBlob, `voice-input.${extension}`)
  formData.append('model', options.model)
  if (options.language) {
    formData.append('language', options.language)
  }

  const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Qwen audio transcription error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export async function qwenAudioTranscriptionViaChat(
  audioDataUrl: string,
  options: { model: string; language?: 'en' | 'vi' },
): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'input_audio',
            input_audio: {
              data: audioDataUrl,
            },
          },
        ],
      },
    ],
    stream: false,
  }

  if (options.language) {
    body.asr_options = {
      language: options.language,
    }
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Qwen ASR via chat error (${response.status}): ${errorText}`)
  }

  return response.json()
}
