import { describe, expect, it } from 'vitest';
import { blankCharacter, ALL_SLOTS, usedSlots } from './character.js';
import { addItem } from './inventory.js';
import { makeItem } from '../data/items.js';
import { applyRest } from './rest.js';
import {
  giveFatigue, settleFatigue, dropCandidates, dropForFatigue, hasFatigueRoom,
} from './fatigue.js';

const fatigue = (c) => Object.values(c.items).filter((i) => i.key === 'fatigue').length;

function full() {
  let c = blankCharacter();
  for (let i = 0; i < ALL_SLOTS.length; i += 1) c = addItem(c, makeItem('rope')).character;
  return c;
}

describe('giveFatigue', () => {
  it('mit Platz: Karte im Inventar', () => {
    const r = giveFatigue(blankCharacter());
    expect(r.placed).toBe(true);
    expect(fatigue(r.character)).toBe(1);
    expect(r.character.fatigueOwed).toBe(0);
  });

  it('bei vollem Inventar: Erschöpfung wird offen vermerkt, nichts geht verloren', () => {
    const c = full();
    expect(hasFatigueRoom(c)).toBe(false);
    const r = giveFatigue(c);
    expect(r.placed).toBe(false);
    expect(r.character.fatigueOwed).toBe(1);
    expect(fatigue(r.character)).toBe(0);
    expect(giveFatigue(r.character).character.fatigueOwed).toBe(2);
  });

  it('Gold-Slot belegt Platz mit', () => {
    let c = blankCharacter();
    for (let i = 0; i < 9; i += 1) c = addItem(c, makeItem('rope')).character;
    c.gp = 150; // Gold zählt als 10. Slot
    expect(usedSlots(c)).toBe(10);
    expect(giveFatigue(c).placed).toBe(false);
  });
});

describe('dropForFatigue', () => {
  it('Gegenstand ablegen, Erschöpfung wandert hinein, Schuld sinkt', () => {
    const owed = giveFatigue(full()).character;
    const target = dropCandidates(owed)[0];
    const r = dropForFatigue(owed, target.itemId);
    expect(r.ok).toBe(true);
    expect(r.item.itemId).toBe(target.itemId);
    expect(fatigue(r.character)).toBe(1);
    expect(r.character.fatigueOwed).toBe(0);
    expect(r.character.items[target.itemId]).toBeUndefined();
  });

  it('Zustandskarten und Kleinkram sind keine Kandidaten', () => {
    let c = full();
    c = giveFatigue(c).character;
    c = { ...c, items: { ...c.items } };
    const petty = makeItem('chalk');
    c = addItem(c, petty).character;
    expect(dropCandidates(c).every((i) => i.type !== 'condition' && i.itemId !== petty.itemId)).toBe(true);
  });

  it('ohne offene Erschöpfung passiert nichts', () => {
    const c = full();
    expect(dropForFatigue(c, dropCandidates(c)[0].itemId).ok).toBe(false);
  });

  it('sperriger Gegenstand schafft zwei Plätze', () => {
    let c = blankCharacter();
    c = addItem(c, makeItem('w_heavy')).character; // 2 Slots
    for (let i = 0; i < 8; i += 1) c = addItem(c, makeItem('rope')).character;
    const owed = giveFatigue(c).character;
    expect(owed.fatigueOwed).toBe(1);
    const r = dropForFatigue(owed, dropCandidates(owed).find((i) => i.size === 2).itemId);
    expect(r.ok).toBe(true);
    expect(hasFatigueRoom(r.character)).toBe(true);
  });
});

describe('settleFatigue', () => {
  it('nimmt die offene Erschöpfung auf, sobald Platz ist', () => {
    const owed = giveFatigue(full()).character;
    expect(settleFatigue(owed).ok).toBe(false);
    const roomy = { ...owed, items: {}, slots: blankCharacter().slots };
    const r = settleFatigue(roomy);
    expect(r.ok).toBe(true);
    expect(r.character.fatigueOwed).toBe(0);
    expect(fatigue(r.character)).toBe(1);
  });
});

describe('Nachtruhe', () => {
  it('räumt auch die offene Erschöpfung ab', () => {
    const owed = giveFatigue(full()).character;
    const rested = applyRest(owed, 'night').character;
    expect(rested.fatigueOwed).toBe(0);
  });
});
