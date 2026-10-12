import { describe, expect, it } from 'vitest';
import { blankCharacter } from './character.js';
import { addItem } from './inventory.js';
import { makeItem, makeFatigue } from '../data/items.js';
import { rationsLeft, eatRation, makeCamp } from './rations.js';

function withRations(...used) {
  let c = blankCharacter();
  c.hp = { max: 6, current: 2 };
  used.forEach((u) => {
    const it = makeItem('rations');
    it.usage.current = u;
    c = addItem(c, it).character;
  });
  return c;
}
const fatigue = (c) => Object.values(c.items).filter((i) => i.key === 'fatigue').length;

describe('rationsLeft / eatRation', () => {
  it('zählt die Restnutzungen aller Rationen', () => {
    expect(rationsLeft(withRations(0, 1))).toBe(5);
    expect(rationsLeft(blankCharacter())).toBe(0);
  });

  it('isst zuerst aus der angebrochenen Ration', () => {
    const c = withRations(0, 2);
    const r = eatRation(c);
    expect(r.ok).toBe(true);
    expect(r.left).toBe(3); // volle Ration (3) bleibt, die angebrochene ist aufgebraucht
    const used = Object.values(r.character.items).map((i) => i.usage.current).sort();
    expect(used).toEqual([0, 3]);
  });

  it('ohne Ration: nichts passiert', () => {
    const r = eatRation(blankCharacter());
    expect(r.ok).toBe(false);
  });
});

describe('makeCamp', () => {
  it('Ration essen + Nachtruhe: TP voll, Erschöpfung weg', () => {
    let c = withRations(0);
    c = addItem(c, makeFatigue()).character;
    const r = makeCamp(c);
    expect(r.fed).toBe(true);
    expect(r.left).toBe(2);
    expect(r.character.hp.current).toBe(6);
    expect(fatigue(r.character)).toBe(0);
    expect(r.msg.key).toBe('camp.log.fed');
  });

  it('satt beendet die Entbehrung', () => {
    const c = { ...withRations(0), deprived: true };
    expect(makeCamp(c).character.deprived).toBe(false);
  });

  it('ohne Ration: Entbehrung, keine Erholung, Erschöpfung bleibt', () => {
    let c = blankCharacter();
    c.hp = { max: 6, current: 2 };
    c = addItem(c, makeFatigue()).character;
    const r = makeCamp(c);
    expect(r.fed).toBe(false);
    expect(r.character.deprived).toBe(true);
    expect(r.character.hp.current).toBe(2);
    expect(fatigue(r.character)).toBe(1);
  });

  it('aufgebrauchte Rationen zählen nicht', () => {
    const r = makeCamp(withRations(3));
    expect(r.fed).toBe(false);
  });
});
