import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">Booking</p>
        <p className="font-display text-[2.35rem] leading-tight">Nearby service slots</p>
        <p className="max-w-xl text-sm leading-6 text-ink/65">Choose one slot to complete the demo booking.</p>
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
                  <Badge tone="neutral">{option.distanceKm} km away</Badge>
                  {isSelected ? <Badge tone="warn">Selected</Badge> : null}
                </div>
                <p className="mt-3 font-display text-[1.8rem] leading-tight">{option.providerName}</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{option.serviceName}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-sand/75 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Appointment</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{option.slotLabel}</p>
                  </div>
                  <div className="rounded-[18px] bg-sky/45 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Price estimate</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{option.priceEstimate}</p>
                  </div>
                </div>
              </div>
              <Button
                variant={isSelected ? 'secondary' : 'ghost'}
                className="w-full sm:w-auto sm:min-w-[148px]"
                onClick={() => onSelect(option.id)}
              >
                {isSelected ? 'Selected slot' : 'Choose slot'}
              </Button>
            </div>
          </Card>
        )
      })}
      <Card className="border-none bg-[linear-gradient(180deg,_rgba(21,48,74,1)_0%,_rgba(24,61,92,1)_100%)] text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Primary action</p>
            <p className="mt-2 font-display text-[2rem] leading-tight">Confirm the selected booking</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Keep the final step simple and explicit so the demo lands as a complete user journey.
            </p>
          </div>
          <Button
            onClick={onConfirm}
            disabled={!selectedBookingOptionId || isConfirming}
            className="bg-white text-ink hover:bg-sand"
          >
            {isConfirming ? 'Confirming...' : 'Confirm booking'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
