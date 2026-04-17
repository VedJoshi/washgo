import { RecommendationCard } from './recommendation-card'
import { useSessionStore } from '../../../store/session-store'
import { localizeRecommendation } from '../../../lib/localize-recommendation'
import type { ServiceRecommendation } from '../../../types/domain'

export function RecommendationList({ recommendations }: { recommendations: ServiceRecommendation[] }) {
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">{uiLanguage === 'vi' ? 'De xuat tiep theo' : 'Recommended next moves'}</p>
        <p className="mt-2 font-display text-[2.3rem] leading-tight">{uiLanguage === 'vi' ? 'Nen lam gi tiep theo' : 'What to do from here'}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          {uiLanguage === 'vi'
            ? 'Moi hanh dong ben duoi bo sung boi canh loi, muc do anh huong, buoc tiep theo va thoi diem quyet dinh.'
            : 'Each action below adds new context: the fault pattern, why it matters today, the next action, and the decision window.'}
        </p>
      </div>
      {recommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.id} recommendation={localizeRecommendation(recommendation, uiLanguage)} />
      ))}
    </div>
  )
}
