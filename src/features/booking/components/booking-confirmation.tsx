import { CheckCircle2 } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'
import type { BookingConfirmation as BookingConfirmationType } from '../../../types/domain'

export function BookingConfirmation({ confirmation }: { confirmation: BookingConfirmationType }) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  return (
    <Card className="border-none bg-[linear-gradient(135deg,_rgba(43,106,87,1)_0%,_rgba(22,77,62,1)_100%)] text-white">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-white/12 p-3">
          <CheckCircle2 className="h-7 w-7 flex-none" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{uiLanguage === 'vi' ? 'Da xac nhan' : 'Confirmed'}</p>
          <p className="mt-2 font-display text-[2.4rem] leading-tight">{uiLanguage === 'vi' ? 'Dat lich thanh cong' : 'Booking confirmed'}</p>
          <p className="mt-2 text-sm leading-6 text-white/80">
            {confirmation.providerName} - {confirmation.slotLabel}
          </p>
          <div className="mt-5 inline-flex rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{uiLanguage === 'vi' ? 'Ma xac nhan' : 'Confirmation code'}</p>
              <p className="mt-2 font-display text-2xl tracking-[0.16em]">{confirmation.confirmationCode}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
