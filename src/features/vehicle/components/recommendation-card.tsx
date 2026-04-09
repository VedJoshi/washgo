import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'
import type { ServiceRecommendation } from '../../../types/domain'

export function RecommendationCard({ recommendation }: { recommendation: ServiceRecommendation }) {
  const setSelectedRecommendationId = useSessionStore((state) => state.setSelectedRecommendationId)
  const tone = recommendation.urgency === 'high' ? 'danger' : recommendation.urgency === 'medium' ? 'warn' : 'good'

  return (
    <Card className="border-ink/8 p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge tone={tone}>{recommendation.urgency} urgency</Badge>
            <div>
              <p className="font-display text-[1.9rem] leading-tight">{recommendation.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">{recommendation.description}</p>
            </div>
          </div>
          <Link to="/booking" onClick={() => setSelectedRecommendationId(recommendation.id)} className="sm:self-start">
            <Button className="w-full gap-2 sm:min-w-[176px]">
              {recommendation.actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[22px] bg-sand/70 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">What is wrong</p>
            <p className="mt-2 text-sm leading-6 text-ink/80">{recommendation.issue}</p>
          </div>
          <div className="rounded-[22px] bg-sky/45 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Why it matters</p>
            <p className="mt-2 text-sm leading-6 text-ink/80">{recommendation.impact}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-ink/8 bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Action to take</p>
            <p className="mt-2 text-base font-semibold text-ink">{recommendation.actionLabel}</p>
          </div>
          <div className="rounded-[22px] border border-ink/8 bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">By when</p>
            <p className="mt-2 text-base font-semibold text-ink">
              Within {recommendation.recommendedWithinDays} days · {recommendation.estimatedPriceRange}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
