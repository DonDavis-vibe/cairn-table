import { describe, expect, it } from 'vitest';
import {
  blankCharacter, isBlank, normalizeCharacter, itemSlotCost, usedSlots, freeSlots,
  effectiveMaxHp, goldSlots, ALL_SLOTS,
} from './character.js';

describe('blankCharacter / isBlank', () => {
  it('ein frischer Bogen gilt als leer', () => {
    expect(isBlank(blankCharacter())).toBe(true);
    expect(isBlank(null)).toBe(true);
  });

  it('ein Name oder Gegenstaende machen ihn nicht-leer', () => {
    expect(isBlank({ ...blankCharacter(), name: 'Alba' })).toBe(false);
    expect(isBlank({ ...blankCharacter(), items: { i1: {} } })).toBe(false);
  });
});

describe('normalizeCharacter', () => {
  it('fuellt fehlende Felder aus dem Blank auf', () => {
    const c = normalizeCharacter({ name: 'X' });
    expect(c.hp).toEqual({ max: 4, current: 4 });
    expect(c.str).toEqual({ max: 10, current: 10 });
    expect(Object.keys(c.slots)).toHaveLength(ALL_SLOTS.length);
  });

  it('klemmt current auf max', () => {
    const c = normalizeCharacter({ hp: { max: 5, current: 99 }, str: { max: 10, current: 40 } });
    expect(c.hp.current).toBe(5);
    expect(c.str.current).toBe(10);
  });

  it('verwirft kaputte items/scars', () => {
    expect(normalizeCharacter({ items: 'nope' }).items).toEqual({});
    expect(normalizeCharacter({ scars: 'nope' }).scars).toEqual([]);
  });

  it('nicht-Objekt -> Blank', () => {
    expect(isBlank(normalizeCharacter(undefined))).toBe(true);
  });
});

describe('itemSlotCost', () => {
  it('petty 0, normal 1, bulky 2', () => {
    expect(itemSlotCost(null)).toBe(0);
    expect(itemSlotCost({ size: 0 })).toBe(0);
    expect(itemSlotCost({ petty: true })).toBe(0);
    expect(itemSlotCost({ size: 1 })).toBe(1);
    expect(itemSlotCost({ size: 2 })).toBe(2);
    expect(itemSlotCost({})).toBe(1);
  });
});

describe('usedSlots / freeSlots / effectiveMaxHp', () => {
  function withItems() {
    const c = blankCharacter();
    c.hp = { max: 6, current: 6 };
    c.items = {
      a: { itemId: 'a', size: 1 },
      b: { itemId: 'b', size: 2 },
      p: { itemId: 'p', size: 0 },
    };
    c.slots = { ...c.slots, worn_1: { itemId: 'a' }, pack_1: { itemId: 'b' }, pack_2: { itemId: 'b', cont: true } };
    return c;
  }

  it('zaehlt Anker inkl. bulky, ignoriert cont und petty', () => {
    expect(usedSlots(withItems())).toBe(3);
    expect(freeSlots(withItems())).toBe(7);
  });

  it('volles Inventar drueckt die HP-Obergrenze auf 0', () => {
    const c = withItems();
    for (const s of ALL_SLOTS) c.slots[s] = { itemId: 'x' };
    c.items.x = { itemId: 'x', size: 1 };
    expect(usedSlots(c)).toBe(10);
    expect(effectiveMaxHp(c)).toBe(0);
  });

  it('nicht volles Inventar: normale Obergrenze', () => {
    expect(effectiveMaxHp(withItems())).toBe(6);
  });

  it('goldSlots: 0 ohne Schwelle, sonst je Schwelle ein Slot', () => {
    const c = { ...blankCharacter(), gp: 250 };
    expect(goldSlots(c)).toBe(0);
    expect(goldSlots({ ...c, goldSlotThreshold: 100 })).toBe(2);
    expect(goldSlots({ ...c, gp: 99, goldSlotThreshold: 100 })).toBe(0);
  });

  it('Gold-Slots zaehlen bei usedSlots/freeSlots mit', () => {
    const c = { ...withItems(), gp: 300, goldSlotThreshold: 100 };
    expect(usedSlots(c)).toBe(6); // 3 Gegenstaende + 3 Gold-Slots
    expect(freeSlots(c)).toBe(4);
  });

  it('Panik drueckt die HP-Obergrenze auf 0, unabhaengig vom Inventar', () => {
    const c = { ...withItems(), panicked: true };
    expect(effectiveMaxHp(c)).toBe(0);
  });
});
