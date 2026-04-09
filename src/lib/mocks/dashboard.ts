import type { DailyBrief } from '../../types/domain'

export const dashboardBrief: DailyBrief = {
  greeting: 'Good morning, Minh.',
  summary:
    'Your vehicle is in solid shape for today, but the service window is approaching and the battery signal is worth handling before the weekend. One fast booking keeps your daily commute predictable.',
  alerts: [
    {
      id: 'alert-1',
      type: 'maintenance',
      title: 'Service window approaching',
      message: 'Only 2,790 km remain before the recommended maintenance interval.',
      severity: 'medium',
    },
    {
      id: 'alert-2',
      type: 'parking',
      title: 'Frequent short trips detected',
      message: 'Recent stop-and-go driving can accelerate battery wear in city traffic.',
      severity: 'low',
    },
  ],
  suggestedActions: [
    { id: 'qa-1', label: 'Review vehicle insight', href: '/vehicle' },
    { id: 'qa-2', label: 'Book recommended service', href: '/booking' },
    { id: 'qa-3', label: 'Ask the assistant', href: '/assistant' },
  ],
}
