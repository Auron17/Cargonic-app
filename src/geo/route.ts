export type LatLng = { lat: number; lng: number };

export type TripNavLoad = {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
};

const OSRM_URL = 'https://router.project-osrm.org';
const routeCache = new Map<string, LatLng[]>();

export function clearDrivingRouteCache() {
  routeCache.clear();
}

export function tripNavTarget(status: string, load: TripNavLoad): LatLng {
  const toPickup = status === 'ASSIGNED' || status === 'EN_ROUTE_TO_PICKUP' || status === 'AT_PICKUP';
  return toPickup
    ? { lat: load.pickupLat, lng: load.pickupLng }
    : { lat: load.dropoffLat, lng: load.dropoffLng };
}

export function parseOsrmRoute(data: unknown): LatLng[] {
  const coords = (data as { routes?: { geometry?: { coordinates?: [number, number][] } }[] })
    ?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return [];
  return coords
    .filter((pair) => Array.isArray(pair) && pair.length >= 2)
    .map(([lng, lat]) => ({ lat, lng }));
}

export function downsampleRoute(path: LatLng[], maxPoints: number): LatLng[] {
  if (path.length <= maxPoints || maxPoints < 2) return path;
  const last = path.length - 1;
  const step = last / (maxPoints - 1);
  const out: LatLng[] = [];
  for (let i = 0; i < maxPoints - 1; i += 1) {
    out.push(path[Math.round(i * step)]);
  }
  out.push(path[last]);
  return out;
}

function cacheKey(from: LatLng, to: LatLng): string {
  return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}-${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
}

export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<LatLng[]> {
  const key = cacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const url = `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return [];
    const path = downsampleRoute(parseOsrmRoute(await response.json()), 400);
    if (path.length >= 2) routeCache.set(key, path);
    return path;
  } catch (err) {
    if (signal?.aborted) throw err;
    return [];
  }
}
