import {
  clearDrivingRouteCache,
  downsampleRoute,
  fetchDrivingRoute,
  parseOsrmRoute,
  tripNavTarget,
} from './route';

describe('tripNavTarget', () => {
  const load = {
    pickupLat: 41.3,
    pickupLng: 69.2,
    dropoffLat: 39.65,
    dropoffLng: 66.96,
  };

  it('points at pickup before the truck is loaded', () => {
    expect(tripNavTarget('ASSIGNED', load)).toEqual({ lat: 41.3, lng: 69.2 });
    expect(tripNavTarget('EN_ROUTE_TO_PICKUP', load)).toEqual({ lat: 41.3, lng: 69.2 });
    expect(tripNavTarget('AT_PICKUP', load)).toEqual({ lat: 41.3, lng: 69.2 });
  });

  it('points at dropoff after the truck is loaded', () => {
    expect(tripNavTarget('LOADED', load)).toEqual({ lat: 39.65, lng: 66.96 });
    expect(tripNavTarget('DELIVERED', load)).toEqual({ lat: 39.65, lng: 66.96 });
  });
});

describe('parseOsrmRoute', () => {
  it('converts GeoJSON [lng,lat] pairs to lat/lng points', () => {
    const path = parseOsrmRoute({
      routes: [{ geometry: { coordinates: [[69.24, 41.3], [69.25, 41.31]] } }],
    });
    expect(path).toEqual([
      { lat: 41.3, lng: 69.24 },
      { lat: 41.31, lng: 69.25 },
    ]);
  });

  it('returns empty when OSRM has no geometry', () => {
    expect(parseOsrmRoute({})).toEqual([]);
    expect(parseOsrmRoute({ routes: [] })).toEqual([]);
  });
});

describe('downsampleRoute', () => {
  it('keeps short paths intact', () => {
    const path = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ];
    expect(downsampleRoute(path, 10)).toEqual(path);
  });

  it('keeps first and last points when thinning', () => {
    const path = Array.from({ length: 9 }, (_, i) => ({ lat: i, lng: i }));
    const thin = downsampleRoute(path, 3);
    expect(thin[0]).toEqual({ lat: 0, lng: 0 });
    expect(thin[thin.length - 1]).toEqual({ lat: 8, lng: 8 });
    expect(thin.length).toBeLessThanOrEqual(4);
  });
});

describe('fetchDrivingRoute', () => {
  const from = { lat: 41.3, lng: 69.24 };
  const to = { lat: 41.31, lng: 69.25 };

  afterEach(() => {
    clearDrivingRouteCache();
    jest.restoreAllMocks();
  });

  it('maps a successful OSRM response to a path', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{ geometry: { coordinates: [[69.24, 41.3], [69.25, 41.31]] } }],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const path = await fetchDrivingRoute(from, to);
    expect(path).toEqual([
      { lat: 41.3, lng: 69.24 },
      { lat: 41.31, lng: 69.25 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('/route/v1/driving/69.24,41.3;69.25,41.31');
  });

  it('returns empty path when OSRM fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
    await expect(fetchDrivingRoute(from, to)).resolves.toEqual([]);
  });
});
