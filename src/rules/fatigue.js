// Erschoepfung ohne freien Slot (Cairn 2e, Deprivation & Fatigue):
//   "If a character is forced to add Fatigue to their inventory but they have
//   no free slots, they must drop an item from their inventory."
// Die Erschoepfung wird dann als offen vermerkt (fatigueOwed); die Figur legt
// einen Gegenstand ab und nimmt sie auf.

import { freeSlots, itemSlotCost, ALL_SLOTS } from './character.js';
import { addItemAt, removeItem, firstFreeFit } from './inventory.js';
import { makeFatigue } from '../data/items.js';

// Platz fuer eine weitere 1-Slot-Karte? Gold-Slots zaehlen mit, maximal 10 Slots.
export const hasFatigueRoom = (character) => freeSlots(character) >= 1 && !!firstFreeFit(character.slots, 1);

const place = (character) => {
  const res = addItemAt(character, makeFatigue(), 'pack_6');
  return res.ok ? res.character : null;
};

// Erschoepfung erzwingen: ins Inventar, sonst als offen vermerken.
export function giveFatigue(character) {
  const placed = hasFatigueRoom(character) ? place(character) : null;
  if (placed) return { character: placed, placed: true };
  return { character: { ...character, fatigueOwed: (character.fatigueOwed || 0) + 1 }, placed: false };
}

// Offene Erschoepfung aufnehmen, sobald Platz da ist.
export function settleFatigue(character) {
  if (!(character.fatigueOwed > 0) || !hasFatigueRoom(character)) return { ok: false, character };
  const placed = place(character);
  if (!placed) return { ok: false, character };
  return { ok: true, character: { ...placed, fatigueOwed: character.fatigueOwed - 1 } };
}

// Gegenstaende, die einen Slot belegen und abgelegt werden koennen (keine Zustandskarten).
export function dropCandidates(character) {
  return ALL_SLOTS
    .map((s) => character.slots[s])
    .filter((ref) => ref && !ref.cont)
    .map((ref) => character.items[ref.itemId])
    .filter((it) => it && it.type !== 'condition' && itemSlotCost(it) > 0);
}

// Gegenstand ablegen und die offene Erschoepfung aufnehmen.
export function dropForFatigue(character, itemId) {
  const item = dropCandidates(character).find((it) => it.itemId === itemId);
  if (!item || !(character.fatigueOwed > 0)) return { ok: false, character };
  const freed = removeItem(character, itemId);
  const settled = settleFatigue(freed);
  if (!settled.ok) return { ok: false, character };
  return { ok: true, character: settled.character, item };
}
