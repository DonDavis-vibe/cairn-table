// Erholung nach Cairn 2e (Healing & Recovery):
//   short : ein paar Momente + ein Schluck Wasser -> TP voll zurueck.
//           Kann die Gruppe exponieren. Bandagen stabilisieren kritisch Verletzte.
//   night : volle Nachtruhe an einem sicheren Ort -> TP voll + alle Erschoepfung weg.
//   week  : eine Woche Rast, oft mit Heiler -> zusaetzlich verlorene Attribute
//           und der kritische Zustand zurueck.
//
// Ein deprivierter Charakter erholt NICHTS (weder TP noch Attribute noch Slots),
// bis die Entbehrung behoben ist.

import { ATTR_KEYS } from './character.js';
import { removeAllFatigue } from './inventory.js';

export const REST_KINDS = ['short', 'night', 'week'];

export function applyRest(character, kind) {
  if (character.deprived) {
    return { character, blocked: true, msg: { key: 'rest.log.deprived', vars: {} } };
  }

  if (kind === 'short') {
    return {
      character: { ...character, hp: { ...character.hp, current: character.hp.max } },
      msg: { key: 'rest.log.short', vars: {} },
    };
  }

  if (kind === 'night') {
    const rested = removeAllFatigue({ ...character, hp: { ...character.hp, current: character.hp.max } });
    return { character: rested, msg: { key: 'rest.log.night', vars: {} } };
  }

  // week
  let next = removeAllFatigue({ ...character, hp: { ...character.hp, current: character.hp.max } });
  next = { ...next, critical: false };
  for (const k of ATTR_KEYS) next[k] = { ...next[k], current: next[k].max };
  return { character: next, msg: { key: 'rest.log.week', vars: {} } };
}
