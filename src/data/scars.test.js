import { describe, expect, it } from 'vitest';
import { SCARS, scarFor } from './scars.js';

describe('scarFor', () => {
  it('Index = verlorene HP, auf 1..12 begrenzt', () => {
    expect(scarFor(1).index).toBe(1);
    expect(scarFor(12).index).toBe(12);
    expect(scarFor(0).index).toBe(1);
    expect(scarFor(99).index).toBe(12);
    expect(scarFor(4.6).index).toBe(5);
  });

  it('liefert bilinguale Namen und Texte', () => {
    const s = scarFor(7);
    expect(s.name.de).toBeTruthy();
    expect(s.name.en).toBeTruthy();
    expect(s.text.de).toBeTruthy();
    expect(s.text.en).toBeTruthy();
  });

  it('SCARS deckt alle 12 Eintraege ab', () => {
    for (let i = 1; i <= 12; i += 1) {
      expect(SCARS[i]).toBeDefined();
      expect(SCARS[i].name.de).toBeTruthy();
      expect(SCARS[i].name.en).toBeTruthy();
    }
  });
});
