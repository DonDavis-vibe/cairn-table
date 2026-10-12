// Rationen und Lager (Cairn 2e, Wilderness Actions -> Make Camp):
//   Beim Lager verbraucht jede Figur (und jedes Reittier) eine Ration; wer
//   schlafen konnte, verliert alle Erschoepfung. Ohne Ration fehlt ein
//   lebenswichtiges Beduerfnis: Entbehrung, also keine Erholung.
//
// Nutzungspunkte zaehlen VERBRAUCHTE Punkte (usage.current); eine Ration hat 3 Nutzungen.

import { applyRest } from './rest.js';

const isRation = (it) => it?.type === 'ration' && it.usage;
const usesLeft = (it) => Math.max(0, it.usage.max - it.usage.current);

export function rationsLeft(character) {
  return Object.values(character.items || {}).filter(isRation).reduce((n, it) => n + usesLeft(it), 0);
}

// Eine Nutzung essen: zuerst aus der am weitesten angebrochenen Ration.
export function eatRation(character) {
  const candidates = Object.values(character.items || {}).filter((it) => isRation(it) && usesLeft(it) > 0);
  if (!candidates.length) return { ok: false, character };
  const it = candidates.reduce((best, cur) => (usesLeft(cur) < usesLeft(best) ? cur : best));
  const next = {
    ...character,
    items: { ...character.items, [it.itemId]: { ...it, usage: { ...it.usage, current: it.usage.current + 1 } } },
  };
  return { ok: true, character: next, left: rationsLeft(next) };
}

// Lager aufschlagen: Ration essen, dann Nachtruhe. Satt zu sein beendet die
// Entbehrung (das Lager deckt Essen und Schlaf ab); ohne Ration beginnt sie —
// die Nachtruhe bringt dann nichts (Entbehrung blockiert die Erholung).
export function makeCamp(character) {
  const meal = eatRation(character);
  if (!meal.ok) {
    return {
      character: { ...character, deprived: true },
      fed: false,
      msg: { key: 'camp.log.hungry', vars: {} },
    };
  }
  const rested = applyRest({ ...meal.character, deprived: false }, 'night');
  return {
    character: rested.character,
    fed: true,
    left: meal.left,
    msg: { key: 'camp.log.fed', vars: { left: meal.left } },
  };
}
