import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { t } from '../../../lib/i18n'
import { useSessionStore } from '../../../store/session-store'
import type { BookingOption } from '../../../types/domain'

export function BookingOptionsList({
  bookingOptions,
  selectedBookingOptionId,
  onSelect,
  onConfirm,
  isConfirming,
}: {
  bookingOptions: BookingOption[]
  selectedBookingOptionId?: string
  onSelect: (bookingOptionId: string) => void
  onConfirm: () => void
  isConfirming: boolean
}) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">{t(uiLanguage, 'booking_tab_slots')}</p>
        <p className="font-display text-[2.35rem] leading-tight">
          {uiLanguage === 'vi' ? 'Khung giờ dịch vụ gần bạn' : 'Nearby service slots'}
        </p>
        <p className="max-w-xl text-sm leading-6 text-ink/65">
          {uiLanguage === 'vi' ? 'Chọn một khung giờ để hoàn tất đặt lịch demo.' : 'Choose one slot to complete the demo booking.'}
        </p>
      </div>
      {bookingOptions.map((option) => {
        const isSelected = selectedBookingOptionId === option.id

        return (
          <Card
            key={option.id}
            className={
              isSelected
                ? 'border-ember bg-[linear-gradient(180deg,_rgba(255,247,240,1)_0%,_rgba(255,255,255,1)_100%)] ring-2 ring-ember/20'
                : 'border-ink/8'
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{option.distanceKm} {uiLanguage === 'vi' ? 'km cách bạn' : 'km away'}</Badge>
                  {isSelected ? <Badge tone="warn">{uiLanguage === 'vi' ? 'Đã chọn' : 'Selected'}</Badge> : null}
                </div>
                <p className="mt-3 font-display text-[1.8rem] leading-tight">{option.providerName}</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{option.serviceName}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-sand/75 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{uiLanguage === 'vi' ? 'Lịch hẹn' : 'Appointment'}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{option.slotLabel}</p>
                  </div>
                  <div className="rounded-[18px] bg-sky/45 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{uiLanguage === 'vi' ? 'Ước tính giá' : 'Price estimate'}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{option.priceEstimate}</p>
                  </div>
                </div>
              </div>
              <Button
                variant={isSelected ? 'secondary' : 'ghost'}
                className="w-full sm:w-auto sm:min-w-[148px]"
                onClick={() => onSelect(option.id)}
              >
                {isSelected ? (uiLanguage === 'vi' ? 'Khung giờ đã chọn' : 'Selected slot') : uiLanguage === 'vi' ? 'Chọn khung giờ' : 'Choose slot'}
              </Button>
            </div>
          </Card>
        )
      })}
      <Card className="border-none bg-[linear-gradient(180deg,_rgba(21,48,74,1)_0%,_rgba(24,61,92,1)_100%)] text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{uiLanguage === 'vi' ? 'Hành động chính' : 'Primary action'}</p>
            <p className="mt-2 font-display text-[2rem] leading-tight">{uiLanguage === 'vi' ? 'Xác nhận lịch đã chọn' : 'Confirm the selected booking'}</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {uiLanguage === 'vi'
                ? 'Khung giờ đã chọn sẽ được giữ trong 15 phút. Xác nhận để chốt lịch.'
                : 'Your selected slot will be held for 15 minutes. Confirm to lock it in.'}
            </p>
          </div>
          <Button
            onClick={onConfirm}
            disabled={!selectedBookingOptionId || isConfirming}
            className="bg-white text-ink hover:bg-sand"
          >
            {isConfirming ? (uiLanguage === 'vi' ? 'Đang xác nhận...' : 'Confirming...') : uiLanguage === 'vi' ? 'Xác nhận đặt lịch' : 'Confirm booking'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
