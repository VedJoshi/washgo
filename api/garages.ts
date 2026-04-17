export const config = { runtime: 'edge' }

interface SerpLocalResult {
  title: string
  address?: string
  phone?: string
  rating?: number
  links?: { directions?: string }
  gps_coordinates?: { latitude: number; longitude: number }
}

interface SerpApiResponse {
  local_results?: SerpLocalResult[]
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? 'Tasco service center'
  const location = searchParams.get('location') ?? 'Ho Chi Minh City, Vietnam'
  const apiKey = process.env.SERPAPI_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ garages: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine', 'google_local')
  url.searchParams.set('q', q)
  url.searchParams.set('location', location)
  url.searchParams.set('gl', 'vn')
  url.searchParams.set('hl', 'en')
  url.searchParams.set('num', '5')
  url.searchParams.set('api_key', apiKey)

  const response = await fetch(url.toString())
  const data = (await response.json()) as SerpApiResponse

  const garages = (data.local_results ?? []).map((r) => ({
    name: r.title,
    address: r.address ?? '',
    phone: r.phone,
    rating: r.rating,
    mapsUrl:
      r.links?.directions ??
      (r.gps_coordinates
        ? `https://www.google.com/maps/search/?api=1&query=${r.gps_coordinates.latitude},${r.gps_coordinates.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.title + ' Ho Chi Minh City')}`),
  }))

  return new Response(JSON.stringify({ garages }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
