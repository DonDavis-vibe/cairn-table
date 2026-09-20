// Gegenstands-Katalog, abgeleitet aus dem Cairn-2e-Marketplace + Core Rules.
// Cairn von Yochai Gal, CC BY-SA 4.0. Wirkungstexte sind zusammengefasst.
//
// type:  weapon | armor | gear | light | ration | spellbook | scroll | relic | condition | valuable
// size:  0 (petty, kein Slot) | 1 | 2 (bulky)
// usage: { max } | null   ·   damage: "d6" | "d8" | "d10" | "d6+d6"   ·   armor: 1|2|3

import { newId } from '../rules/character.js';
import { SPELL_BY_ID } from './spells.js';
import { RELIC_BY_ID } from './relics.js';
import { TRINKETS } from './trinkets.js';

export const ITEM_CATALOG = {
  // --- Waffen ---
  w_light: {
    type: 'weapon', size: 1, damage: 'd6', cost: 5,
    name: { de: 'Leichte Waffe (W6)', en: 'Light weapon (d6)' },
    effect: { de: 'Dolch, Knüppel, Sichel, Stab, Schleuder …', en: 'Dagger, cudgel, sickle, staff, sling …' },
  },
  w_medium: {
    type: 'weapon', size: 1, damage: 'd8', cost: 10,
    name: { de: 'Mittlere Waffe (W8)', en: 'Medium weapon (d8)' },
    effect: { de: 'Speer, Schwert, Streitkolben, Axt, Kriegsflegel …', en: 'Spear, sword, mace, axe, flail …' },
  },
  w_heavy: {
    type: 'weapon', size: 2, damage: 'd10', cost: 20,
    name: { de: 'Schwere Waffe (W10, sperrig)', en: 'Heavy weapon (d10, bulky)' },
    effect: { de: 'Hellebarde, Kriegshammer, Langschwert …', en: 'Halberd, war hammer, long sword …' },
  },
  w_bow: {
    type: 'weapon', size: 2, damage: 'd6', cost: 20,
    name: { de: 'Bogen (W6, sperrig)', en: 'Bow (d6, bulky)' },
    effect: { de: 'Fernkampf. Munition wird nicht gezählt.', en: 'Ranged. Ammunition is not tracked.' },
  },
  w_crossbow: {
    type: 'weapon', size: 2, damage: 'd8', cost: 30,
    name: { de: 'Armbrust (W8, sperrig)', en: 'Crossbow (d8, bulky)' },
    effect: { de: 'Fernkampf. Munition wird nicht gezählt.', en: 'Ranged. Ammunition is not tracked.' },
  },

  // --- Rüstung ---
  a_shield: { type: 'armor', size: 1, armor: 1, cost: 10, name: { de: 'Schild (+1 Rüstung)', en: 'Shield (+1 Armor)' }, effect: { de: 'Nur wirksam, solange gehalten.', en: 'Only while held.' } },
  a_helmet: { type: 'armor', size: 1, armor: 1, cost: 10, name: { de: 'Helm (+1 Rüstung)', en: 'Helmet (+1 Armor)' }, effect: { de: 'Nur wirksam, solange getragen.', en: 'Only while worn.' } },
  a_gambeson: { type: 'armor', size: 1, armor: 1, cost: 15, name: { de: 'Gambeson (+1 Rüstung)', en: 'Gambeson (+1 Armor)' }, effect: { de: '', en: '' } },
  a_brigandine: { type: 'armor', size: 2, armor: 1, cost: 20, name: { de: 'Brigantine (1 Rüstung, sperrig)', en: 'Brigandine (1 Armor, bulky)' }, effect: { de: '', en: '' } },
  a_chainmail: { type: 'armor', size: 2, armor: 2, cost: 40, name: { de: 'Kettenhemd (2 Rüstung, sperrig)', en: 'Chainmail (2 Armor, bulky)' }, effect: { de: '', en: '' } },
  a_plate: { type: 'armor', size: 2, armor: 3, cost: 60, name: { de: 'Plattenpanzer (3 Rüstung, sperrig)', en: 'Plate (3 Armor, bulky)' }, effect: { de: 'Rüstung ist bei 3 gedeckelt.', en: 'Armor is capped at 3.' } },

  // --- Licht & Nahrung ---
  torch: { type: 'light', size: 1, usage: { max: 3 }, cost: 5, name: { de: 'Fackel', en: 'Torch' }, effect: { de: 'Spendet Licht. 3 Nutzungen.', en: 'Provides light. 3 uses.' } },
  lantern: { type: 'light', size: 1, cost: 10, name: { de: 'Laterne', en: 'Lantern' }, effect: { de: 'Braucht Öl.', en: 'Needs oil.' } },
  oil_can: { type: 'gear', size: 1, usage: { max: 6 }, cost: 10, name: { de: 'Ölkanne', en: 'Oil Can' }, effect: { de: '6 Nutzungen. Auch als Brandöl.', en: '6 uses. Also as fire oil.' } },
  rations: { type: 'ration', size: 1, usage: { max: 3 }, cost: 10, name: { de: 'Rationen', en: 'Rations' }, effect: { de: '3 Nutzungen. Eine pro Tag, sonst Entbehrung.', en: '3 uses. One per day or become Deprived.' } },

  // --- Ausrüstung ---
  bandages: { type: 'gear', size: 1, usage: { max: 3 }, cost: 30, name: { de: 'Bandagen', en: 'Bandages' }, effect: { de: 'Stabilisiert einen kritisch Verletzten.', en: 'Stabilizes a critically wounded character.' } },
  rope: { type: 'gear', size: 1, cost: 5, name: { de: 'Seil (7,5 m)', en: 'Rope (25ft)' }, effect: { de: '', en: '' } },
  grappling_hook: { type: 'gear', size: 1, cost: 25, name: { de: 'Enterhaken', en: 'Grappling Hook' }, effect: { de: '', en: '' } },
  pole: { type: 'gear', size: 1, cost: 5, name: { de: 'Stange (3 m)', en: 'Pole (10ft)' }, effect: { de: '', en: '' } },
  lockpicks: { type: 'gear', size: 1, cost: 25, name: { de: 'Diebeswerkzeug', en: 'Thieving Tools' }, effect: { de: 'Dietrich, Metallfeile …', en: 'Lockpick, metal file …' } },
  common_tools: { type: 'gear', size: 1, cost: 10, name: { de: 'Einfaches Werkzeug', en: 'Common Tools' }, effect: { de: 'Hammer, Schaufel …', en: 'Hammer, shovel …' } },
  common_agents: { type: 'gear', size: 1, cost: 10, name: { de: 'Hilfsmittel', en: 'Common Agents' }, effect: { de: 'Leim, Fett …', en: 'Glue, grease …' } },
  containers: { type: 'gear', size: 1, cost: 10, name: { de: 'Behälter', en: 'Containers' }, effect: { de: 'Sack, Wasserschlauch …', en: 'Sack, waterskin …' } },
  cooking_gear: { type: 'gear', size: 1, cost: 10, name: { de: 'Kochgeschirr', en: 'Cooking Gear' }, effect: { de: '', en: '' } },
  outdoor_comfort: { type: 'gear', size: 1, cost: 10, name: { de: 'Lagerkomfort', en: 'Outdoor Comfort' }, effect: { de: 'Decke, Hängematte …', en: 'Blanket, hammock …' } },
  tent: { type: 'gear', size: 2, cost: 20, name: { de: 'Zelt (für 2, sperrig)', en: 'Tent (fits 2, bulky)' }, effect: { de: '', en: '' } },
  caltrops: { type: 'gear', size: 1, cost: 10, name: { de: 'Krähenfüße', en: 'Caltrops' }, effect: { de: '', en: '' } },
  net: { type: 'gear', size: 1, cost: 10, name: { de: 'Netz', en: 'Net' }, effect: { de: 'Ein Ziel festsetzen.', en: 'Entangle a target.' } },
  antitoxin: { type: 'gear', size: 1, cost: 20, name: { de: 'Gegengift', en: 'Antitoxin' }, effect: { de: '', en: '' } },
  sedative: { type: 'gear', size: 1, cost: 30, name: { de: 'Beruhigungsmittel', en: 'Sedative' }, effect: { de: '', en: '' } },
  repellent: { type: 'gear', size: 1, cost: 10, name: { de: 'Abwehrmittel', en: 'Repellent' }, effect: { de: 'Wolfsbann, Beifuß …', en: 'Wolfsbane, mugwort …' } },
  spyglass: { type: 'gear', size: 1, cost: 40, name: { de: 'Fernrohr', en: 'Spyglass' }, effect: { de: '', en: '' } },
  compass: { type: 'gear', size: 1, cost: 75, name: { de: 'Kompass', en: 'Compass' }, effect: { de: '', en: '' } },
  trap: { type: 'gear', size: 1, cost: 35, name: { de: 'Falle (W6 STÄ-Schaden)', en: 'Trap (d6 STR damage)' }, effect: { de: '', en: '' } },
  instrument_simple: { type: 'gear', size: 1, cost: 10, name: { de: 'Einfaches Instrument', en: 'Simple Instrument' }, effect: { de: 'Flöte, Laute …', en: 'Pipes, lute …' } },

  // --- Petty (kein Slot) ---
  chalk: { type: 'gear', size: 0, cost: 1, name: { de: 'Kreide', en: 'Chalk' }, effect: { de: '', en: '' } },
  whistle: { type: 'gear', size: 0, cost: 15, name: { de: 'Pfeife', en: 'Whistle' }, effect: { de: '', en: '' } },
  smoking_pipe: { type: 'gear', size: 0, cost: 15, name: { de: 'Tabakspfeife', en: 'Smoking Pipe' }, effect: { de: '', en: '' } },
  gloves: { type: 'gear', size: 0, cost: 20, name: { de: 'Handschuhe', en: 'Gloves' }, effect: { de: '', en: '' } },
  wilderness_clothes: { type: 'gear', size: 0, cost: 15, name: { de: 'Wildniskleidung', en: 'Wilderness Clothes' }, effect: { de: 'Poncho, Umhang …', en: 'Poncho, cloak …' } },
};

export const CATALOG_KEYS = Object.keys(ITEM_CATALOG);

// Zustaende — belegen einen Slot, bis die "clear"-Bedingung erfuellt ist.
export const CONDITION_CATALOG = {
  fatigue: {
    name: { de: 'Erschöpfung', en: 'Fatigue' },
    effect: { de: 'Belegt einen Slot. Durch Entbehrung, Zaubern oder die Fiktion.', en: 'Fills one slot. From deprivation, casting spells, or the fiction.' },
    clear: { de: 'Volle Nachtruhe an einem sicheren Ort', en: "A full night's rest in a safe spot" },
  },
  frightened: {
    name: { de: 'Verängstigt', en: 'Frightened' },
    effect: { de: 'Nur schwer der Quelle der Angst zu nähern.', en: 'Struggles to approach the source of fear.' },
    clear: { de: 'Wenn die Bedrohung vorbei ist', en: 'When the threat has passed' },
  },
  blinded: {
    name: { de: 'Geblendet', en: 'Blinded' },
    effect: { de: 'Kann nicht sehen. Angriffe sind beeintraechtigt.', en: 'Cannot see. Attacks are impaired.' },
    clear: { de: 'Nach Behandlung / wenn es vergeht', en: 'After treatment / when it passes' },
  },
  poisoned: {
    name: { de: 'Vergiftet', en: 'Poisoned' },
    effect: { de: 'Laufender Schaden oder Nachteil, je nach Gift.', en: 'Ongoing damage or disadvantage, per the poison.' },
    clear: { de: 'Gegengift oder Zeit', en: 'Antitoxin or time' },
  },
};

function baseFromKey(key) {
  if (ITEM_CATALOG[key]) return { ...ITEM_CATALOG[key], key };
  return null;
}

export function makeItem(key, overrides = {}) {
  const spec = baseFromKey(key) || {
    key: null, type: 'gear', size: 1,
    name: { de: overrides.nameText || 'Gegenstand', en: overrides.nameText || 'Item' },
    effect: { de: '', en: '' },
  };
  const usage = overrides.usage === null ? null : overrides.usage ?? spec.usage ?? null;
  return {
    itemId: newId('i'),
    key: spec.key ?? null,
    type: overrides.type || spec.type,
    size: overrides.size ?? spec.size ?? 1,
    name: overrides.name || spec.name,
    effect: overrides.effect || spec.effect || { de: '', en: '' },
    damage: overrides.damage ?? spec.damage ?? null,
    armor: overrides.armor ?? spec.armor ?? null,
    usage: usage ? { max: usage.max, current: usage.current ?? 0 } : null,
    ...(overrides.spellId ? { spellId: overrides.spellId } : {}),
    ...(overrides.relicId ? { relicId: overrides.relicId } : {}),
    ...(overrides.recharge ? { recharge: overrides.recharge } : {}),
    cleared: false,
  };
}

export function makeCondition(key, overrides = {}) {
  const spec = CONDITION_CATALOG[key];
  return {
    itemId: newId('i'),
    key: spec ? key : null,
    type: 'condition',
    size: 1,
    name: spec?.name || (typeof overrides.name === 'string' ? { de: overrides.name, en: overrides.name } : overrides.name) || { de: 'Zustand', en: 'Condition' },
    effect: spec?.effect || overrides.effect || { de: '', en: '' },
    clear: spec?.clear || null,
    damage: null, armor: null, usage: null, cleared: false,
  };
}

export function makeFatigue() {
  return makeCondition('fatigue');
}

// Kleinkram aus dem Gegenstands-Generator: petty, rein Flavor, kein Effekt.
export function makeTrinket(trinket) {
  return {
    itemId: newId('i'), key: null, type: 'trinket', size: 0,
    name: trinket,
    effect: { de: '', en: '' },
    damage: null, armor: null, usage: null, cleared: false,
  };
}

export function randomTrinket() {
  return TRINKETS[Math.floor(Math.random() * TRINKETS.length)];
}

// Zauberbuch: 1 Slot, ein Zauber. Wirken -> Erschöpfung (im Bogen-Handler).
export function makeSpellbook(spellId) {
  const s = SPELL_BY_ID[spellId];
  if (!s) return null;
  return {
    itemId: newId('i'), key: null, type: 'spellbook', size: 1,
    spellId,
    name: { de: `Zauberbuch: ${s.name.de}`, en: `Spellbook: ${s.name.en}` },
    effect: s.effect,
    damage: null, armor: null, usage: null, cleared: false,
  };
}

// Schriftrolle: petty, kein Erschöpfungs-Effekt, verschwindet nach einmaliger Nutzung.
export function makeScroll(spellId) {
  const s = SPELL_BY_ID[spellId];
  if (!s) return null;
  return {
    itemId: newId('i'), key: null, type: 'scroll', size: 0,
    spellId,
    name: { de: `Schriftrolle: ${s.name.de}`, en: `Scroll: ${s.name.en}` },
    effect: s.effect,
    damage: null, armor: null, usage: null, cleared: false,
  };
}

// Relikt: keine Erschöpfung, begrenzte Ladungen/Nutzungen + meist Aufladebedingung.
export function makeRelic(relicId) {
  const r = RELIC_BY_ID[relicId];
  if (!r) return null;
  const n = r.charges ?? r.uses ?? null;
  return {
    itemId: newId('i'), key: null, type: 'relic', size: r.size ?? 1,
    relicId,
    name: r.name,
    effect: r.effect,
    damage: r.damage ?? null,
    armor: r.armor ?? null,
    usage: n ? { max: n, current: 0 } : null,
    recharge: r.recharge ?? null,
    cleared: false,
  };
}
