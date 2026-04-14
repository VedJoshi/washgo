import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui/empty-state'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { BookingConfirmation } from '../features/booking/components/booking-confirmation'
import { BookingOptionsList } from '../features/booking/components/booking-options-list'
import { useBookingFlow } from '../features/booking/hooks/use-booking-flow'
import { ServiceMap } from '../features/map/components/service-map'
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
    return <Spinner label="Finding nearby service slots..." />
  }

  if (!bookingOptions.length && !confirmation && activeTab === 'slots') {
    return (
      <EmptyState
        title="No slots available"
        description="Try picking another recommendation from the vehicle insight page."
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
          Booking slots
        </Button>
        <Button variant={activeTab === 'map' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('map')}>
          Service map
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_repair' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_repair')}
        >
          Car repair
        </Button>
        <Button
          variant={serviceFinderServiceType === 'car_wash' ? 'secondary' : 'ghost'}
          onClick={() => setServiceFinderServiceType('car_wash')}
        >
          Car wash
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
        <BookingOptionsList
          bookingOptions={bookingOptions}
          isConfirming={isConfirming}
          onConfirm={confirmBooking}
          onSelect={selectOption}
          selectedBookingOptionId={selectedBookingOptionId}
        />
      ) : null}

      {activeTab === 'map' && selectedGarageId ? (
        <p className="text-sm text-ink/65">
          Selected garage from map: <span className="font-semibold text-ink">{selectedGarageId}</span>
        </p>
      ) : null}
    </div>
  )
}
