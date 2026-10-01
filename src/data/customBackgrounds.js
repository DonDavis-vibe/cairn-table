// Community-Hintergruende: Wardens koennen eigene/Homebrew-Hintergruende als JSON
// importieren (Dom Bosco, Cairn-Discord: "standardize a .json format for backgrounds
// ... so Wardens could upload them to their Cairn Table instance and make them
// available to players"). Format + Validierung dokumentiert in docs/custom-backgrounds.md.
//
// Rein lokal (wie die NSC-Bibliothek des Wardens): localStorage, kein Raum-Sync.
// "Verfuegbar fuer Spieler:innen" heisst hier: die JSON-Datei wird (Discord, E-Mail, ...)
// geteilt, jede:r importiert sie in den eigenen Browser. Offizielle SRD-Hintergruende
// (BACKGROUNDS) bleiben davon getrennt — eigene Lizenz, eigenes d20-Wuerfeltable.
//
// Absichtlich NICHT Teil von backgroundByRoll()/rollExample(): das waere das offizielle
// d20-Tisch-Table der SRD, dessen 20 fixen Eintraege wir nicht durch Homebrew verwaessern.
// Custom-Hintergruende werden stattdessen bewusst per Dropdown gewaehlt.

import { CATALOG_KEYS } from './items.js';
import { readJSON, writeJSON } from '../utils/storage.js';

export const CUSTOM_BG_KEY = 'cairn-table-custom-backgrounds';

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isLocalized = (v) => v && typeof v === 'object' && isNonEmptyString(v.de) && isNonEmptyString(v.en);
const DAMAGE_RE = /^d\d+(\+d\d+)*$/i;

// Eine Gear-Angabe: entweder ein Katalog-Verweis ({key}) oder ein eigener
// Gegenstand ({custom: {de,en,size?,damage?,armor?,usage?,petty?}}) — exakt
// die Form, die gearToItem() im Wizard schon erwartet.
function validateGearEntry(entry, path, errors) {
  if (!entry || typeof entry !== 'object') { errors.push(`${path}: not an object`); return; }
  if (entry.key !== undefined) {
    if (!isNonEmptyString(entry.key)) { errors.push(`${path}.key: must be a string`); return; }
    if (!CATALOG_KEYS.includes(entry.key)) {
      errors.push(`${path}.key: "${entry.key}" is not a known item (see the catalog keys in docs/custom-backgrounds.md)`);
    }
    return;
  }
  if (entry.custom !== undefined) {
    const c = entry.custom;
    if (!c || typeof c !== 'object') { errors.push(`${path}.custom: not an object`); return; }
    if (!isNonEmptyString(c.de) || !isNonEmptyString(c.en)) errors.push(`${path}.custom: needs both "de" and "en" names`);
    if (c.size !== undefined && ![0, 1, 2].includes(c.size)) errors.push(`${path}.custom.size: must be 0, 1 or 2`);
    if (c.damage !== undefined && c.damage !== null && !DAMAGE_RE.test(String(c.damage))) errors.push(`${path}.custom.damage: "${c.damage}" doesn't look like dice notation (e.g. "d6", "d6+d6")`);
    if (c.armor !== undefined && c.armor !== null && !(Number.isFinite(c.armor) && c.armor > 0)) errors.push(`${path}.custom.armor: must be a positive number`);
    if (c.usage !== undefined && c.usage !== null && !(Number.isFinite(c.usage) && c.usage > 0)) errors.push(`${path}.custom.usage: must be a positive number`);
    return;
  }
  errors.push(`${path}: needs either "key" (catalog item) or "custom" (your own item)`);
}

function validateTable(tbl, path, errors) {
  if (!tbl || typeof tbl !== 'object') { errors.push(`${path}: not an object`); return; }
  if (!isLocalized(tbl.q)) errors.push(`${path}.q: needs both "de" and "en"`);
  if (!Array.isArray(tbl.rolls) || tbl.rolls.length < 2) { errors.push(`${path}.rolls: needs at least 2 entries`); return; }
  tbl.rolls.forEach((r, i) => { if (!isLocalized(r)) errors.push(`${path}.rolls[${i}]: needs both "de" and "en"`); });
}

// Ein einzelner Hintergrund. `knownIds` = bereits vergebene IDs (offizielle +
// schon importierte), damit Kollisionen VOR dem Speichern auffliegen.
export function validateBackground(bg, knownIds) {
  const errors = [];
  const label = isNonEmptyString(bg?.id) ? bg.id : '(no id)';
  const path = (s) => `Background "${label}"${s}`;

  if (!bg || typeof bg !== 'object') return { ok: false, errors: ['Not an object'] };
  if (!isNonEmptyString(bg.id)) errors.push('id: required, non-empty string');
  else if (knownIds.has(bg.id)) errors.push(path(`: id "${bg.id}" is already used by another background (official or imported) — pick a unique id`));
  if (!isLocalized(bg.name)) errors.push(path(': name needs both "de" and "en"'));
  if (bg.blurb !== undefined && !isLocalized(bg.blurb)) errors.push(path(': blurb, if given, needs both "de" and "en"'));
  if (!Array.isArray(bg.names) || bg.names.length === 0 || !bg.names.every(isNonEmptyString)) {
    errors.push(path(': names must be a non-empty array of strings'));
  }
  if (!Array.isArray(bg.gear)) errors.push(path(': gear must be an array (may be empty)'));
  else bg.gear.forEach((g, i) => validateGearEntry(g, path(`.gear[${i}]`), errors));
  if (bg.tables !== undefined) {
    if (!Array.isArray(bg.tables)) errors.push(path(': tables must be an array'));
    else bg.tables.forEach((tbl, i) => validateTable(tbl, path(`.tables[${i}]`), errors));
  }
  if (bg.extra !== undefined && (typeof bg.extra !== 'object' || bg.extra === null)) errors.push(path(': extra, if given, must be an object'));

  return { ok: errors.length === 0, errors };
}

// Normalisiert ein importiertes Objekt auf die Form, die der Wizard erwartet
// (fehlende optionale Felder bekommen sichere Vorgaben).
function normalizeBackground(bg) {
  return {
    id: bg.id,
    name: bg.name,
    blurb: bg.blurb ?? { de: '', en: '' },
    names: bg.names,
    gear: bg.gear,
    tables: Array.isArray(bg.tables) ? bg.tables : [],
    extra: bg.extra && typeof bg.extra === 'object' ? bg.extra : undefined,
  };
}

// Eine hochgeladene Datei kann sein: ein einzelner Hintergrund, ein Array davon,
// oder {packName, backgrounds:[...]}. officialIds = Set der 20 SRD-IDs, gegen die
// zusaetzlich zu bereits importierten IDs geprueft wird.
export function parsePack(raw, officialIds, existingCustomIds) {
  let packName = null;
  let list = raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.backgrounds)) {
    packName = isNonEmptyString(raw.packName) ? raw.packName.trim() : null;
    list = raw.backgrounds;
  }
  if (!Array.isArray(list)) list = [list];
  if (list.length === 0) return { accepted: [], rejected: [{ label: '(empty file)', errors: ['No backgrounds found'] }], packName };

  const knownIds = new Set([...officialIds, ...existingCustomIds]);
  const accepted = [];
  const rejected = [];
  for (const bg of list) {
    const { ok, errors } = validateBackground(bg, knownIds);
    if (ok) {
      knownIds.add(bg.id); // auch gegen Dubletten *innerhalb* derselben Datei
      accepted.push(normalizeBackground(bg));
    } else {
      rejected.push({ label: isNonEmptyString(bg?.id) ? bg.id : '(no id)', errors });
    }
  }
  return { accepted, rejected, packName };
}

// --- Ablage (localStorage) --------------------------------------------------

let seq = 0;
const packId = () => `pack_${Date.now().toString(36)}${(seq += 1)}`;

export function loadCustomPacks() {
  const packs = readJSON(CUSTOM_BG_KEY, []);
  return Array.isArray(packs) ? packs : [];
}

export function saveCustomPack(backgrounds, packName) {
  const packs = loadCustomPacks();
  const pack = { id: packId(), name: packName || null, importedAt: Date.now(), backgrounds };
  const next = [...packs, pack];
  writeJSON(CUSTOM_BG_KEY, next);
  return next;
}

export function removeCustomPack(id) {
  const next = loadCustomPacks().filter((p) => p.id !== id);
  writeJSON(CUSTOM_BG_KEY, next);
  return next;
}

// Alle Hintergruende aus allen Packs, flach — jeder mit _packId/_custom markiert,
// damit die Wizard-UI sie von offiziellen unterscheiden und beim Entfernen eines
// Packs sauber wieder rausfiltern kann.
export function flattenCustomPacks(packs) {
  return packs.flatMap((p) => p.backgrounds.map((bg) => ({ ...bg, _custom: true, _packId: p.id, _packName: p.name })));
}
