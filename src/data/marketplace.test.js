import { describe, expect, it } from 'vitest';
import { TRANSPORT, HIRELINGS } from './marketplace.js';

describe('Marketplace-Vorlagen', () => {
  it('Transport: Slots, Preise und Flags wie im SRD', () => {
    const by = Object.fromEntries(TRANSPORT.map((e) => [e.id, e]));
    expect(by.cart).toMatchObject({ slots: 4, cost: 30, bulky: true });
    expect(by.wagon).toMatchObject({ slots: 8, cost: 200, slow: true });
    expect(by.horse).toMatchObject({ slots: 4, cost: 75 });
    expect(by.mule).toMatchObject({ slots: 6, cost: 30, slow: true });
    expect(TRANSPORT).toHaveLength(4);
  });

  it('12 Mietling-Rollen mit Tagessatz, eindeutig und bilingual', () => {
    expect(HIRELINGS).toHaveLength(12);
    expect(new Set(HIRELINGS.map((h) => h.id)).size).toBe(12);
    for (const h of [...HIRELINGS, ...TRANSPORT]) expect(h.name.de && h.name.en).toBeTruthy();
    for (const h of HIRELINGS) expect(h.perDay).toBeGreaterThan(0);
    expect(HIRELINGS.find((h) => h.id === 'alchemist').perDay).toBe(30);
  });
});
