import {
  cropCover,
  FRAMED_DOC_TYPES,
  frameRect,
  isFramedDocType,
} from './documentFrame';

describe('framed doc types', () => {
  it('covers both sides of the licence and the tech-passport only', () => {
    expect([...FRAMED_DOC_TYPES].sort()).toEqual([
      'DRIVER_LICENSE',
      'DRIVER_LICENSE_BACK',
      'TECH_PASSPORT',
      'TECH_PASSPORT_BACK',
    ]);
    expect(isFramedDocType('DRIVER_LICENSE')).toBe(true);
    expect(isFramedDocType('VEHICLE_PHOTO')).toBe(false);
    expect(isFramedDocType('LICENSE_CARD')).toBe(false);
  });
});

describe('frameRect', () => {
  it('places a landscape ID card in the centre of the view', () => {
    const frame = frameRect(390, 844);
    expect(frame.width / frame.height).toBeCloseTo(85.6 / 53.98, 2);
    expect(frame.x + frame.width / 2).toBeCloseTo(195, 0);
    expect(frame.y + frame.height / 2).toBeCloseTo(422, 0);
    expect(frame.x).toBeGreaterThan(8);
    expect(frame.y).toBeGreaterThan(8);
    expect(frame.x + frame.width).toBeLessThan(390 - 8);
  });
});

describe('cropCover', () => {
  it('maps the overlay hole onto a cover-fitted photo', () => {
    const view = { width: 400, height: 800 };
    const image = { width: 4000, height: 3000 };
    const frame = { x: 40, y: 300, width: 320, height: 200 };
    const crop = cropCover(image, view, frame);
    // Cover: scale = max(400/4000, 800/3000) = max(0.1, 0.266...) = 0.266...
    // displayed 1066.6 × 800, offsetX = (1066.6-400)/2 = 333.3, offsetY = 0
    expect(crop.originX).toBeGreaterThan(0);
    expect(crop.originY).toBeGreaterThan(0);
    expect(crop.originX + crop.width).toBeLessThanOrEqual(image.width);
    expect(crop.originY + crop.height).toBeLessThanOrEqual(image.height);
    expect(crop.width / crop.height).toBeCloseTo(frame.width / frame.height, 2);
  });

  it('clamps a frame that would run past the photo edge', () => {
    const crop = cropCover(
      { width: 100, height: 100 },
      { width: 100, height: 100 },
      { x: 90, y: 90, width: 40, height: 40 },
    );
    expect(crop.originX + crop.width).toBeLessThanOrEqual(100);
    expect(crop.originY + crop.height).toBeLessThanOrEqual(100);
    expect(crop.width).toBeGreaterThan(0);
    expect(crop.height).toBeGreaterThan(0);
  });
});
