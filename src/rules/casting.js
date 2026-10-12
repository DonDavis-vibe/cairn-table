// Zaubern (Cairn 2e, Magic -> Casting Spells):
//   Wer ein Zauberbuch mit beiden Haenden haelt und laut liest, wirkt den Zauber
//   und erhaelt eine Erschoepfung. Ist die Figur entbehrend oder in Gefahr (etwa
//   im Kampf), kann der Warden einen WIL-Rettungswurf gegen uebele Folgen
//   verlangen. Folgen eines Fehlschlags stehen im Verhaeltnis zum Zauber: zusaetzliche
//   Erschoepfung, Zerstoerung des Zauberbuchs, Verletzung, sogar Tod.

import { rollSave, rollDie } from './dice.js';
import { resolveAttributeDamage } from './combat.js';
import { removeItem } from './inventory.js';

// Was macht den Zauber riskant? 'deprived' | 'danger'
export function castRisks(character) {
  const out = [];
  if (character.deprived) out.push('deprived');
  if (character.inDanger) out.push('danger');
  return out;
}

export const castSave = (character) => rollSave(character.wil.current);

// Folgen, die der Warden nach einem misslungenen Rettungswurf verhaengen kann.
// Schriftrollen verschwinden ohnehin, ein Zauberbuch kann zerstoert werden.
export const mishapOptions = (kind) => (kind === 'scroll' ? ['fatigue', 'injury'] : ['fatigue', 'destroy', 'injury']);

// Zauberbuch zerstoert.
export const destroyBook = (character, itemId) => removeItem(character, itemId);

// Verletzung: W6 Schaden direkt auf STAE (ausserhalb des Kampfes geht Schaden aufs Attribut).
export function mishapInjury(character) {
  const d = rollDie(6);
  const r = resolveAttributeDamage(character, 'str', d);
  return { ...r, d };
}
