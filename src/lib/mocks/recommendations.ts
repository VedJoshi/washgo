import type { VehicleHealth } from '../../types/domain'

export const vehicleHealth: VehicleHealth = {
  vehicleId: 'vehicle-01',
  score: 72,
  status: 'watch',
  issues: [
    'Oil change interval approaching — 2,300 km driven since last service on 2026-01-15.',
    'Battery strain detected from repeated short urban trips and frequent idle time in traffic.',
    'Tire tread wear is uneven — front tires showing more wear than rears after last rotation in October.',
  ],
  recommendations: [
    {
      id: 'rec-1',
      category: 'oil',
      title: 'Schedule an oil change soon',
      description:
        'Your Vios has driven 2,300 km since the last oil change. Plan a service within the next 2,700 km to stay within the 5,000 km interval.',
      issue: 'Last oil change was on 2026-01-15 at 36,200 km. Current odometer reads 38,500 km — approaching the 5,000 km recommended interval.',
      impact: 'Staying on schedule prevents engine wear, maintains fuel efficiency, and keeps warranty coverage valid on your Vios.',
      actionLabel: 'Book oil change',
      urgency: 'high',
      estimatedPriceRange: '650,000-900,000 VND',
      recommendedWithinDays: 10,
    },
    {
      id: 'rec-2',
      category: 'battery',
      title: 'Book a battery diagnostic check',
      description:
        'Battery performance appears degraded from city-heavy driving patterns. A quick diagnostic can prevent a no-start situation.',
      issue: 'Repeated short trips and heavy idle time in HCMC traffic prevent the alternator from fully recharging the battery.',
      impact: 'A failing battery can leave you stranded. Early detection costs less than an emergency replacement.',
      actionLabel: 'Reserve battery diagnostic',
      urgency: 'medium',
      estimatedPriceRange: '350,000-550,000 VND',
      recommendedWithinDays: 7,
    },
    {
      id: 'rec-3',
      category: 'tires',
      title: 'Check tire pressure and alignment',
      description:
        'Front tire wear is uneven since the last rotation. A pressure check and alignment will extend tire life.',
      issue: 'Front tires show 15% more wear than rears, likely from pothole exposure on urban roads.',
      impact: 'Uneven tire wear reduces grip, increases fuel consumption, and shortens overall tire lifespan.',
      actionLabel: 'Schedule tire inspection',
      urgency: 'low',
      estimatedPriceRange: '200,000-400,000 VND',
      recommendedWithinDays: 14,
    },
  ],
}
