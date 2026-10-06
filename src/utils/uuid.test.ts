import { generateUuid } from './uuid';

describe('generateUuid', () => {
  it('generates a valid RFC4122 v4 UUID string', () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates distinct IDs on consecutive calls', () => {
    const id1 = generateUuid();
    const id2 = generateUuid();
    expect(id1).not.toBe(id2);
  });
});
