import { RecommendationCard } from './recommendation-card'
import type { ServiceRecommendation } from '../../../types/domain'

export function RecommendationList({ recommendations }: { recommendations: ServiceRecommendation[] }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Recommended next moves</p>
        <p className="mt-2 font-display text-[2.3rem] leading-tight">What to do from here</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          Each action below adds new context: the fault pattern, why it matters today, the next action, and the decision window.
        </p>
      </div>
      {recommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  )
}
