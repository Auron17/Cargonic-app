import {
  applyPlateInput,
  compactPlate,
  formatUzPlate,
  plateProblem,
} from './uzPlate';

describe('applyPlateInput', () => {
  it('keeps only 8 compact characters and uppercases', () => {
    expect(compactPlate(applyPlateInput('01 a 333 aa extra!!!'))).toBe('01A333AA');
  });

  it('formats physical person plates as 01 A 333 AA', () => {
    expect(applyPlateInput('01A333AA')).toBe('01 A 333 AA');
    expect(applyPlateInput('01a333aa')).toBe('01 A 333 AA');
  });

  it('formats legal entity plates as 01 333 AAA', () => {
    expect(applyPlateInput('01333AAA')).toBe('01 333 AAA');
    expect(applyPlateInput('10 123 abc')).toBe('10 123 ABC');
  });

  it('groups characters while typing physical format', () => {
    expect(applyPlateInput('0')).toBe('0');
    expect(applyPlateInput('01')).toBe('01');
    expect(applyPlateInput('01A')).toBe('01 A');
    expect(applyPlateInput('01A3')).toBe('01 A 3');
    expect(applyPlateInput('01A333')).toBe('01 A 333');
    expect(applyPlateInput('01A333A')).toBe('01 A 333 A');
  });

  it('groups characters while typing legal format', () => {
    expect(applyPlateInput('013')).toBe('01 3');
    expect(applyPlateInput('01333')).toBe('01 333');
    expect(applyPlateInput('01333A')).toBe('01 333 A');
  });

  it('drops letters before the region digits', () => {
    expect(applyPlateInput('A01A333AA')).toBe('01 A 333 AA');
  });

  it('drops letters in the digit slots of a physical plate', () => {
    expect(applyPlateInput('01AAA333')).toBe('01 A 333');
  });

  it('does not accept more than 8 compact characters', () => {
    expect(compactPlate(applyPlateInput('01A333AAAA'))).toHaveLength(8);
    expect(applyPlateInput('01A333AAAA')).toBe('01 A 333 AA');
  });
});

describe('plateProblem', () => {
  it('accepts issued-region physical and legal plates', () => {
    expect(plateProblem('01 A 333 AA')).toBeNull();
    expect(plateProblem('10 123 ABC')).toBeNull();
    expect(plateProblem('95A001BB')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(plateProblem('')).toBe('empty');
    expect(plateProblem('   ')).toBe('empty');
  });

  it('rejects region codes that are not issued yet, including 44', () => {
    expect(plateProblem('44')).toBe('region');
    expect(plateProblem('44 A 333 AA')).toBe('region');
    expect(plateProblem('02A333AA')).toBe('region');
    expect(plateProblem('99 123 ABC')).toBe('region');
    expect(plateProblem('15A333AA')).toBe('region');
  });

  it('rejects incomplete or malformed plates', () => {
    expect(plateProblem('01')).toBe('invalid');
    expect(plateProblem('01 A 33')).toBe('invalid');
    expect(plateProblem('01A333A')).toBe('invalid');
  });
});

describe('formatUzPlate', () => {
  it('formats a stored compact plate for display', () => {
    expect(formatUzPlate('01A123AA')).toBe('01 A 123 AA');
    expect(formatUzPlate('40123ABC')).toBe('40 123 ABC');
  });
});
