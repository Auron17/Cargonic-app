import { shouldStopIdleGps } from './idleGps';

describe('shouldStopIdleGps', () => {
  it('keeps GPS while a trip is still in transit', () => {
    expect(shouldStopIdleGps([{ status: 'LOADED' }])).toBe(false);
    expect(shouldStopIdleGps([{ status: 'DELIVERED' }, { status: 'EN_ROUTE_TO_PICKUP' }])).toBe(false);
  });

  it('stops GPS when the only trips are delivered or finished', () => {
    expect(shouldStopIdleGps([{ status: 'DELIVERED' }])).toBe(true);
    expect(shouldStopIdleGps([{ status: 'COMPLETED' }, { status: 'CANCELLED' }])).toBe(true);
    expect(shouldStopIdleGps([])).toBe(true);
  });

  it('does not stop before trips have loaded', () => {
    expect(shouldStopIdleGps(undefined)).toBe(false);
  });
});
