import type { NearbyGarage } from '../../../types/domain'

const MOCK_GARAGES: NearbyGarage[] = [
  {
    name: 'Tasco Service Hub District 1',
    address: '123 Le Loi Street, Ben Nghe Ward, District 1, HCMC',
    phone: '+84 28 3822 1234',
    rating: 4.7,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tasco+Service+Hub+District+1+Ho+Chi+Minh+City',
  },
  {
    name: 'Tasco Mobility Care Thu Duc',
    address: '45 Vo Van Ngan Street, Linh Chieu Ward, Thu Duc City, HCMC',
    phone: '+84 28 3896 5678',
    rating: 4.5,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tasco+Mobility+Care+Thu+Duc+Ho+Chi+Minh+City',
  },
  {
    name: 'WurthGO Auto Center District 7',
    address: '88 Nguyen Thi Thap Street, Tan Phong Ward, District 7, HCMC',
    phone: '+84 28 5412 9900',
    rating: 4.8,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=WurthGO+Auto+Center+District+7+Ho+Chi+Minh+City',
  },
]

const SERVICE_LABEL: Record<string, string> = {
  oil: 'oil change',
  battery: 'battery diagnostic',
  tires: 'tire rotation alignment',
  inspection: 'vehicle inspection',
  cleaning: 'car wash detailing',
}

export async function fetchNearbyGarages(category: string): Promise<NearbyGarage[]> {
  if (import.meta.env.DEV) return MOCK_GARAGES

  const label = SERVICE_LABEL[category] ?? 'auto service'

  try {
    const res = await fetch(
      `/api/garages?q=${encodeURIComponent('Tasco ' + label)}&location=Ho+Chi+Minh+City,Vietnam`,
    )
    if (!res.ok) return MOCK_GARAGES
    const data = (await res.json()) as { garages?: NearbyGarage[] }
    return data.garages?.length ? data.garages : MOCK_GARAGES
  } catch {
    return MOCK_GARAGES
  }
}
