import { describe, expect, it } from 'vitest';
import { traitSummary } from './tables.js';

describe('traitSummary', () => {
  it('leerer Bogen -> leerer String', () => {
    expect(traitSummary({}, 'de')).toBe('');
    expect(traitSummary(null, 'de')).toBe('');
  });

  it('fasst nur ausgefuellte Felder zusammen, Label: Wert', () => {
    const traits = { physique: 'Athletisch', hair: 'Kahl' };
    const summary = traitSummary(traits, 'de');
    expect(summary).toContain('Statur: Athletisch');
    expect(summary).toContain('Haar: Kahl');
    expect(summary.split(' · ')).toHaveLength(2);
  });

  it('sprachabhaengige Labels', () => {
    const traits = { physique: 'Athletic' };
    expect(traitSummary(traits, 'en')).toBe('Physique: Athletic');
  });
});
