import { MapPin, Phone, ExternalLink } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { useSessionStore } from '../../../store/session-store'
import { useNearbyGarages } from '../hooks/use-nearby-garages'

export function NearbyGaragesCard() {
  const { data: garages, isLoading } = useNearbyGarages()
  const uiLanguage = useSessionStore((state) => state.uiLanguage)

  if (isLoading) {
    return (
      <Card className="space-y-3">
        <div className="h-4 w-44 animate-pulse rounded-full bg-ink/10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[18px] bg-ink/6" />
        ))}
      </Card>
    )
  }

  if (!garages?.length) return null

  return (
    <Card>
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">{uiLanguage === 'vi' ? 'Tim gara' : 'Find a garage'}</p>
        <p className="mt-1 font-display text-[1.6rem] leading-tight">{uiLanguage === 'vi' ? 'Gara Tasco gan ban' : 'Nearby Tasco garages'}</p>
        <p className="mt-1 text-sm text-ink/60">{uiLanguage === 'vi' ? 'Lien he truc tiep de xac nhan lich trong' : 'Contact directly to confirm availability'}</p>
      </div>
      <div className="space-y-3">
        {garages.map((garage, i) => (
          <div key={i} className="rounded-[18px] border border-ink/8 bg-sand/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-ink">{garage.name}</p>
                {garage.rating != null ? (
                  <p className="mt-0.5 text-xs text-amber-500">
                    {'★'.repeat(Math.round(garage.rating))} {garage.rating.toFixed(1)}
                  </p>
                ) : null}
                <div className="mt-2 flex items-start gap-1.5 text-sm text-ink/65">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40" />
                  <span>{garage.address}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {garage.phone ? (
                <a
                  href={`tel:${garage.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
                >
                  <Phone className="h-3 w-3" />
                  {garage.phone}
                </a>
              ) : null}
              {garage.mapsUrl ? (
                <a
                  href={garage.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
                >
                  <ExternalLink className="h-3 w-3" />
                  {uiLanguage === 'vi' ? 'Chi duong' : 'Directions'}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
