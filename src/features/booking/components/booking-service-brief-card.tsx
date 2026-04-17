import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { bookingOptions } from '../../../lib/mocks/booking'
import { useSessionStore } from '../../../store/session-store'
import { useBookingBrief } from '../hooks/use-booking-brief'
import type { ServiceRecommendation } from '../../../types/domain'

export function BookingServiceBriefCard({ recommendation }: { recommendation: ServiceRecommendation | undefined }) {
  const { brief, isLoading } = useBookingBrief(recommendation)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (!recommendation) return null

  if (isLoading) {
    return (
      <Card className="space-y-3 border-none bg-[linear-gradient(180deg,_rgba(244,239,230,1)_0%,_rgba(255,252,248,1)_100%)]">
        <div className="h-5 w-36 animate-pulse rounded-full bg-ink/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[18px] bg-ink/6" />
          ))}
        </div>
      </Card>
    )
  }

  if (!brief) return null

  const recommendedSlot = bookingOptions.find((s) => s.id === brief.recommendedSlotId)

  return (
    <Card className="border-none bg-[linear-gradient(180deg,_rgba(244,239,230,1)_0%,_rgba(255,252,248,1)_100%)]">
      <div className="mb-4">
        <Badge tone="warn">{uiLanguage === 'vi' ? 'Tom tat dich vu tu Qwen' : 'Qwen service brief'}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">{uiLanguage === 'vi' ? 'Vi sao nen lam ngay' : 'Why now'}</p>
          <p className="mt-2 text-sm leading-6 text-ink">{brief.whyNow}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">{uiLanguage === 'vi' ? 'Noi voi tho may' : 'Tell your mechanic'}</p>
          <p className="mt-2 text-sm leading-6 text-ink">{brief.mechanicTip}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">{uiLanguage === 'vi' ? 'Khung gio de xuat' : 'Recommended slot'}</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {recommendedSlot?.slotLabel ?? brief.recommendedSlotId}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/60">{brief.slotReason}</p>
        </div>
        <div className="rounded-[18px] border border-ink/8 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">{uiLanguage === 'vi' ? 'Thoi gian du kien' : 'Estimated time'}</p>
          <p className="mt-2 text-sm font-semibold text-ink">{brief.estimatedDuration}</p>
        </div>
      </div>
    </Card>
  )
}
