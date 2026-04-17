import { useEffect, useState } from 'react'
import { fetchBookingBrief } from '../../../lib/api/adapters/qwen-booking-service'
import type { BookingBrief } from '../../../lib/api/adapters/qwen-booking-service'
import type { ServiceRecommendation } from '../../../types/domain'

export function useBookingBrief(recommendation: ServiceRecommendation | undefined) {
  const [brief, setBrief] = useState<BookingBrief | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!recommendation) return
    setIsLoading(true)
    setBrief(null)
    fetchBookingBrief(recommendation)
      .then(setBrief)
      .finally(() => setIsLoading(false))
  }, [recommendation?.id])

  return { brief, isLoading }
}
