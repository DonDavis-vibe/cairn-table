import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankCharacter } from './character.js';
import { applyScar, applyPendingScarFx, resolveDoomedSave } from './scars.js';
import { applyRest } from './rest.js';

// Math.random so scripten, dass nacheinander die gewuenschten Wuerfelaugen fallen.
// Wert so waehlen, dass floor(r * sides) + 1 === face -> r = (face - 0.5) / sides.
function script(...pairs) {
  const spy = vi.spyOn(Math, 'random');
  pairs.forEach(([face, sides]) => spy.mockReturnValueOnce((face - 0.5) / sides));
}

function base() {
  const c = blankCharacter();
  c.hp = { max: 4, current: 0 };
  c.str = { max: 10, current: 10 };
  c.dex = { max: 10, current: 10 };
  c.wil = { max: 10, current: 10 };
  return c;
}

afterEach(() => vi.restoreAllMocks());

describe('applyScar', () => {
  it('#2 Erschütternder Schlag: 1W6 über max. TP setzt neuen Wert, sonst unverändert', () => {
    const c = base();
    script([6, 6]);
    expect(applyScar(c, 2).character.hp.max).toBe(6);
    script([3, 6]);
    expect(applyScar(c, 2).character.hp.max).toBe(4);
  });

  it('#1 Bleibende Narbe würfelt erst den Ort, dann die TP', () => {
    const c = base();
    script([1, 6], [5, 6]);
    const r = applyScar(c, 1);
    expect(r.notes[0].key).toBe('scar.fx.where');
    expect(r.notes[0].vars.where.en).toBe('neck');
    expect(r.character.hp.max).toBe(5);
  });

  it('#3 Voll erwischt: Entbehrung und +1W6 max. TP', () => {
    const c = base();
    script([4, 6]);
    const r = applyScar(c, 3);
    expect(r.character.deprived).toBe(true);
    expect(r.character.hp.max).toBe(8);
  });

  it('#6 Kopfwunde: Attribut nach 1W6, 3W6 über aktuellem Wert setzt Max und Aktuell', () => {
    const c = base();
    c.dex = { max: 12, current: 7 };
    script([3, 6], [6, 6], [5, 6], [4, 6]); // GES; 6+5+4 = 15
    const r = applyScar(c, 6);
    expect(r.character.dex).toEqual({ max: 15, current: 15 });
  });

  it('#8 Taub: bestandener WIL-Save hebt max. und aktuelle WIL um 1W4', () => {
    const c = base();
    script([5, 20], [3, 4]);
    const r = applyScar(c, 8);
    expect(r.character.wil).toEqual({ max: 13, current: 13 });
  });

  it('#8 Taub: misslungener Save ändert nichts', () => {
    const c = base();
    script([18, 20]);
    const r = applyScar(c, 8);
    expect(r.character.wil).toEqual({ max: 10, current: 10 });
    expect(r.notes[0].key).toBe('scar.fx.saveFailed');
  });

  it('#9 Umgekrempelt: 3W6 über max. WIL hebt max. und aktuell um die Differenz', () => {
    const c = base();
    c.wil = { max: 10, current: 7 };
    script([6, 6], [6, 6], [4, 6]); // 16
    expect(applyScar(c, 9).character.wil).toEqual({ max: 16, current: 13 });
  });

  it('#11 Tödliche Wunde: kritisch + Entbehrung, neue max. TP erst bei Wochenrast', () => {
    const r = applyScar(base(), 11);
    expect(r.character.critical).toBe(true);
    expect(r.character.deprived).toBe(true);
    expect(r.character.pendingScarFx).toHaveLength(1);
    expect(r.character.hp.max).toBe(4);
  });

  it('#12 Verdammt setzt doomed', () => {
    expect(applyScar(base(), 12).character.doomed).toBe(true);
  });
});

describe('verzögerte Effekte', () => {
  it('#4 Gebrochenes Glied: 2W6 greifen erst bei der Wochenrast', () => {
    const b = base();
    script([2, 6]); // Ort
    const c = applyScar(b, 4).character;
    expect(c.hp.max).toBe(4);
    script([6, 6], [5, 6]); // 11
    const r = applyRest(c, 'week');
    expect(r.character.hp.max).toBe(11);
    expect(r.character.pendingScarFx).toEqual([]);
    expect(r.notes[0].key).toBe('scar.fx.hpRaised');
  });

  it('#7 Kniesehne: 3W6 über max. GES greifen bei der Wochenrast', () => {
    const c = applyScar(base(), 7).character;
    script([6, 6], [6, 6], [5, 6]); // 17
    const r = applyPendingScarFx(c);
    expect(r.character.dex.max).toBe(17);
  });

  it('#11: 2W6 sind die neue max. TP, auch wenn niedriger', () => {
    const c = applyScar({ ...base(), hp: { max: 9, current: 3 } }, 11).character;
    script([1, 6], [2, 6]);
    expect(applyPendingScarFx(c).character.hp.max).toBe(3);
  });

  it('Entbehrung blockiert die Wochenrast samt verzögerten Effekten', () => {
    const c = applyScar(base(), 11).character; // deprived
    const r = applyRest(c, 'week');
    expect(r.blocked).toBe(true);
    expect(c.pendingScarFx).toHaveLength(1);
  });
});

describe('resolveDoomedSave', () => {
  it('misslungen: Tod (STÄ 0)', () => {
    const r = resolveDoomedSave({ ...base(), doomed: true }, false);
    expect(r.death).toBe(true);
    expect(r.character.str.current).toBe(0);
    expect(r.character.doomed).toBe(false);
  });

  it('gelungen: doomed weg, 3W6 gegen max. TP', () => {
    const c = { ...base(), doomed: true };
    script([6, 6], [6, 6], [6, 6]);
    const r = resolveDoomedSave(c, true);
    expect(r.death).toBe(false);
    expect(r.character.doomed).toBe(false);
    expect(r.character.hp.max).toBe(18);
  });
});
