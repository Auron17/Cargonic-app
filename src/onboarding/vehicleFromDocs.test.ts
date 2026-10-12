import { payloadTons, vehicleFromDocs } from './vehicleFromDocs';

describe('payloadTons', () => {
  it('is (gross − unladen) / 1000 rounded to one decimal', () => {
    expect(payloadTons(25000, 9000)).toBe(16);
    expect(payloadTons(18500, 7500)).toBe(11);
    expect(payloadTons(12340, 8000)).toBe(4.3);
  });

  it('is null when weights are missing, inverted, or this is a tractor unit', () => {
    expect(payloadTons(null, 9000)).toBeNull();
    expect(payloadTons(25000, null)).toBeNull();
    expect(payloadTons(8000, 9000)).toBeNull();
    expect(payloadTons(25000, 9000, true)).toBeNull();
  });
});

describe('vehicleFromDocs', () => {
  it('takes plate from tech-passport front and capacity from the back', () => {
    const v = vehicleFromDocs({
      TECH_PASSPORT: { plateNumber: '01 A 202 AA', documentNumber: 'AAF0001' },
      TECH_PASSPORT_BACK: { grossWeightKg: 25000, unladenWeightKg: 9000 },
    });
    expect(v.plateNumber).toBe('01A202AA');
    expect(v.capacityTons).toBe(16);
    expect(v.licenseCardNumber).toBe('AAF0001');
    expect(v.tractorUnit).toBe(false);
  });

  it('falls back to plate on the back if the front had none', () => {
    const v = vehicleFromDocs({
      TECH_PASSPORT_BACK: { plateNumber: '10 123 ABC', grossWeightKg: 20000, unladenWeightKg: 8000 },
    });
    expect(v.plateNumber).toBe('10123ABC');
    expect(v.capacityTons).toBe(12);
  });

  it('drops an unreadable plate so the driver retakes the photo', () => {
    const v = vehicleFromDocs({
      TECH_PASSPORT: { plateNumber: 'XX999XX' },
    });
    expect(v.plateNumber).toBeNull();
  });

  it('does not guess capacity for a tractor unit', () => {
    const v = vehicleFromDocs({
      TECH_PASSPORT: { plateNumber: '01A333AA' },
      TECH_PASSPORT_BACK: { grossWeightKg: 18000, unladenWeightKg: 7000, tractorUnit: true },
    });
    expect(v.plateNumber).toBe('01A333AA');
    expect(v.capacityTons).toBeNull();
    expect(v.tractorUnit).toBe(true);
  });

  it('takes the driver name from the licence front', () => {
    const v = vehicleFromDocs({
      DRIVER_LICENSE: { fullName: 'TURSUNOV JASUR' },
    });
    expect(v.fullName).toBe('TURSUNOV JASUR');
  });

  it('prefers the licence-card number over the tech-passport series', () => {
    const v = vehicleFromDocs({
      TECH_PASSPORT: { documentNumber: 'AAF0001' },
      LICENSE_CARD: { documentNumber: 'TLC-778899' },
    });
    expect(v.licenseCardNumber).toBe('TLC-778899');
  });
});
