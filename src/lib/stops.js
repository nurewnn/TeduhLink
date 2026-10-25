import { supabase } from './supabase'

export const FRESHNESS_MS = 60_000

export const demoStops = [
  {
    id: 'demo-stop-a',
    siteCode: 'stop-a',
    name: 'Stop A · physical model',
    accessDetails: 'Demonstration model · one monitored bay',
    amenities: ['shelter', 'charging'],
    bay: { code: 'bay-1', occupancy: 'available', source: 'measured', deviceStatus: 'online', observedAt: new Date().toISOString() },
    distance: '0.8 km',
  },
  {
    id: 'demo-stop-b',
    siteCode: 'stop-b',
    name: 'Stop B · simulated',
    accessDetails: 'Demonstration data · simulated availability',
    amenities: ['shelter', 'charging'],
    bay: { code: 'bay-1', occupancy: 'available', source: 'simulated', deviceStatus: 'online', observedAt: new Date().toISOString() },
    distance: '1.3 km',
  },
]

export function displayOccupancy(bay, now = Date.now()) {
  if (!bay || !bay.observedAt || bay.deviceStatus === 'offline' || bay.deviceStatus === 'unreliable') return 'unknown'
  if (now - new Date(bay.observedAt).getTime() > FRESHNESS_MS) return 'unknown'
  return bay.occupancy
}

export function relativeUpdate(iso, now = Date.now()) {
  if (!iso) return 'No update'
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  return seconds < 5 ? 'Updated now' : `${seconds}s ago`
}

export function matchStops(stops, needs, now = Date.now()) {
  return stops
    .map((stop) => {
      const missing = needs.filter((need) => !stop.amenities.includes(need))
      const status = displayOccupancy(stop.bay, now)
      return { ...stop, status, missing, matchesNeeds: missing.length === 0 }
    })
    .sort((a, b) => {
      const score = (stop) => (stop.matchesNeeds ? 10 : 0) + (stop.status === 'available' ? 3 : stop.status === 'unknown' ? 1 : 0)
      return score(b) - score(a)
    })
}

export async function loadStops() {
  if (!supabase) return { stops: demoStops, mode: 'demo' }

  const [sitesResult, amenitiesResult, baysResult, observationsResult] = await Promise.all([
    supabase.from('sites').select('id, site_code, name, access_details'),
    supabase.from('amenities').select('site_id, amenity_code'),
    supabase.from('bays').select('id, site_id, bay_code, is_monitored'),
    supabase.from('observations').select('bay_id, occupancy, source, device_status, observed_at, received_at').order('observed_at', { ascending: false }),
  ])

  const error = [sitesResult, amenitiesResult, baysResult, observationsResult].find((result) => result.error)?.error
  if (error) throw error

  const amenitiesBySite = new Map()
  amenitiesResult.data.forEach((amenity) => {
    amenitiesBySite.set(amenity.site_id, [...(amenitiesBySite.get(amenity.site_id) ?? []), amenity.amenity_code])
  })

  const latestByBay = new Map()
  observationsResult.data.forEach((observation) => {
    if (!latestByBay.has(observation.bay_id)) latestByBay.set(observation.bay_id, observation)
  })

  const firstBayBySite = new Map()
  baysResult.data.forEach((bay) => {
    if (!firstBayBySite.has(bay.site_id)) firstBayBySite.set(bay.site_id, bay)
  })

  const stops = sitesResult.data.map((site, index) => {
    const bay = firstBayBySite.get(site.id)
    const observation = bay && latestByBay.get(bay.id)
    return {
      id: site.id,
      siteCode: site.site_code,
      name: site.name,
      accessDetails: site.access_details,
      amenities: amenitiesBySite.get(site.id) ?? [],
      bay: observation && {
        code: bay.bay_code,
        occupancy: observation.occupancy,
        source: observation.source,
        deviceStatus: observation.device_status,
        observedAt: observation.observed_at,
      },
      distance: index === 0 ? '0.8 km' : '1.3 km',
    }
  })

  return { stops, mode: 'live' }
}
