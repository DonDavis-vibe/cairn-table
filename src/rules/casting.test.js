import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankCharacter } from './character.js';
import { addItem } from './inventory.js';
import { makeSpellbook } from '../data/items.js';
import {
  castRisks, castSave, mishapOptions, destroyBook, mishapInjury,
} from './casting.js';

afterEach(() => vi.restoreAllMocks());
const roll = (face, sides) => vi.spyOn(Math, 'random').mockReturnValueOnce((face - 0.5) / sides);

describe('castRisks', () => {
  it('ruhig und satt: kein Risiko', () => {
    expect(castRisks(blankCharacter())).toEqual([]);
  });
  it('entbehrend und/oder in Gefahr', () => {
    expect(castRisks({ ...blankCharacter(), deprived: true })).toEqual(['deprived']);
    expect(castRisks({ ...blankCharacter(), inDanger: true })).toEqual(['danger']);
    expect(castRisks({ ...blankCharacter(), deprived: true, inDanger: true })).toEqual(['deprived', 'danger']);
  });
});

describe('castSave', () => {
  it('WIL-Rettungswurf mit dem aktuellen Wert', () => {
    const c = blankCharacter();
    c.wil = { max: 14, current: 8 };
    roll(8, 20);
    expect(castSave(c)).toMatchObject({ ok: true, target: 8 });
    roll(9, 20);
    expect(castSave(c)).toMatchObject({ ok: false, target: 8 });
  });
});

describe('Folgen', () => {
  it('Schriftrollen können nicht "zerstört" werden', () => {
    expect(mishapOptions('scroll')).toEqual(['fatigue', 'injury']);
    expect(mishapOptions('spellbook')).toContain('destroy');
  });

  it('Zauberbuch zerstört: aus dem Inventar', () => {
    const book = makeSpellbook('charm');
    const c = addItem(blankCharacter(), book).character;
    expect(destroyBook(c, book.itemId).items[book.itemId]).toBeUndefined();
  });

  it('Verletzung: W6 Schaden auf STÄ', () => {
    const c = blankCharacter();
    c.str = { max: 10, current: 10 };
    roll(4, 6);
    const r = mishapInjury(c);
    expect(r.d).toBe(4);
    expect(r.character.str.current).toBe(6);
  });
});
