import { Card } from '../../../components/ui/card'
import { Spinner } from '../../../components/ui/spinner'
import { useAssistantChat } from '../hooks/use-assistant-chat'
import { ChatInput } from './chat-input'
import { MessageList } from './message-list'
import { SuggestionChips } from './suggestion-chips'

export function ChatPanel() {
  const { messages, isLoading, isSending, isStreaming, sendMessage, followUpSuggestions } = useAssistantChat()

  if (isLoading) {
    return <Spinner label="Opening the assistant..." />
  }

  return (
    <Card className="space-y-5 overflow-hidden p-4 sm:p-6">
      <div className="rounded-[26px] border border-ink/8 bg-[linear-gradient(135deg,_rgba(244,239,230,0.7)_0%,_rgba(255,255,255,0.92)_100%)] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">Assistant</p>
        <p className="mt-2 font-display text-[2.15rem] leading-tight">Driver assistant</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          Ask about maintenance, timing, and what to do next. Powered by Qwen with streaming responses.
        </p>
      </div>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <SuggestionChips suggestions={followUpSuggestions} onSelect={sendMessage} />
      <ChatInput isSending={isSending} onSend={sendMessage} />
    </Card>
  )
}
