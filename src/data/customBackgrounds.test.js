import { describe, expect, it } from 'vitest';
import { validateBackground, parsePack } from './customBackgrounds.js';

const officialIds = new Set(['aurifex', 'barber-surgeon']);

function validBg(overrides = {}) {
  return {
    id: 'riverwarden',
    name: { de: 'Flusswächter:in', en: 'Riverwarden' },
    blurb: { de: 'Hütet die Furt.', en: 'Guards the ford.' },
    names: ['Alder', 'Reed'],
    gear: [{ key: 'rations' }, { custom: { de: 'Angel', en: 'Fishing rod' } }],
    tables: [
      { q: { de: 'Frage?', en: 'Question?' }, rolls: [{ de: 'A', en: 'A' }, { de: 'B', en: 'B' }] },
    ],
    ...overrides,
  };
}

describe('validateBackground', () => {
  it('akzeptiert einen vollstaendigen, gueltigen Hintergrund', () => {
    const r = validateBackground(validBg(), new Set(officialIds));
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('verlangt eine id und meldet Kollisionen mit offiziellen IDs', () => {
    expect(validateBackground(validBg({ id: '' }), new Set()).ok).toBe(false);
    const r = validateBackground(validBg({ id: 'aurifex' }), new Set(officialIds));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/already used/);
  });

  it('verlangt name.de UND name.en', () => {
    const r = validateBackground(validBg({ name: { de: 'Nur Deutsch' } }), new Set());
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /name/.test(e))).toBe(true);
  });

  it('blurb ist optional, names nicht', () => {
    const noBlurb = validateBackground(validBg({ blurb: undefined }), new Set());
    expect(noBlurb.ok).toBe(true);
    const noNames = validateBackground(validBg({ names: [] }), new Set());
    expect(noNames.ok).toBe(false);
  });

  it('lehnt unbekannte Katalog-Keys im Gear ab', () => {
    const r = validateBackground(validBg({ gear: [{ key: 'does_not_exist' }] }), new Set());
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/does_not_exist/);
  });

  it('prueft eigene Gear-Objekte (custom) auf Pflichtfelder und Wuerfelnotation', () => {
    const r1 = validateBackground(validBg({ gear: [{ custom: { de: 'Nur Deutsch' } }] }), new Set());
    expect(r1.ok).toBe(false);
    const r2 = validateBackground(validBg({ gear: [{ custom: { de: 'X', en: 'X', damage: 'nope' } }] }), new Set());
    expect(r2.ok).toBe(false);
    expect(r2.errors[0]).toMatch(/damage/);
    const r3 = validateBackground(validBg({ gear: [{ custom: { de: 'X', en: 'X', damage: 'd6+d6' } }] }), new Set());
    expect(r3.ok).toBe(true);
  });

  it('gear-Eintrag braucht entweder key oder custom', () => {
    const r = validateBackground(validBg({ gear: [{}] }), new Set());
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/key.*custom|custom.*key/);
  });

  it('tables ist optional, aber wenn vorhanden muessen q und rolls stimmen', () => {
    const noTables = validateBackground(validBg({ tables: undefined }), new Set());
    expect(noTables.ok).toBe(true);
    const badTable = validateBackground(validBg({ tables: [{ q: { de: 'A' }, rolls: [{ de: 'x', en: 'x' }] } ] }), new Set());
    expect(badTable.ok).toBe(false);
  });

  it('extra darf bondTwice/omenAlways tragen, muss aber ein Objekt sein', () => {
    const ok = validateBackground(validBg({ extra: { omenAlways: true } }), new Set());
    expect(ok.ok).toBe(true);
    const bad = validateBackground(validBg({ extra: 'nope' }), new Set());
    expect(bad.ok).toBe(false);
  });
});

describe('parsePack', () => {
  it('akzeptiert einen einzelnen Hintergrund ohne Huelle', () => {
    const r = parsePack(validBg(), officialIds, new Set());
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(0);
  });

  it('akzeptiert ein rohes Array', () => {
    const r = parsePack([validBg(), validBg({ id: 'other' })], officialIds, new Set());
    expect(r.accepted).toHaveLength(2);
  });

  it('akzeptiert {packName, backgrounds} und liest den Namen aus', () => {
    const r = parsePack({ packName: 'Fan Pack', backgrounds: [validBg()] }, officialIds, new Set());
    expect(r.packName).toBe('Fan Pack');
    expect(r.accepted).toHaveLength(1);
  });

  it('lehnt einzelne fehlerhafte Eintraege ab, importiert den Rest trotzdem', () => {
    const r = parsePack([validBg(), validBg({ id: '' })], officialIds, new Set());
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(1);
  });

  it('erkennt doppelte IDs innerhalb derselben Datei', () => {
    const r = parsePack([validBg({ id: 'dup' }), validBg({ id: 'dup' })], officialIds, new Set());
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(1);
    expect(r.rejected[0].errors[0]).toMatch(/already used/);
  });

  it('meldet eine leere Datei statt stillzuschweigen', () => {
    const r = parsePack([], officialIds, new Set());
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected).toHaveLength(1);
  });
});
