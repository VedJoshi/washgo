import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { t } from '../../../lib/i18n'
import { garages } from '../../../lib/mocks/garages'
import { useSessionStore } from '../../../store/session-store'
import { Spinner } from '../../../components/ui/spinner'
import { useAssistantChat } from '../hooks/use-assistant-chat'
import { ChatInput } from './chat-input'
import { MessageList } from './message-list'
import { SuggestionChips } from './suggestion-chips'
import { ToolCallIndicator } from './tool-call-indicator'

export function ChatPanel() {
  const selectedGarageId = useSessionStore((state) => state.selectedGarageId)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)
  const serviceFinderServiceType = useSessionStore((state) => state.serviceFinderServiceType)
  const setSelectedGarageId = useSessionStore((state) => state.setSelectedGarageId)
  const selectedGarage = garages.find((garage) => garage.id === selectedGarageId)
  const { messages, isLoading, isSending, isStreaming, toolActivities, sendMessage, followUpSuggestions } = useAssistantChat()

  if (isLoading) {
    return <Spinner label={t(uiLanguage, 'assistant_spinner_opening')} />
  }

  return (
    <Card className="space-y-5 overflow-hidden p-4 sm:p-6">
      <div className="rounded-[26px] border border-ink/8 bg-[linear-gradient(135deg,_rgba(244,239,230,0.7)_0%,_rgba(255,255,255,0.92)_100%)] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">{t(uiLanguage, 'assistant_label')}</p>
        <p className="mt-2 font-display text-[2.15rem] leading-tight">{t(uiLanguage, 'assistant_title')}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          {t(uiLanguage, 'assistant_subtitle')}
        </p>
      </div>
      {selectedGarage ? (
        <div className="rounded-[22px] border border-sky/30 bg-[linear-gradient(135deg,_rgba(219,234,254,0.62)_0%,_rgba(255,255,255,0.98)_100%)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">{t(uiLanguage, 'assistant_map_context')}</p>
              <p className="font-semibold text-ink">{selectedGarage.name}</p>
              <p className="text-sm text-ink/70">{selectedGarage.address}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">
                  {serviceFinderServiceType === 'car_wash' ? t(uiLanguage, 'booking_service_wash') : t(uiLanguage, 'booking_service_repair')}
                </Badge>
                <Badge tone="good">{t(uiLanguage, 'assistant_rating')} {selectedGarage.rating}</Badge>
                <Badge tone="neutral">{t(uiLanguage, 'assistant_warranty_days', { days: selectedGarage.warrantyDays })}</Badge>
              </div>
              <p className="text-xs text-ink/55">{t(uiLanguage, 'assistant_context_autorun')}</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedGarageId(undefined)}>
              {t(uiLanguage, 'assistant_clear_context')}
            </Button>
          </div>
        </div>
      ) : null}
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ToolCallIndicator activities={toolActivities} />
      <SuggestionChips suggestions={followUpSuggestions} onSelect={sendMessage} />
      <ChatInput isSending={isSending} onSend={sendMessage} />
    </Card>
  )
}
