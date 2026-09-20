// Charakter-Datenmodell fuer Cairn (2e) + reine Ableitungen. Kein DOM, kein State.

export const SCHEMA_VERSION = 1;

export const ATTR_KEYS = ['str', 'dex', 'wil'];

// 10 Slots: 4 "am Koerper / in den Haenden" + 6 "Rucksack".
// (Cairn 2e: insgesamt 10, davon 6 im Rucksack. Bequem sind ~4-5 ohne Taschen.)
export const WORN_SLOTS = ['worn_1', 'worn_2', 'worn_3', 'worn_4'];
export const PACK_SLOTS = ['pack_1', 'pack_2', 'pack_3', 'pack_4', 'pack_5', 'pack_6'];
export const ALL_SLOTS = [...WORN_SLOTS, ...PACK_SLOTS];
export const MAX_SLOTS = 10;

// Ein sperriger (bulky) Gegenstand belegt ein festes Feldpaar; das erste ist der Anker.
export const SLOT_PAIR_FIRST = {
  worn_1: 'worn_1', worn_2: 'worn_1', worn_3: 'worn_3', worn_4: 'worn_3',
  pack_1: 'pack_1', pack_2: 'pack_1', pack_3: 'pack_3', pack_4: 'pack_3', pack_5: 'pack_5', pack_6: 'pack_5',
};
export const SLOT_PAIR_SECOND = {
  worn_1: 'worn_2', worn_3: 'worn_4', pack_1: 'pack_2', pack_3: 'pack_4', pack_5: 'pack_6',
};

export function newId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function blankTraits() {
  return {
    physique: '', skin: '', hair: '', face: '', speech: '', clothing: '', virtue: '', vice: '',
  };
}

export function blankCharacter() {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('c'),
    name: '',
    playerName: '',
    portrait: '',
    background: '',
    traits: blankTraits(),
    bond: '',
    age: 0,
    omen: '',

    // Attribute (3-18). max = Startwert, current sinkt durch kritischen Schaden.
    str: { max: 10, current: 10 },
    dex: { max: 10, current: 10 },
    wil: { max: 10, current: 10 },

    hp: { max: 4, current: 4 },   // Hit Protection
    gp: 0,                        // Gold (Beutel < 100 gp = petty, kein Slot)
    goldSlotThreshold: 0,        // 0 = aus. Auf 100 gesetzt: je 100 gp ein zusaetzlicher Slot.
    deprived: false,             // blockt jede Erholung
    panicked: false,             // Panik (Procedures): TP 0, keine Handlung in Runde 1, Angriffe beeintraechtigt

    scars: [],                   // [{ hpLost, name, at }]
    critical: false,             // kritisch verletzt: kann nur kriechen, stirbt in 1 h ohne Hilfe

    slots: Object.fromEntries(ALL_SLOTS.map((s) => [s, null])),
    items: {},                   // itemId -> Item
    notes: '',
  };
}

// Ist der Bogen praktisch unberuehrt? -> Wizard anbieten.
export function isBlank(c) {
  if (!c) return true;
  if (c.name?.trim()) return false;
  if (Object.keys(c.items || {}).length > 0) return false;
  return ATTR_KEYS.every((k) => c[k]?.max === 10 && c[k]?.current === 10);
}

// Defensiver Merge fuer geladene/importierte Daten.
export function normalizeCharacter(raw) {
  const base = blankCharacter();
  if (!raw || typeof raw !== 'object') return base;
  const merged = { ...base, ...raw };
  merged.id = raw.id || base.id;
  for (const k of [...ATTR_KEYS, 'hp']) {
    merged[k] = { ...base[k], ...raw[k] };
    merged[k].current = Math.min(merged[k].current, merged[k].max);
  }
  merged.traits = { ...base.traits, ...raw.traits };
  merged.slots = { ...base.slots, ...raw.slots };
  merged.items = raw.items && typeof raw.items === 'object' ? raw.items : {};
  merged.scars = Array.isArray(raw.scars) ? raw.scars : [];
  merged.gp = Number.isFinite(raw.gp) ? raw.gp : 0;
  merged.goldSlotThreshold = Number.isFinite(raw.goldSlotThreshold) ? raw.goldSlotThreshold : 0;
  merged.deprived = !!raw.deprived;
  merged.critical = !!raw.critical;
  merged.panicked = !!raw.panicked;
  merged.portrait = typeof raw.portrait === 'string' ? raw.portrait : '';
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}

// --- Slot-Ableitungen -------------------------------------------------------

// Wie viele Felder belegt ein Gegenstand? petty (0) / normal (1) / bulky (2).
export function itemSlotCost(item) {
  if (!item) return 0;
  if (item.size === 0 || item.petty) return 0;
  return item.size === 2 ? 2 : 1;
}

// Gold ab der Schwelle zaehlt als Slot (Character Creation -> Inventory: "a bag
// of coins worth less than 100gp is petty"). threshold 0 = Hausregel aus.
// Kein physisches Feld im Raster - nur Teil der Slot-SUMME (wie im offiziellen
// Foundry-System: dort gibt es dafuer auch kein Rasterfeld, nur einen Zaehler).
export function goldSlots(character) {
  const threshold = character.goldSlotThreshold || 0;
  return threshold > 0 ? Math.floor((character.gp || 0) / threshold) : 0;
}

// Belegte Felder gesamt (Gegenstaende + Fatigue-Karten + ggf. Gold-Slots).
export function usedSlots(character) {
  const items = ALL_SLOTS.reduce((n, s) => {
    const ref = character.slots[s];
    if (ref && !ref.cont) n += itemSlotCost(character.items[ref.itemId]);
    return n;
  }, 0);
  return items + goldSlots(character);
}

export function freeSlots(character) {
  return Math.max(0, MAX_SLOTS - usedSlots(character));
}

// Effektive HP-Obergrenze: ein voll belegtes Inventar (alle 10, inkl. Gold-
// Slots) oder Panik (Procedures -> Panic) druecken die TP auf 0.
export function effectiveMaxHp(character) {
  if (character.panicked) return 0;
  return usedSlots(character) >= MAX_SLOTS ? 0 : character.hp.max;
}
