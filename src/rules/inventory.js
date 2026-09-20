// Reine Funktionen fuers Slot-Raster. Slot-Werte:
//   null                      leer
//   { itemId }                Anker eines Gegenstands
//   { itemId, cont: true }    Fortsetzungsfeld eines bulky-Gegenstands (2 Felder)
//
// Petty-Gegenstaende (size 0) liegen NICHT im Raster, nur in character.items
// mit petty:true — sie werden separat gelistet.

import {
  ALL_SLOTS, WORN_SLOTS, PACK_SLOTS, SLOT_PAIR_FIRST, SLOT_PAIR_SECOND, itemSlotCost,
} from './character.js';

// Bevorzugte Reihenfolge beim Einraeumen: Waffen/Ruestung an den Koerper, Rest in den Rucksack.
function preferredOrder(type) {
  if (type === 'weapon' || type === 'armor' || type === 'light') return [...WORN_SLOTS, ...PACK_SLOTS];
  return [...PACK_SLOTS, ...WORN_SLOTS];
}

export function isPetty(item) {
  return itemSlotCost(item) === 0;
}

export function cellsFor(slot, size) {
  if (size !== 2) return [slot];
  const first = SLOT_PAIR_FIRST[slot];
  const second = SLOT_PAIR_SECOND[first];
  return second ? [first, second] : [first];
}

export function anchorSlotOfItem(slots, itemId) {
  return ALL_SLOTS.find((s) => slots[s]?.itemId === itemId && !slots[s]?.cont) || null;
}

export function slotsOfItem(slots, itemId) {
  return ALL_SLOTS.filter((s) => slots[s]?.itemId === itemId);
}

function withItemRemoved(slots, itemId) {
  const next = { ...slots };
  for (const s of ALL_SLOTS) if (next[s]?.itemId === itemId) next[s] = null;
  return next;
}

function withItemPlaced(slots, itemId, slot, size) {
  const next = { ...slots };
  const cells = cellsFor(slot, size);
  next[cells[0]] = { itemId };
  if (cells[1]) next[cells[1]] = { itemId, cont: true };
  return next;
}

// Erster freier Ankerplatz fuer einen Gegenstand dieser Groesse.
export function firstFreeFit(slots, size, order = ALL_SLOTS) {
  for (const slot of order) {
    if (size === 2 && SLOT_PAIR_FIRST[slot] !== slot) continue; // nur am Paar-Anker
    const cells = cellsFor(slot, size);
    if (cells.length < size) continue;
    if (cells.every((c) => slots[c] == null)) return cells[0];
  }
  return null;
}

// Verschiebt einen bereits liegenden Gegenstand auf targetSlot. -> { ok, slots } | { ok:false, reason }
export function tryMove(slots, items, itemId, targetSlot) {
  const item = items[itemId];
  if (!item) return { ok: false, reason: 'unknown' };
  const size = itemSlotCost(item) === 2 ? 2 : 1;

  const targetCells = cellsFor(targetSlot, size);
  if (targetCells.length < size) return { ok: false, reason: 'needsTwoSlots' };

  const fromAnchor = anchorSlotOfItem(slots, itemId);
  const blockers = new Set();
  for (const c of targetCells) {
    const occ = slots[c];
    if (occ && occ.itemId !== itemId) blockers.add(occ.itemId);
  }

  if (blockers.size === 0) {
    return { ok: true, slots: withItemPlaced(withItemRemoved(slots, itemId), itemId, targetSlot, size) };
  }

  // Tausch nur, wenn genau ein 1-Feld-Gegenstand im Weg ist und wir selbst 1 Feld sind.
  if (size === 1 && blockers.size === 1 && fromAnchor) {
    const otherId = [...blockers][0];
    const other = items[otherId];
    if (other && itemSlotCost(other) !== 2) {
      let next = withItemRemoved(slots, itemId);
      next = withItemRemoved(next, otherId);
      next = withItemPlaced(next, itemId, targetSlot, 1);
      next = withItemPlaced(next, otherId, fromAnchor, 1);
      return { ok: true, slots: next };
    }
  }

  return { ok: false, reason: size === 2 ? 'needsTwoSlots' : 'slotOccupied' };
}

// Neuer Gegenstand -> erster passender Platz. Petty landet ausserhalb des Rasters.
export function addItem(character, item) {
  const items = { ...character.items, [item.itemId]: item };
  if (isPetty(item)) {
    return { ok: true, character: { ...character, items: { ...items, [item.itemId]: { ...item, petty: true } } } };
  }
  const size = itemSlotCost(item) === 2 ? 2 : 1;
  const order = preferredOrder(item.type);
  const slot = firstFreeFit(character.slots, size, order) || firstFreeFit(character.slots, size);
  if (!slot) return { ok: false, reason: 'noRoom', character };
  return { ok: true, character: { ...character, items, slots: withItemPlaced(character.slots, item.itemId, slot, size) } };
}

// Neuer Gegenstand auf einen BESTIMMTEN Platz (Drag aus Tischmitte). Faellt sonst zurueck.
export function addItemAt(character, item, slot) {
  if (isPetty(item)) return addItem(character, item);
  const size = itemSlotCost(item) === 2 ? 2 : 1;
  const cells = cellsFor(slot, size);
  const fits = cells.length === size && cells.every((c) => character.slots[c] == null);
  if (!fits) return addItem(character, item);
  return {
    ok: true,
    character: {
      ...character,
      items: { ...character.items, [item.itemId]: item },
      slots: withItemPlaced(character.slots, item.itemId, slot, size),
    },
  };
}

export function removeItem(character, itemId) {
  const items = { ...character.items };
  delete items[itemId];
  return { ...character, items, slots: withItemRemoved(character.slots, itemId) };
}

// Alle Erschoepfungs-Karten entfernen (volle Nachtruhe / Wochenrast).
export function removeAllFatigue(character) {
  let c = character;
  for (const it of Object.values(character.items)) {
    if (it.type === 'condition' && it.key === 'fatigue') c = removeItem(c, it.itemId);
  }
  return c;
}

export function pettyItems(character) {
  return Object.values(character.items).filter((it) => isPetty(it));
}
