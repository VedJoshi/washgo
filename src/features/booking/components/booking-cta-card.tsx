import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'
import type { ServiceRecommendation } from '../../../types/domain'

export function BookingCtaCard({ recommendation }: { recommendation?: ServiceRecommendation }) {
  const setSelectedRecommendationId = useSessionStore((state) => state.setSelectedRecommendationId)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (!recommendation) {
    return null
  }

  return (
    <Card className="border-none bg-[linear-gradient(180deg,_rgba(244,239,230,1)_0%,_rgba(255,250,244,1)_100%)] p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{uiLanguage === 'vi' ? 'Hanh dong uu tien hom nay' : 'Strongest action today'}</p>
      <p className="mt-3 font-display text-[2rem] leading-tight">{recommendation.actionLabel}</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{recommendation.impact}</p>
      <div className="mt-5 rounded-[22px] border border-ink/8 bg-white/70 px-4 py-3 text-sm text-ink/65">
        <span className="font-semibold text-ink">{recommendation.estimatedPriceRange}</span>
        <span className="mx-2 text-ink/30">•</span>
        <span>{uiLanguage === 'vi' ? 'Nen xu ly trong' : 'Best within'} {recommendation.recommendedWithinDays} {uiLanguage === 'vi' ? 'ngay' : 'days'}</span>
      </div>
      <div className="mt-5">
        <Link to="/booking" onClick={() => setSelectedRecommendationId(recommendation.id)}>
          <Button variant="secondary" className="w-full sm:w-auto">
            {uiLanguage === 'vi' ? 'Dat lich dich vu nay' : 'Book this service'}
          </Button>
        </Link>
      </div>
    </Card>
  )
}
