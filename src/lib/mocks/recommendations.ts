import type { VehicleHealth } from '../../types/domain'

export const vehicleHealth: VehicleHealth = {
  vehicleId: 'vehicle-01',
  score: 78,
  status: 'watch',
  issues: [
    'Battery performance appears slightly below expected range for recent city-heavy driving.',
    'Oil change window is approaching within the next 2,790 km.',
    'Tire pressure should be checked before your next weekend highway trip.',
  ],
  recommendations: [
    {
      id: 'rec-1',
      category: 'inspection',
      title: 'Book a battery and fluid check',
      description:
        'Run a quick workshop diagnostic and top up key fluids before the battery drops further under city-heavy use.',
      issue: 'Battery performance is slipping after repeated short urban trips and heavier idle time.',
      impact: 'If left alone, the car is more likely to feel sluggish on starts and less reliable over the next few days.',
      actionLabel: 'Reserve a battery diagnostic',
      urgency: 'high',
      estimatedPriceRange: '450,000-700,000 VND',
      recommendedWithinDays: 3,
    },
    {
      id: 'rec-2',
      category: 'oil',
      title: 'Schedule the next routine maintenance slot',
      description:
        'Bundle the upcoming oil service with a light inspection so the next maintenance decision stays planned, not reactive.',
      issue: 'The next maintenance interval is approaching and fluid condition should be checked before the mileage window closes.',
      impact: 'Pushing it too far increases wear risk and makes the next workshop visit more expensive than it needs to be.',
      actionLabel: 'Plan the next service visit',
      urgency: 'medium',
      estimatedPriceRange: '1,100,000-1,600,000 VND',
      recommendedWithinDays: 10,
    },
  ],
}
