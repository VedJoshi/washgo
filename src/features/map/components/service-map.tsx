import { useEffect, useMemo, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { findNearbyServices } from '../../../lib/qwen/tools'
import type { GarageEntry } from '../../../types/domain'

type Coordinates = { lat: number; lng: number }

const HCMC_DEMO_LOCATION: Coordinates = { lat: 10.7769, lng: 106.7009 }

async function resolveUserLocation(): Promise<Coordinates> {
  return HCMC_DEMO_LOCATION
}

export function ServiceMap({
  serviceType,
  selectedGarageId,
  onSelectGarage,
  onAskAssistant,
}: {
  serviceType: 'car_wash' | 'car_repair'
  selectedGarageId?: string
  onSelectGarage: (garageId: string) => void
  onAskAssistant: (garage: GarageEntry) => void
}) {
  const [services, setServices] = useState<GarageEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [coordinates, setCoordinates] = useState<Coordinates>(HCMC_DEMO_LOCATION)
  const [loadError, setLoadError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)

  const selectedGarage = useMemo(
    () => services.find((garage) => garage.id === selectedGarageId) ?? services[0],
    [services, selectedGarageId],
  )

  useEffect(() => {
    let isMounted = true

    async function loadServices() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const location = await resolveUserLocation()
        if (!isMounted) return
        setCoordinates(location)

        const results = await findNearbyServices({
          serviceType,
          lat: location.lat,
          lng: location.lng,
          radiusKm: 5,
        })

        if (!isMounted) return
        setServices(results)
      } catch (error) {
        if (!isMounted) return
        setLoadError(error instanceof Error ? error.message : 'Unable to load nearby services')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadServices()

    return () => {
      isMounted = false
    }
  }, [serviceType])

  useEffect(() => {
    const mapsEnabled = import.meta.env.VITE_MAPS_ENABLED === 'true'
    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!mapsEnabled || !mapsApiKey || !mapRef.current || services.length === 0) {
      return
    }

    let markers: Array<{ setMap: (map: unknown) => void }> = []

    async function renderMap() {
      setOptions({ key: mapsApiKey, v: 'weekly' })
      await importLibrary('maps')

      const googleMaps = (window as { google?: { maps?: any } }).google?.maps
      if (!googleMaps || !mapRef.current) {
        return
      }

      const map = new googleMaps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      })

      markers = services.map((service) => {
        const marker = new googleMaps.Marker({
          map,
          position: { lat: service.lat, lng: service.lng },
          title: service.name,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: serviceType === 'car_wash' ? '#2563eb' : '#f97316',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        })

        marker.addListener('click', () => onSelectGarage(service.id))
        return marker
      })
    }

    void renderMap()

    return () => {
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [coordinates.lat, coordinates.lng, onSelectGarage, serviceType, services])

  const mapsEnabled = import.meta.env.VITE_MAPS_ENABLED === 'true' && Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

  return (
    <Card className="space-y-4 border-ink/8">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">Service finder</p>
        <p className="font-display text-[1.9rem] leading-tight">Map view</p>
      </div>

      {mapsEnabled ? (
        <div ref={mapRef} className="h-72 w-full rounded-[20px] border border-ink/8 bg-sand/60" />
      ) : (
        <div className="rounded-[20px] border border-dashed border-ink/20 bg-sand/40 p-4 text-sm text-ink/65">
          Google Maps is disabled. Showing nearby services from local demo data.
        </div>
      )}

      {isLoading ? <p className="text-sm text-ink/65">Finding nearby services...</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedGarage?.id === service.id
          return (
            <div
              key={service.id}
              className={
                isSelected
                  ? 'rounded-[18px] border border-ember/50 bg-[linear-gradient(180deg,_rgba(255,247,240,1)_0%,_rgba(255,255,255,1)_100%)] p-4'
                  : 'rounded-[18px] border border-ink/10 bg-white p-4'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{service.name}</p>
                  <p className="mt-1 text-sm text-ink/65">{service.address}</p>
                </div>
                <Badge tone="neutral">{service.distanceKm} km</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant={isSelected ? 'secondary' : 'ghost'} onClick={() => onSelectGarage(service.id)}>
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
                {isSelected ? (
                  <Button variant="ghost" onClick={() => onAskAssistant(service)}>
                    Ask assistant about this
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
