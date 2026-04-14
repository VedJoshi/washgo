import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistantService, sendMessageStreaming } from '../../../lib/api/adapters/qwen-assistant-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'
import type { ChatMessage } from '../../../types/domain'

export function useAssistantChat() {
  const queryClient = useQueryClient()
  const vehicleId = useSessionStore((state) => state.activeVehicleId)
  const pendingAssistantPrompt = useSessionStore((state) => state.pendingAssistantPrompt)
  const clearPendingAssistantPrompt = useSessionStore((state) => state.clearPendingAssistantPrompt)
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolActivities, setToolActivities] = useState<string[]>([])
  const streamingMessageIdRef = useRef<string | null>(null)

  const conversationQuery = useQuery({
    queryKey: queryKeys.conversation(vehicleId),
    queryFn: () => assistantService.getConversation(vehicleId),
  })

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const currentMessages = queryClient.getQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId)) ?? []
      const messageId = `assistant-${Date.now()}`
      streamingMessageIdRef.current = messageId
      setStreamingContent('')
      setToolActivities([])
      setIsStreaming(true)

      const reply = await sendMessageStreaming(
        vehicleId,
        message,
        currentMessages,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk)
        },
        (activity) => {
          setToolActivities((prev) => {
            if (prev[prev.length - 1] === activity) {
              return prev
            }
            return [...prev, activity]
          })
        },
      )

      setIsStreaming(false)
      streamingMessageIdRef.current = null
      setStreamingContent('')
      return reply
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversation(vehicleId) })
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId)) ?? []
      const optimisticMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId), [...previous, optimisticMessage])
      return { previous }
    },
    onError: (_error, _message, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.conversation(vehicleId), context.previous)
      }
      setIsStreaming(false)
      setStreamingContent('')
      setToolActivities([])
    },
    onSuccess: (reply) => {
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId)) ?? []
      queryClient.setQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId), [...previous, reply.message])
    },
  })

  const getMessagesWithStreaming = useCallback(() => {
    const messages = conversationQuery.data ?? []
    if (!isStreaming || !streamingContent) return messages

    const streamingMessage: ChatMessage = {
      id: streamingMessageIdRef.current || `assistant-streaming-${Date.now()}`,
      role: 'assistant',
      content: streamingContent,
      createdAt: new Date().toISOString(),
    }

    return [...messages, streamingMessage]
  }, [conversationQuery.data, isStreaming, streamingContent])

  useEffect(() => {
    if (!pendingAssistantPrompt) return
    if (sendMutation.isPending || isStreaming) return

    clearPendingAssistantPrompt()
    sendMutation.mutate(pendingAssistantPrompt)
  }, [clearPendingAssistantPrompt, isStreaming, pendingAssistantPrompt, sendMutation])

  return {
    messages: getMessagesWithStreaming(),
    isLoading: conversationQuery.isLoading,
    isSending: sendMutation.isPending || isStreaming,
    isStreaming,
    toolActivities,
    sendMessage: (message: string) => sendMutation.mutate(message),
    followUpSuggestions: sendMutation.data?.followUpSuggestions ?? [
      'What happens if I delay this service?',
      'Explain the battery recommendation',
      'Find the fastest option today',
    ],
  }
}
