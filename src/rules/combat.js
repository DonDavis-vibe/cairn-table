// Cairn-Schadenskette als reine Funktionen. Der Aufrufer (Bogen / SL-Befehl)
// wendet das Ergebnis an und zeigt die faelligen Wuerfe (STR-Save, Narbe).
//
// Kette bei Schaden im Kampf:
//   1. Schaden - Ruestung  -> Rest auf HP
//   2. HP faellt unter 0    -> Ueberschuss von STR abziehen, dann STR-Save (neuer Wert)
//   3. HP exakt auf 0       -> Narbe (Tabelle nach verlorener HP)
//   4. STR (oder DEX/WIL) auf 0 -> tot / gelaehmt / wahnsinnig

import { ATTR_KEYS, effectiveMaxHp } from './character.js';

export function attributeZeroEffect(attr) {
  return attr === 'str' ? 'dead' : attr === 'dex' ? 'paralyzed' : 'delirious';
}

// amount = Schaden NACH Ruestungsabzug (reine HP-Zahl).
export function resolveDamage(character, amount) {
  const dmg = Math.max(0, Math.round(amount));
  // Bei vollem Inventar (10 Slots) sind die TP im Kampf 0 — Schaden schlaegt
  // dann sofort auf STÄ durch (Cairn 2e, Character Creation -> Inventory).
  const hp0 = Math.min(character.hp.current, effectiveMaxHp(character));
  const after = hp0 - dmg;

  const next = { ...character, hp: { ...character.hp } };
  const result = {
    character: next,
    dmg,
    hpLost: Math.min(hp0, dmg),
    overflow: 0,
    scar: null,       // { hpLost }  -> auf der Narbentabelle wuerfeln
    strSave: null,    // { attr:'str', target }  -> Save gegen kritischen Schaden
    death: false,
    log: { key: 'combat.log.hp', vars: { dmg } },
  };

  if (dmg === 0) return result;

  if (after > 0) {
    next.hp.current = after;
    return result;
  }

  if (after === 0) {
    next.hp.current = 0;
    result.scar = { hpLost: hp0 };
    result.log = { key: 'combat.log.scar', vars: { dmg } };
    return result;
  }

  // after < 0 -> Ueberschuss auf STR
  next.hp.current = 0;
  const overflow = -after;
  result.overflow = overflow;
  const newStr = Math.max(0, character.str.current - overflow);
  next.str = { ...character.str, current: newStr };

  if (newStr === 0) {
    next.critical = true;
    result.death = true;
    result.log = { key: 'combat.log.strZero', vars: { dmg, overflow } };
    return result;
  }

  // STR-Save wird NICHT automatisch geworfen — der Aufrufer zeigt den Wurf an.
  result.strSave = { attr: 'str', target: newStr };
  result.log = { key: 'combat.log.strHit', vars: { dmg, overflow, str: newStr } };
  return result;
}

// Schaden ausserhalb des Kampfes: direkt auf ein Attribut (meist STR).
export function resolveAttributeDamage(character, attr, amount) {
  if (!ATTR_KEYS.includes(attr)) return { character, log: null };
  const amt = Math.max(0, Math.round(amount));
  const cur = Math.max(0, character[attr].current - amt);
  const next = { ...character, [attr]: { ...character[attr], current: cur } };
  const result = { character: next, attr, amount: amt, zero: false, effect: null, log: { key: 'combat.log.attr', vars: { attr: attr.toUpperCase(), amt } } };
  if (cur === 0) {
    result.zero = true;
    result.effect = attributeZeroEffect(attr);
    if (attr === 'str') { next.critical = true; result.death = true; }
    result.log = { key: `combat.log.zero.${attr}`, vars: {} };
  }
  return result;
}

// Heilen: HP bis Max, oder ein Attribut bis Max.
export function heal(character, target, amount) {
  if (target === 'hp') {
    return { ...character, hp: { ...character.hp, current: Math.min(character.hp.max, character.hp.current + amount) } };
  }
  if (ATTR_KEYS.includes(target)) {
    return { ...character, [target]: { ...character[target], current: Math.min(character[target].max, character[target].current + amount) } };
  }
  return character;
}
