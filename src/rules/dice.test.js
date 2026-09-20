import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import {
  toW, rollDie, rollSave, rollDamage, rollReaction, rollDieOfFate, rollAttribute,
} from './dice.js';

// Math.random so steuern, dass rollDie(n) einen bestimmten Wert liefert.
// rollDie = 1 + floor(r * n)  ->  fuer Wert v: r = (v - 0.5) / n
function seedRolls(values) {
  const queue = [...values];
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const v = queue.length > 1 ? queue.shift() : queue[0];
    return v;
  });
}

afterEach(() => vi.restoreAllMocks());

describe('toW', () => {
  it('wandelt Wuerfelnotation um, ohne Buchstaben zu zerstoeren', () => {
    expect(toW('d6')).toBe('W6');
    expect(toW('d8+d8')).toBe('W8+W8');
    expect(toW('dagger (d6)')).toBe('dagger (W6)');
    expect(toW(null)).toBe('');
  });
});

describe('rollDie', () => {
  it('bleibt im Bereich 1..sides', () => {
    for (let i = 0; i < 200; i += 1) {
      const r = rollDie(6);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollAttribute', () => {
  it('summiert 3W6 (3..18)', () => {
    seedRolls([0.99]); // jeweils 6
    const r = rollAttribute();
    expect(r.dice).toHaveLength(3);
    expect(r.value).toBe(18);
  });
});

describe('rollSave', () => {
  it('1 gelingt immer, auch ueber dem Attribut', () => {
    seedRolls([0]); // -> 1
    const r = rollSave(3);
    expect(r.d).toBe(1);
    expect(r.ok).toBe(true);
    expect(r.nat1).toBe(true);
  });

  it('20 misslingt immer, auch unter dem Attribut', () => {
    seedRolls([0.999]); // -> 20
    const r = rollSave(18);
    expect(r.d).toBe(20);
    expect(r.ok).toBe(false);
    expect(r.nat20).toBe(true);
  });

  it('normaler Wurf: <= Attribut gelingt', () => {
    seedRolls([(10 - 0.5) / 20]); // -> 10
    expect(rollSave(10).ok).toBe(true);
    seedRolls([(11 - 0.5) / 20]); // -> 11
    expect(rollSave(10).ok).toBe(false);
  });

  it('adv nimmt den niedrigeren von zwei Wuerfeln', () => {
    seedRolls([(15 - 0.5) / 20, (4 - 0.5) / 20]);
    const r = rollSave(10, 'adv');
    expect(r.dice).toEqual([15, 4]);
    expect(r.d).toBe(4);
    expect(r.ok).toBe(true);
  });

  it('disadv nimmt den hoeheren', () => {
    seedRolls([(6 - 0.5) / 20, (18 - 0.5) / 20]);
    const r = rollSave(10, 'disadv');
    expect(r.d).toBe(18);
    expect(r.ok).toBe(false);
  });
});

describe('rollDamage', () => {
  it('zieht Ruestung ab, nie unter 0', () => {
    seedRolls([0.99]); // W6 -> 6
    expect(rollDamage('d6', { armor: 2 }).final).toBe(4);
    seedRolls([0]); // W6 -> 1
    expect(rollDamage('d6', { armor: 3 }).final).toBe(0);
  });

  it('impaired wuerfelt W4 statt der Waffe', () => {
    seedRolls([0.99]);
    const r = rollDamage('d12', { mode: 'impaired' });
    expect(r.pool.every((p) => p.sides === 4)).toBe(true);
    expect(r.raw).toBe(4);
  });

  it('enhanced wuerfelt W12', () => {
    seedRolls([0.99]);
    const r = rollDamage('d6', { mode: 'enhanced' });
    expect(r.raw).toBe(12);
  });

  it('mehrere Angreifer: hoechster Wurf zaehlt', () => {
    seedRolls([(2 - 0.5) / 6, (5 - 0.5) / 6, (3 - 0.5) / 6]);
    const r = rollDamage('d6', { attackers: 3 });
    expect(r.pool).toHaveLength(3);
    expect(r.raw).toBe(5);
  });

  it('Doppelwaffe d8+d8: bester der beiden', () => {
    seedRolls([(3 - 0.5) / 8, (7 - 0.5) / 8]);
    const r = rollDamage('d8+d8');
    expect(r.raw).toBe(7);
  });
});

describe('rollReaction', () => {
  it('2 = hostile, 12 = helpful, 7 = curious', () => {
    seedRolls([0]); // 1+1 = 2
    expect(rollReaction().key).toBe('hostile');
    seedRolls([0.99]); // 6+6 = 12
    expect(rollReaction().key).toBe('helpful');
    seedRolls([(4 - 0.5) / 6, (3 - 0.5) / 6]); // 7
    expect(rollReaction().key).toBe('curious');
  });
});

describe('rollDieOfFate', () => {
  it('4+ beguenstigt die SC', () => {
    seedRolls([(4 - 0.5) / 6]);
    expect(rollDieOfFate().favorsPcs).toBe(true);
    seedRolls([(3 - 0.5) / 6]);
    expect(rollDieOfFate().favorsPcs).toBe(false);
  });
});
