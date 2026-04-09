import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistantService } from '../../../lib/api/adapters/mock-assistant-service'
import { queryKeys } from '../../../lib/query/keys'
import { useSessionStore } from '../../../store/session-store'
import type { ChatMessage } from '../../../types/domain'

export function useAssistantChat() {
  const queryClient = useQueryClient()
  const vehicleId = useSessionStore((state) => state.activeVehicleId)

  const conversationQuery = useQuery({
    queryKey: queryKeys.conversation(vehicleId),
    queryFn: () => assistantService.getConversation(vehicleId),
  })

  const sendMutation = useMutation({
    mutationFn: (message: string) => assistantService.sendMessage({ vehicleId, message }),
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
    },
    onSuccess: (reply) => {
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId)) ?? []
      queryClient.setQueryData<ChatMessage[]>(queryKeys.conversation(vehicleId), [...previous, reply.message])
    },
  })

  return {
    messages: conversationQuery.data ?? [],
    isLoading: conversationQuery.isLoading,
    isSending: sendMutation.isPending,
    sendMessage: (message: string) => sendMutation.mutate(message),
    followUpSuggestions: sendMutation.data?.followUpSuggestions ?? [
      'What happens if I delay this service?',
      'Explain the battery recommendation',
      'Find the fastest option today',
    ],
  }
}
