import { Fragment, type ReactNode, useEffect, useRef } from 'react'
import { Card } from '../../../components/ui/card'
import { t } from '../../../lib/i18n'
import { cn } from '../../../lib/utils/cn'
import { useSessionStore } from '../../../store/session-store'
import type { ChatMessage } from '../../../types/domain'

function formatAssistantText(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/(?<!\n)(\d+\.\s+\*\*[^*]+\*\*:)/g, '\n$1')
    .replace(/(?<!\n)([-*]\s+\*\*[^*]+\*\*:)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={`${token}-${index}`} className="font-semibold text-ink/95">
          {token.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={`${token}-${index}`}>{token}</Fragment>
  })
}

function renderAssistantContent(content: string) {
  const normalized = formatAssistantText(content)
  const lines = normalized.split('\n')
  const nodes: ReactNode[] = []
  let listBuffer: Array<{ type: 'ordered' | 'unordered'; text: string }> = []

  const flushList = () => {
    if (!listBuffer.length) return
    const listType = listBuffer[0].type
    if (listType === 'ordered') {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="list-decimal space-y-1.5 pl-5">
          {listBuffer.map((item, idx) => (
            <li key={`${item.text}-${idx}`} className="leading-7">
              {renderInline(item.text)}
            </li>
          ))}
        </ol>,
      )
    } else {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc space-y-1.5 pl-5">
          {listBuffer.map((item, idx) => (
            <li key={`${item.text}-${idx}`} className="leading-7">
              {renderInline(item.text)}
            </li>
          ))}
        </ul>,
      )
    }
    listBuffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      listBuffer.push({ type: 'ordered', text: orderedMatch[1] })
      continue
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/)
    if (unorderedMatch) {
      listBuffer.push({ type: 'unordered', text: unorderedMatch[1] })
      continue
    }

    flushList()
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-7">
        {renderInline(line)}
      </p>,
    )
  }

  flushList()
  return nodes.length ? nodes : [<p key="fallback">{content}</p>]
}

export function MessageList({ messages, isStreaming }: { messages: ChatMessage[]; isStreaming: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="space-y-3 max-h-[480px] overflow-y-auto rounded-[28px] border border-ink/8 bg-[linear-gradient(180deg,_rgba(248,246,241,0.7)_0%,_rgba(255,255,255,0.85)_100%)] p-3 sm:p-4">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1
        const showCursor = isLast && isStreaming && message.role === 'assistant'

        return (
          <div
            key={message.id}
            className={cn('flex', message.role === 'assistant' ? 'justify-start pr-8' : 'justify-end pl-8')}
          >
            <Card
              className={
                message.role === 'assistant'
                  ? 'w-fit max-w-[92%] rounded-[24px] border-ink/6 bg-[linear-gradient(180deg,_rgba(219,234,254,0.58)_0%,_rgba(255,255,255,0.96)_100%)] p-4'
                  : 'w-fit max-w-[74%] rounded-[24px] border-ember/10 bg-[linear-gradient(180deg,_rgba(244,239,230,0.95)_0%,_rgba(255,255,255,0.96)_100%)] px-4 py-3'
              }
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">
                {message.role === 'assistant' ? t(uiLanguage, 'assistant_qwen') : t(uiLanguage, 'assistant_you')}
              </p>
              {message.role === 'assistant' ? (
                <div className="mt-2 space-y-2 text-sm text-ink/85">
                  {renderAssistantContent(message.content)}
                  {showCursor && (
                    <span className="inline-block h-4 w-0.5 animate-pulse align-text-bottom bg-ink/60" />
                  )}
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink/85">
                  {message.content}
                  {showCursor && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse align-text-bottom bg-ink/60" />
                  )}
                </p>
              )}
            </Card>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
