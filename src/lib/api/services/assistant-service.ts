import type { AssistantReply, ChatMessage } from '../../../types/domain'

export interface AssistantService {
  getConversation(vehicleId: string): Promise<ChatMessage[]>
  sendMessage(input: {
    vehicleId: string
    message: string
  }): Promise<AssistantReply>
}
