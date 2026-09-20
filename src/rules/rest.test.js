import { describe, expect, it } from 'vitest';
import { blankCharacter } from './character.js';
import { addItem } from './inventory.js';
import { makeFatigue } from '../data/items.js';
import { applyRest } from './rest.js';

function hurt() {
  let c = blankCharacter();
  c.hp = { max: 8, current: 2 };
  c.str = { max: 14, current: 9 };
  c.dex = { max: 10, current: 7 };
  c.wil = { max: 12, current: 12 };
  c.critical = true;
  c = addItem(c, makeFatigue()).character;
  c = addItem(c, makeFatigue()).character;
  return c;
}

const fatigueCount = (c) => Object.values(c.items).filter((i) => i.key === 'fatigue').length;

describe('applyRest', () => {
  it('kurze Rast stellt HP voll her, Erschöpfung/Attribute/critical bleiben', () => {
    const { character, msg, blocked } = applyRest(hurt(), 'short');
    expect(blocked).toBeUndefined();
    expect(character.hp.current).toBe(8);
    expect(character.str.current).toBe(9);
    expect(character.critical).toBe(true);
    expect(fatigueCount(character)).toBe(2);
    expect(msg.key).toBe('rest.log.short');
  });

  it('Nachtruhe stellt HP her und entfernt alle Erschöpfung, Attribute/critical bleiben', () => {
    const { character, msg } = applyRest(hurt(), 'night');
    expect(character.hp.current).toBe(8);
    expect(fatigueCount(character)).toBe(0);
    expect(character.str.current).toBe(9);
    expect(character.critical).toBe(true);
    expect(msg.key).toBe('rest.log.night');
  });

  it('Wochenrast stellt HP, Erschöpfung und Attribute her und hebt critical auf', () => {
    const { character, msg } = applyRest(hurt(), 'week');
    expect(character.hp.current).toBe(8);
    expect(fatigueCount(character)).toBe(0);
    expect(character.str.current).toBe(14);
    expect(character.dex.current).toBe(10);
    expect(character.critical).toBe(false);
    expect(msg.key).toBe('rest.log.week');
  });

  it('Entbehrung blockt jede Erholung', () => {
    const c = { ...hurt(), deprived: true };
    const short = applyRest(c, 'short');
    expect(short.blocked).toBe(true);
    expect(short.character).toBe(c);
    expect(applyRest(c, 'week').blocked).toBe(true);
  });

  it('mutiert das Original nicht', () => {
    const c = hurt();
    applyRest(c, 'week');
    expect(c.hp.current).toBe(2);
    expect(c.str.current).toBe(9);
    expect(fatigueCount(c)).toBe(2);
  });
});
