import { describe, expect, it } from 'vitest';
import { blankCharacter, ALL_SLOTS } from './character.js';
import {
  resolveDamage, resolveAttributeDamage, heal, attributeZeroEffect, hitFoe, moraleTrigger,
} from './combat.js';

function hero(over = {}) {
  const c = blankCharacter();
  c.hp = { max: 6, current: 6 };
  c.str = { max: 12, current: 12 };
  c.dex = { max: 10, current: 10 };
  c.wil = { max: 10, current: 10 };
  return { ...c, ...over };
}

describe('resolveDamage', () => {
  it('Schaden unter HP: nur HP sinkt, keine Folgen', () => {
    const r = resolveDamage(hero(), 4);
    expect(r.character.hp.current).toBe(2);
    expect(r.scar).toBeNull();
    expect(r.strSave).toBeNull();
    expect(r.death).toBe(false);
    expect(r.log.key).toBe('combat.log.hp');
  });

  it('HP exakt auf 0: Narbe faellig, STR unberuehrt', () => {
    const r = resolveDamage(hero(), 6);
    expect(r.character.hp.current).toBe(0);
    expect(r.scar).toEqual({ hpLost: 6 });
    expect(r.character.str.current).toBe(12);
    expect(r.log.key).toBe('combat.log.scar');
  });

  it('Ueberschuss trifft STR und loest einen STR-Save aus', () => {
    const r = resolveDamage(hero(), 10); // 6 auf HP, 4 Ueberschuss
    expect(r.character.hp.current).toBe(0);
    expect(r.overflow).toBe(4);
    expect(r.character.str.current).toBe(8);
    expect(r.strSave).toEqual({ attr: 'str', target: 8 });
    expect(r.death).toBe(false);
  });

  it('Ueberschuss reduziert STR auf 0: Tod, critical gesetzt', () => {
    const r = resolveDamage(hero({ str: { max: 12, current: 4 } }), 12); // 6 HP, 6 Ueberschuss > 4
    expect(r.character.str.current).toBe(0);
    expect(r.death).toBe(true);
    expect(r.character.critical).toBe(true);
    expect(r.strSave).toBeNull();
    expect(r.log.key).toBe('combat.log.strZero');
  });

  it('negative/krumme Betraege werden gerundet und geklemmt', () => {
    expect(resolveDamage(hero(), -3).character.hp.current).toBe(6);
    expect(resolveDamage(hero(), 2.4).character.hp.current).toBe(4);
  });

  it('0 Schaden aendert nichts (kein Narbenwurf)', () => {
    const r = resolveDamage(hero(), 0);
    expect(r.character.hp.current).toBe(6);
    expect(r.scar).toBeNull();
  });

  it('volles Inventar (10 Slots): TP sind 0 -> Schaden schlaegt sofort auf STÄ', () => {
    const c = hero();
    for (const s of ALL_SLOTS) c.slots[s] = { itemId: s };
    for (const s of ALL_SLOTS) c.items[s] = { itemId: s, size: 1 };
    // hp.current bleibt 6, effektiv aber 0
    const r = resolveDamage(c, 3);
    expect(r.character.hp.current).toBe(0);
    expect(r.overflow).toBe(3);
    expect(r.character.str.current).toBe(9); // 12 - 3
    expect(r.strSave).toEqual({ attr: 'str', target: 9 });
  });

  it('mutiert das Original nicht', () => {
    const c = hero();
    resolveDamage(c, 10);
    expect(c.hp.current).toBe(6);
    expect(c.str.current).toBe(12);
  });
});

describe('resolveAttributeDamage', () => {
  it('zieht direkt vom Attribut ab', () => {
    const r = resolveAttributeDamage(hero(), 'dex', 3);
    expect(r.character.dex.current).toBe(7);
    expect(r.zero).toBe(false);
  });

  it('DEX auf 0 = gelaehmt, kein Tod', () => {
    const r = resolveAttributeDamage(hero(), 'dex', 99);
    expect(r.character.dex.current).toBe(0);
    expect(r.zero).toBe(true);
    expect(r.effect).toBe('paralyzed');
    expect(r.death).toBeUndefined();
  });

  it('STR auf 0 = Tod + critical', () => {
    const r = resolveAttributeDamage(hero(), 'str', 99);
    expect(r.death).toBe(true);
    expect(r.character.critical).toBe(true);
    expect(r.log.key).toBe('combat.log.zero.str');
  });

  it('unbekanntes Attribut: unveraendert', () => {
    const c = hero();
    expect(resolveAttributeDamage(c, 'luck', 3).character).toBe(c);
  });
});

describe('heal', () => {
  it('HP bis Max, nicht darueber', () => {
    expect(heal(hero({ hp: { max: 6, current: 2 } }), 'hp', 3).hp.current).toBe(5);
    expect(heal(hero({ hp: { max: 6, current: 5 } }), 'hp', 10).hp.current).toBe(6);
  });

  it('Attribut bis Max', () => {
    expect(heal(hero({ str: { max: 12, current: 8 } }), 'str', 2).str.current).toBe(10);
    expect(heal(hero({ str: { max: 12, current: 8 } }), 'str', 99).str.current).toBe(12);
  });

  it('unbekanntes Ziel: unveraendert', () => {
    const c = hero();
    expect(heal(c, 'nope', 5)).toBe(c);
  });
});

describe('attributeZeroEffect', () => {
  it('str/dex/wil', () => {
    expect(attributeZeroEffect('str')).toBe('dead');
    expect(attributeZeroEffect('dex')).toBe('paralyzed');
    expect(attributeZeroEffect('wil')).toBe('delirious');
  });
});

describe('hitFoe', () => {
  const orc = { hp: 4, armor: 1, str: 12 };

  it('zieht Rüstung ab und senkt die TP', () => {
    const r = hitFoe(orc, 3);
    expect(r.dmg).toBe(2);
    expect(r.foe.hp).toBe(2);
    expect(r.down).toBe(false);
    expect(r.strSave).toBeNull();
  });

  it('Rüstung schluckt kleinen Schaden komplett', () => {
    const r = hitFoe(orc, 1);
    expect(r.dmg).toBe(0);
    expect(r.foe.hp).toBe(4);
  });

  it('TP genau 0: ausgefallen, kein STÄ-Save', () => {
    const r = hitFoe(orc, 5);
    expect(r.foe.hp).toBe(0);
    expect(r.down).toBe(true);
    expect(r.strSave).toBeNull();
  });

  it('Überschuss geht auf STÄ und verlangt den Save mit dem neuen Wert', () => {
    const r = hitFoe(orc, 8); // 7 netto -> 3 Überschuss
    expect(r.overflow).toBe(3);
    expect(r.foe.str).toBe(9);
    expect(r.strSave).toEqual({ target: 9 });
    expect(r.down).toBe(true);
  });

  it('STÄ 0 vernichtet', () => {
    const r = hitFoe({ hp: 1, armor: 0, str: 3 }, 9);
    expect(r.dead).toBe(true);
    expect(r.foe.str).toBe(0);
    expect(r.strSave).toBeNull();
  });

  it('bereits ausgefallener Gegner: voller Schaden auf STÄ, nicht erneut "down"', () => {
    const r = hitFoe({ hp: 0, armor: 0, str: 10 }, 4);
    expect(r.overflow).toBe(4);
    expect(r.down).toBe(false);
    expect(r.foe.str).toBe(6);
  });

  it('subtractArmor:false nimmt den Wert als netto', () => {
    expect(hitFoe(orc, 3, { subtractArmor: false }).dmg).toBe(3);
  });
});

describe('moraleTrigger', () => {
  const f = (hp) => ({ hp });
  it('erster Ausfall', () => {
    expect(moraleTrigger([f(3), f(3), f(3), f(3)], [f(0), f(3), f(3), f(3)])).toBe('first');
  });
  it('Hälfte ausgefallen', () => {
    expect(moraleTrigger([f(0), f(3), f(3), f(3)], [f(0), f(0), f(3), f(3)])).toBe('half');
  });
  it('dazwischen und am Ende kein Hinweis', () => {
    expect(moraleTrigger([f(0), f(0), f(0), f(3), f(3)], [f(0), f(0), f(0), f(0), f(3)])).toBeNull();
    expect(moraleTrigger([f(0), f(3)], [f(0), f(0)])).toBeNull();
  });
  it('einzelner Gegner bei 0 TP: Moral', () => {
    expect(moraleTrigger([f(2)], [f(0)])).toBe('lone');
  });
  it('kein neuer Ausfall: kein Hinweis', () => {
    expect(moraleTrigger([f(3), f(3)], [f(2), f(3)])).toBeNull();
  });
});
