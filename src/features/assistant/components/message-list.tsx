import { Card } from '../../../components/ui/card'
import type { ChatMessage } from '../../../types/domain'

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-3 rounded-[28px] border border-ink/8 bg-[linear-gradient(180deg,_rgba(248,246,241,0.7)_0%,_rgba(255,255,255,0.85)_100%)] p-3 sm:p-4">
      {messages.map((message) => (
        <div key={message.id} className={message.role === 'assistant' ? 'mr-10' : 'ml-10'}>
          <Card
            className={
              message.role === 'assistant'
                ? 'rounded-[24px] border-ink/6 bg-[linear-gradient(180deg,_rgba(219,234,254,0.58)_0%,_rgba(255,255,255,0.96)_100%)] p-4'
                : 'rounded-[24px] border-ember/10 bg-[linear-gradient(180deg,_rgba(244,239,230,0.95)_0%,_rgba(255,255,255,0.96)_100%)] p-4'
            }
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{message.role === 'assistant' ? 'Copilot' : 'You'}</p>
            <p className="mt-2 text-sm leading-6 text-ink/85">{message.content}</p>
          </Card>
        </div>
      ))}
    </div>
  )
}
