// Frei anordenbare Warden-Dashboard-Panels: welche ID in welcher Spalte, in
// welcher Reihenfolge. Rein lokal (wie Sprache/Theme), nicht raum-synchronisiert.
import { readJSON, writeJSON } from './storage.js';

const KEY = 'cairn-table-gm-layout';

export const DEFAULT_GM_LAYOUT = {
  left: ['combat', 'map', 'stash', 'containers', 'generators', 'party'],
  right: ['warden', 'log'],
};

// Gespeicherte Anordnung mit dem Default abgleichen: unbekannte (entfernte)
// IDs rausfiltern, neue Panels (kuenftige Features) in ihre Default-Spalte
// nachtragen, statt bei bestehender gespeicherter Anordnung zu verschwinden.
export function loadGmLayout() {
  const known = [...DEFAULT_GM_LAYOUT.left, ...DEFAULT_GM_LAYOUT.right];
  const stored = readJSON(KEY, null);
  if (!stored || !Array.isArray(stored.left) || !Array.isArray(stored.right)) {
    return { left: [...DEFAULT_GM_LAYOUT.left], right: [...DEFAULT_GM_LAYOUT.right] };
  }
  const left = stored.left.filter((id) => known.includes(id));
  const right = stored.right.filter((id) => known.includes(id));
  const placed = new Set([...left, ...right]);
  known.forEach((id) => {
    if (placed.has(id)) return;
    (DEFAULT_GM_LAYOUT.left.includes(id) ? left : right).push(id);
  });
  return { left, right };
}

export function saveGmLayout(layout) {
  writeJSON(KEY, layout);
}

export function resetGmLayout() {
  return { left: [...DEFAULT_GM_LAYOUT.left], right: [...DEFAULT_GM_LAYOUT.right] };
}
