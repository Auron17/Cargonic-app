import { BODY_TYPE_SPECS, checkCapacity, checkVolume } from './bodyTypeSpecs';

describe('bodyTypeSpecs', () => {
  it('every preset fits its own body type limits', () => {
    for (const [type, spec] of Object.entries(BODY_TYPE_SPECS)) {
      for (const p of spec.presets) {
        expect([type, p.key, checkCapacity(type as never, String(p.capacityTons))]).toEqual([type, p.key, undefined]);
        expect([type, p.key, checkVolume(type as never, p.volumeM3 != null ? String(p.volumeM3) : '')]).toEqual([
          type,
          p.key,
          undefined,
        ]);
      }
    }
  });

  it('checks capacity per body type', () => {
    expect(checkCapacity('TIPPER', '2')).toBe('range');
    expect(checkCapacity('TIPPER', '25')).toBeUndefined();
    expect(checkCapacity('TENT', '35')).toBe('range');
    expect(checkCapacity('TENT', '1,5')).toBeUndefined();
    expect(checkCapacity('TENT', '')).toBe('required');
    expect(checkCapacity('TENT', 'abc')).toBe('invalid');
  });

  it('volume is required for enclosed bodies and ignored for flatbed', () => {
    expect(checkVolume('TENT', '')).toBe('required');
    expect(checkVolume('REFRIGERATOR', '130')).toBe('range');
    expect(checkVolume('CONTAINER', '67')).toBeUndefined();
    expect(checkVolume('FLATBED', '')).toBeUndefined();
    expect(checkVolume('FLATBED', '500')).toBeUndefined();
  });

  it('accepts tanker and manipulator inside their ranges', () => {
    expect(checkCapacity('TANKER', '20')).toBeUndefined();
    expect(checkVolume('TANKER', '25')).toBeUndefined();
    expect(checkCapacity('TANKER', '2')).toBe('range');
    expect(checkCapacity('MANIPULATOR', '10')).toBeUndefined();
    expect(checkVolume('MANIPULATOR', '22')).toBeUndefined();
    expect(checkCapacity('MANIPULATOR', '25')).toBe('range');
  });
});
