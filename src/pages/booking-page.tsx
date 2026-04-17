import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui/empty-state'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { BookingConfirmation } from '../features/booking/components/booking-confirmation'
import { BookingOptionsList } from '../features/booking/components/booking-options-list'
import { BookingServiceBriefCard } from '../features/booking/components/booking-service-brief-card'
import { NearbyGaragesCard } from '../features/booking/components/nearby-garages-card'
import { useBookingFlow } from '../features/booking/hooks/use-booking-flow'
import { ServiceMap } from '../features/map/components/service-map'
import { t } from '../lib/i18n'
import { garages } from '../lib/mocks/garages'
import { vehicleHealth as mockVehicleHealth } from '../lib/mocks/recommendations'
import { useSessionStore } from '../store/session-store'
import type { GarageEntry } from '../types/domain'

export function BookingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'slots' | 'map'>('slots')
  const selectedGarageId = useSessionStore((state) => state.selectedGarageId)
  const serviceFinderServiceType = useSessionStore((state) => state.serviceFinderServiceType)
  const setSelectedGarageId = useSessionStore((state) => state.setSelectedGarageId)
  const setPendingAssistantPrompt = useSessionStore((state) => state.setPendingAssistantPrompt)
  const setServiceFinderServiceType = useSessionStore((state) => state.setServiceFinderServiceType)
  const liveVehicleHealth = useSessionStore((state) => state.liveVehicleHealth)
  const selectedRecommendationId = useSessionStore((state) => state.selectedRecommendationId)
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  const healthRecs = liveVehicleHealth?.recommendations ?? mockVehicleHealth.recommendations
  const currentRecommendation =
    healthRecs.find((r) => r.id === selectedRecommendationId) ?? healthRecs[0]

  const {
    bookingOptions,
    confirmation,
    isLoading,
    isConfirming,
    selectOption,
    confirmBooking,
    selectedBookingOptionId,
  } = useBookingFlow()

  if (isLoading) {
    return <Spinner label={t(uiLanguage, 'booking_spinner_finding')} />
  }

  if (!bookingOptions.length && !confirmation && activeTab === 'slots') {
    return (
      <EmptyState
        title={t(uiLanguage, 'booking_no_slots_title')}
        description={t(uiLanguage, 'booking_no_slots_desc')}
      />
    )
  }

  const handleAskAssistant = (garage: GarageEntry) => {
    setSelectedGarageId(garage.id)
    const serviceLabel = serviceFinderServiceType === 'car_wash' ? 'car wash' : 'car repair'
    setPendingAssistantPrompt(
      `I picked ${garage.name} for ${serviceLabel}. Please compare price, warranty, and best available booking slot for my Toyota Vios now.`,
    )
    navigate('/assistant')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant={activeTab === 'slots' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('slots')}>
          {t(uiLanguage, 'booking_tab_slots')}
        </Button>
        <Button variant={activeTab === 'map' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('map')}>
          {t(uiLanguage, 'booking_tab_map')}
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_repair' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_repair')}
        >
          {t(uiLanguage, 'booking_service_repair')}
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_wash' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_wash')}
        >
          {t(uiLanguage, 'booking_service_wash')}
        </Button>
      </div>

      {activeTab === 'map' ? (
        <ServiceMap
          serviceType={serviceFinderServiceType}
          selectedGarageId={selectedGarageId}
          onSelectGarage={setSelectedGarageId}
          onAskAssistant={handleAskAssistant}
        />
      ) : null}

      {confirmation ? (
        <BookingConfirmation confirmation={confirmation} />
      ) : activeTab === 'slots' ? (
        <>
          <BookingServiceBriefCard recommendation={currentRecommendation} />
          <BookingOptionsList
            bookingOptions={bookingOptions}
            isConfirming={isConfirming}
            onConfirm={confirmBooking}
            onSelect={selectOption}
            selectedBookingOptionId={selectedBookingOptionId}
          />
          <NearbyGaragesCard />
        </>
      ) : null}

      {activeTab === 'map' && selectedGarageId ? (
        <p className="text-sm text-ink/65">
          {t(uiLanguage, 'booking_selected_from_map')}{' '}
          <span className="font-semibold text-ink">
            {garages.find((g) => g.id === selectedGarageId)?.name ?? selectedGarageId}
          </span>
        </p>
      ) : null}
    </div>
  )
}
