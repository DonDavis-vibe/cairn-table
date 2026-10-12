// Dungeon- und Wildnis-Ablauf (Cairn 2e Player's Guide, Procedures, S. 70-79)
// als reine Funktionen. Texte stehen in data/procedures.js, Wuerfe kommen aus dice.js.

import { rollDie } from './dice.js';

export const SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const WEATHER_KEYS = ['nice', 'fair', 'unpleasant', 'inclement', 'extreme', 'catastrophic'];

// Wettertabelle (W6 je Jahreszeit), S. 76.
const WEATHER_TABLE = {
  spring: ['nice', 'fair', 'fair', 'unpleasant', 'inclement', 'extreme'],
  summer: ['nice', 'nice', 'fair', 'unpleasant', 'inclement', 'extreme'],
  fall: ['fair', 'fair', 'unpleasant', 'inclement', 'inclement', 'extreme'],
  winter: ['fair', 'unpleasant', 'inclement', 'inclement', 'extreme', 'extreme'],
};

// Wettereffekt: Erschoepfung ('choice' = Erschoepfung ODER +1 Wache, 'forced' = beides),
// Gelaendestufe +1, nicht reisbar.
const WEATHER_EFFECT = {
  nice: { fatigue: 'none', terrainStep: 0 },
  fair: { fatigue: 'none', terrainStep: 0 },
  unpleasant: { fatigue: 'choice', terrainStep: 0 },
  inclement: { fatigue: 'choice', terrainStep: 1 },
  extreme: { fatigue: 'forced', terrainStep: 1 },
  catastrophic: { fatigue: 'none', terrainStep: 0, blocked: true },
};
export const weatherEffect = (key) => WEATHER_EFFECT[key] || WEATHER_EFFECT.fair;

// Wetter wuerfeln. Zweimal "extreme" in Folge wird "catastrophic" (S. 76).
export function rollWeather(season, previous = null) {
  const d = rollDie(6);
  let key = WEATHER_TABLE[season]?.[d - 1] || 'fair';
  if (key === 'extreme' && previous === 'extreme') key = 'catastrophic';
  return { d, key };
}

// Pfad (Strafe in Wachen, Verirr-Chance in x-in-6), S. 75.
export const PATHS = {
  road: { watches: 0, lost: 0 },
  trail: { watches: 1, lost: 2 },
  wilderness: { watches: 2, lost: 3 },
};
export const DISTANCES = { short: 1, medium: 2, long: 3 };
export const TERRAINS = ['easy', 'tough', 'perilous']; // Strafe = Index (0 / +1 / +2 Wachen)

// Reisedauer in Wachen. Wetter wirkt ueber Gelaendestufe, +1 Wache (bei "extreme"
// immer, bei "unpleasant"/"inclement" nach Wahl der Gruppe statt Erschoepfung).
// sleepDeprived: ohne Lager gereist -> Gelaendestufe +1. extra: weites Gelaende, 0-2.
export function travelPlan({
  path = 'trail', distance = 'short', terrain = 'easy', weather = 'fair',
  weatherCost = 'fatigue', sleepDeprived = false, extra = 0,
} = {}) {
  const eff = weatherEffect(weather);
  if (eff.blocked) return { blocked: true, watches: null, days: null, lost: PATHS[path]?.lost ?? 0 };
  const steps = Math.max(0, TERRAINS.indexOf(terrain)) + eff.terrainStep + (sleepDeprived ? 1 : 0);
  const terrainStep = Math.min(2, Math.max(0, steps));
  const weatherWatch = eff.fatigue === 'forced' || (eff.fatigue === 'choice' && weatherCost === 'watch') ? 1 : 0;
  const weatherFatigue = eff.fatigue === 'forced' || (eff.fatigue === 'choice' && weatherCost !== 'watch');
  const watches = (PATHS[path]?.watches ?? 0) + (DISTANCES[distance] ?? 0) + terrainStep + weatherWatch + Math.max(0, Math.min(2, extra));
  return {
    blocked: false,
    watches,
    days: watches / 3,
    terrain: TERRAINS[terrainStep],
    weatherFatigue,
    lost: PATHS[path]?.lost ?? 0,
  };
}

// Verirren: W6 <= x faellt auf "verirrt" (x-in-6). modifier verschiebt die Chance
// (Karten, Fuehrer, Heimatgelaende: negativ).
export function rollLost(lostIn6, modifier = 0) {
  const odds = Math.max(0, Math.min(6, lostIn6 + modifier));
  const d = rollDie(6);
  return { d, odds, lost: odds > 0 && d <= odds };
}

// Nahrungssuche (Supply): 1W4 Rationen (je 3 Nutzungen); jeder weitere Beteiligte
// und passende Erfahrung heben den Wuerfel eine Stufe (W4 -> W6 ... max. W12).
const SUPPLY_DICE = [4, 6, 8, 10, 12];
export function rollSupply(participants = 1, bonusSteps = 0) {
  const idx = Math.min(SUPPLY_DICE.length - 1, Math.max(0, Math.max(1, participants) - 1 + bonusSteps));
  const sides = SUPPLY_DICE[idx];
  return { sides, rations: rollDie(sides) };
}

// Ereignisse (W6). Index 1-6 -> Schluessel in data/procedures.js.
export const rollEvent = () => rollDie(6);

// Wachen: Morgen, Nachmittag, Nacht; danach beginnt der naechste Tag.
export const WATCHES = ['morning', 'afternoon', 'night'];
export function advanceWatch({ day, watch }) {
  if (watch >= WATCHES.length - 1) return { day: day + 1, watch: 0 };
  return { day, watch: watch + 1 };
}
