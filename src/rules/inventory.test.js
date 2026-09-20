import { describe, expect, it } from 'vitest';
import { blankCharacter } from './character.js';
import {
  isPetty, cellsFor, firstFreeFit, tryMove, addItem, addItemAt, removeItem, pettyItems,
} from './inventory.js';

const item = (id, size = 1, extra = {}) => ({ itemId: id, type: 'gear', size, ...extra });

describe('isPetty / cellsFor', () => {
  it('petty erkennt size 0 und petty-Flag', () => {
    expect(isPetty(item('a', 0))).toBe(true);
    expect(isPetty({ itemId: 'b', petty: true })).toBe(true);
    expect(isPetty(item('c', 1))).toBe(false);
  });

  it('cellsFor liefert das Feldpaar fuer bulky', () => {
    expect(cellsFor('worn_1', 1)).toEqual(['worn_1']);
    expect(cellsFor('worn_2', 2)).toEqual(['worn_1', 'worn_2']);
  });
});

describe('firstFreeFit', () => {
  it('findet den ersten freien Anker', () => {
    const c = blankCharacter();
    expect(firstFreeFit(c.slots, 1)).toBe('worn_1');
  });

  it('bulky braucht ein freies Paar', () => {
    const c = blankCharacter();
    c.slots.worn_2 = { itemId: 'x' };
    // worn_1/worn_2 Paar ist belegt -> naechstes Paar worn_3
    expect(firstFreeFit(c.slots, 2)).toBe('worn_3');
  });

  it('gibt null zurueck, wenn nichts passt', () => {
    const c = blankCharacter();
    for (const s of Object.keys(c.slots)) c.slots[s] = { itemId: 'x' };
    expect(firstFreeFit(c.slots, 1)).toBeNull();
  });
});

describe('addItem', () => {
  it('legt Ausruestung in den ersten Rucksack-Platz', () => {
    const r = addItem(blankCharacter(), item('a'));
    expect(r.ok).toBe(true);
    expect(r.character.slots.pack_1).toEqual({ itemId: 'a' });
  });

  it('Waffen bevorzugen die Koerper-Slots, Ausruestung den Rucksack', () => {
    const w = addItem(blankCharacter(), item('w', 1, { type: 'weapon' }));
    expect(w.character.slots.worn_1).toEqual({ itemId: 'w' });
    const g = addItem(blankCharacter(), item('g', 1, { type: 'gear' }));
    expect(g.character.slots.pack_1).toEqual({ itemId: 'g' });
  });

  it('petty landet ausserhalb des Rasters mit petty-Flag', () => {
    const r = addItem(blankCharacter(), item('p', 0));
    expect(Object.values(r.character.slots).every((s) => s === null)).toBe(true);
    expect(r.character.items.p.petty).toBe(true);
  });

  it('volles Inventar: ok=false', () => {
    let c = blankCharacter();
    for (let i = 0; i < 10; i += 1) c = addItem(c, item(`i${i}`)).character;
    const r = addItem(c, item('overflow'));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('noRoom');
  });
});

describe('addItemAt', () => {
  it('legt auf den gewuenschten Platz, wenn frei', () => {
    const r = addItemAt(blankCharacter(), item('a'), 'pack_3');
    expect(r.character.slots.pack_3).toEqual({ itemId: 'a' });
  });

  it('faellt auf den ersten freien Platz zurueck, wenn belegt', () => {
    const c = blankCharacter();
    c.slots.pack_3 = { itemId: 'x' };
    c.items = { x: item('x') };
    const r = addItemAt(c, item('a'), 'pack_3');
    expect(r.ok).toBe(true);
    expect(r.character.slots.pack_3).toEqual({ itemId: 'x' });
  });
});

describe('tryMove', () => {
  it('verschiebt auf ein freies Feld', () => {
    const c = addItem(blankCharacter(), item('a')).character;
    const r = tryMove(c.slots, c.items, 'a', 'pack_6');
    expect(r.ok).toBe(true);
    expect(r.slots.pack_6).toEqual({ itemId: 'a' });
    expect(r.slots.worn_1).toBeNull();
  });

  it('tauscht zwei 1-Feld-Gegenstaende', () => {
    let c = addItemAt(blankCharacter(), item('a'), 'worn_1').character;
    c = addItemAt(c, item('b'), 'worn_2').character;
    const r = tryMove(c.slots, c.items, 'a', 'worn_2');
    expect(r.ok).toBe(true);
    expect(r.slots.worn_2).toEqual({ itemId: 'a' });
    expect(r.slots.worn_1).toEqual({ itemId: 'b' });
  });

  it('lehnt bulky ab, wenn das Zielpaar nicht frei ist', () => {
    let c = addItemAt(blankCharacter(), item('big', 2), 'pack_1').character; // pack_1/pack_2
    c = addItemAt(c, item('s'), 'pack_6').character; // blockiert das Paar pack_5/pack_6
    const r = tryMove(c.slots, c.items, 'big', 'pack_6');
    expect(r.ok).toBe(false);
  });

  it('unbekannter Gegenstand', () => {
    expect(tryMove(blankCharacter().slots, {}, 'ghost', 'worn_1').ok).toBe(false);
  });
});

describe('removeItem / pettyItems', () => {
  it('entfernt aus items und raeumt die Slots', () => {
    const c = addItem(blankCharacter(), item('a')).character;
    const next = removeItem(c, 'a');
    expect(next.items.a).toBeUndefined();
    expect(next.slots.worn_1).toBeNull();
  });

  it('pettyItems listet nur petty', () => {
    let c = addItem(blankCharacter(), item('a', 1)).character;
    c = addItem(c, item('p', 0)).character;
    const petty = pettyItems(c);
    expect(petty).toHaveLength(1);
    expect(petty[0].itemId).toBe('p');
  });
});
