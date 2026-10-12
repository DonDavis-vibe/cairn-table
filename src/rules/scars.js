// Narbeneffekte (Cairn 2e, Core Rules -> Scars) als reine Funktionen.
// Texte stehen in data/scars.js; hier die Mechanik dahinter: Wuerfe, Attribut-
// und Max-TP-Aenderungen, Zustaende. Zufall kommt aus dice.js (Math.random),
// Tests ersetzen ihn.
//
// Ergebnis jeder Funktion: { character, notes } mit notes = [{ key, vars }].
// vars duerfen { de, en }-Objekte (Ortsnamen) oder Attribut-Schluessel enthalten;
// utils/scarNotes.js macht daraus Text.

import { rollDice, rollDie, rollSave } from './dice.js';

const LOCATIONS = [
  { de: 'Hals', en: 'neck' }, { de: 'Hände', en: 'hands' }, { de: 'Auge', en: 'eye' },
  { de: 'Brust', en: 'chest' }, { de: 'Beine', en: 'legs' }, { de: 'Ohr', en: 'ear' },
];
const LIMBS = [
  { de: 'Bein', en: 'leg' }, { de: 'Bein', en: 'leg' }, { de: 'Arm', en: 'arm' },
  { de: 'Arm', en: 'arm' }, { de: 'Rippe', en: 'rib' }, { de: 'Schädel', en: 'skull' },
];
const HEAD_ATTRS = ['str', 'str', 'dex', 'dex', 'wil', 'wil'];

// Effekte, die erst nach der Genesung (Wochenrast) greifen.
//   hpReroll  n W6 > max. TP -> neuer Wert     hpSet  n W6 = neue max. TP
//   dexReroll n W6 > max. GES -> neuer Wert
const PENDING = {
  4: { kind: 'hpReroll', dice: 2 },
  5: { kind: 'hpReroll', dice: 2 },
  7: { kind: 'dexReroll', dice: 3 },
  11: { kind: 'hpSet', dice: 2 },
};

const note = (key, vars = {}) => ({ key, vars });

function hpReroll(character, diceCount) {
  const { total } = rollDice(diceCount, 6);
  const old = character.hp.max;
  if (total > old) {
    return { character: { ...character, hp: { ...character.hp, max: total } }, notes: [note('scar.fx.hpRaised', { roll: total, old, new: total })] };
  }
  return { character, notes: [note('scar.fx.hpKept', { roll: total, old })] };
}

// Attribut hochsetzen (Max und Aktuell um dieselbe Differenz), wenn der Wurf
// ueber dem Vergleichswert liegt.
function attrReroll(character, attr, diceCount, compareTo) {
  const { total } = rollDice(diceCount, 6);
  const base = compareTo === 'max' ? character[attr].max : character[attr].current;
  if (total <= base) return { character, notes: [note('scar.fx.attrKept', { attr, roll: total, old: base })] };
  const delta = total - character[attr].max;
  const a = character[attr];
  const next = compareTo === 'max'
    ? { max: total, current: Math.min(total, a.current + delta) }
    : { max: Math.max(a.max, total), current: total };
  return {
    character: { ...character, [attr]: next },
    notes: [note('scar.fx.attrRaised', { attr, roll: total, old: base, new: total })],
  };
}

function attrSaveBonus(character, attr, sides) {
  const s = rollSave(character[attr].current);
  if (!s.ok) return { character, notes: [note('scar.fx.saveFailed', { attr, roll: s.d, target: s.target })] };
  const bonus = rollDie(sides);
  const a = character[attr];
  return {
    character: { ...character, [attr]: { max: a.max + bonus, current: a.current + bonus } },
    notes: [note('scar.fx.attrAdded', { attr, roll: s.d, target: s.target, bonus, new: a.max + bonus })],
  };
}

function chain(character, ...steps) {
  let c = character;
  const notes = [];
  for (const step of steps) {
    const r = step(c);
    c = r.character;
    notes.push(...r.notes);
  }
  return { character: c, notes };
}

const withPending = (character, index) => ({
  ...character,
  pendingScarFx: [...(character.pendingScarFx || []), { scar: index, ...PENDING[index] }],
});

// Wendet den Effekt von Narbe #index an. Aufrufer traegt die Narbe selbst ein.
export function applyScar(character, index) {
  switch (index) {
    case 1: {
      const where = LOCATIONS[rollDie(6) - 1];
      return chain(character, (c) => ({ character: c, notes: [note('scar.fx.where', { where })] }), (c) => hpReroll(c, 1));
    }
    case 2:
      return hpReroll(character, 1);
    case 3: {
      const bonus = rollDie(6);
      return {
        character: { ...character, deprived: true, hp: { ...character.hp, max: character.hp.max + bonus } },
        notes: [note('scar.fx.walloped', { bonus, new: character.hp.max + bonus })],
      };
    }
    case 4: {
      const where = LIMBS[rollDie(6) - 1];
      return { character: withPending(character, 4), notes: [note('scar.fx.where', { where }), note('scar.fx.pending', { what: 'hp2' })] };
    }
    case 5:
      return { character: withPending(character, 5), notes: [note('scar.fx.pending', { what: 'hp2' })] };
    case 6: {
      const attr = HEAD_ATTRS[rollDie(6) - 1];
      return chain(character, (c) => ({ character: c, notes: [note('scar.fx.headAttr', { attr })] }), (c) => attrReroll(c, attr, 3, 'current'));
    }
    case 7:
      return { character: withPending(character, 7), notes: [note('scar.fx.pending', { what: 'dex3' })] };
    case 8:
      return attrSaveBonus(character, 'wil', 4);
    case 9:
      return attrReroll(character, 'wil', 3, 'max');
    case 10:
      return attrSaveBonus(character, 'wil', 6);
    case 11:
      return {
        character: withPending({ ...character, critical: true, deprived: true }, 11),
        notes: [note('scar.fx.mortal'), note('scar.fx.pending', { what: 'hpSet' })],
      };
    case 12:
      return { character: { ...character, doomed: true }, notes: [note('scar.fx.doomed')] };
    default:
      return { character, notes: [] };
  }
}

// Verzoegerte Effekte (Wochenrast = Genesung). Aufgerufen von applyRest('week').
export function applyPendingScarFx(character) {
  const list = character.pendingScarFx || [];
  if (!list.length) return { character, notes: [] };
  let c = { ...character, pendingScarFx: [] };
  const notes = [];
  for (const fx of list) {
    let r;
    if (fx.kind === 'hpReroll') r = hpReroll(c, fx.dice);
    else if (fx.kind === 'dexReroll') r = attrReroll(c, 'dex', fx.dice, 'max');
    else {
      const { total } = rollDice(fx.dice, 6);
      r = { character: { ...c, hp: { ...c.hp, max: total } }, notes: [note('scar.fx.hpSet', { roll: total, new: total })] };
    }
    c = r.character;
    notes.push(...r.notes);
  }
  return { character: c, notes };
}

// Naechster Rettungswurf gegen kritischen Schaden bei "Verdammt" (#12).
export function resolveDoomedSave(character, ok) {
  if (!ok) {
    return {
      character: { ...character, doomed: false, critical: true, str: { ...character.str, current: 0 } },
      notes: [note('scar.fx.doomedDead')],
      death: true,
    };
  }
  const r = hpReroll({ ...character, doomed: false }, 3);
  return { character: r.character, notes: [note('scar.fx.doomedSurvived'), ...r.notes], death: false };
}
