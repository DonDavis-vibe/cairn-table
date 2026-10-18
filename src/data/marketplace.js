// Transport und Mietlinge aus dem Cairn-2e-Marketplace (Player's Guide). Cairn
// von Yochai Gal, CC BY-SA 4.0 — die deutschen Namen sind eigene Uebersetzungen.
// Vorlagen fuer die Behaelter des Wardens (Maultier, Karren, Mietlinge).

const T = (de, en) => ({ de, en });

// slots = zusaetzliche Slots, die das Tier / Gefaehrt traegt (Marketplace: "+4 slots").
export const TRANSPORT = [
  { id: 'cart', name: T('Karren', 'Cart'), slots: 4, cost: 30, bulky: true },
  { id: 'wagon', name: T('Wagen', 'Wagon'), slots: 8, cost: 200, slow: true },
  { id: 'horse', name: T('Pferd', 'Horse'), slots: 4, cost: 75 },
  { id: 'mule', name: T('Maultier', 'Mule'), slots: 6, cost: 30, slow: true },
];

// perDay = Tagessatz in gp ("Hirelings (per day)"). Werte wuerfelt der Behaelter
// selbst aus (3W6 je Attribut, 1W6 TP — Core Rules -> Hirelings).
export const HIRELINGS = [
  { id: 'alchemist', name: T('Alchemist:in', 'Alchemist'), perDay: 30 },
  { id: 'animal-handler', name: T('Tierpfleger:in', 'Animal Handler'), perDay: 5 },
  { id: 'blacksmith', name: T('Schmied:in', 'Blacksmith'), perDay: 15 },
  { id: 'bodyguard', name: T('Leibwächter:in', 'Bodyguard'), perDay: 10 },
  { id: 'local-guide', name: T('Ortskundige:r Führer:in', 'Local Guide'), perDay: 5 },
  { id: 'lockpick', name: T('Schlossknacker:in', 'Lockpick'), perDay: 10 },
  { id: 'navigator', name: T('Navigator:in', 'Navigator'), perDay: 10 },
  { id: 'sailor', name: T('Matrose/Matrosin', 'Sailor'), perDay: 5 },
  { id: 'scholar', name: T('Gelehrte:r', 'Scholar'), perDay: 20 },
  { id: 'tracker', name: T('Fährtenleser:in', 'Tracker'), perDay: 5 },
  { id: 'trapper', name: T('Fallensteller:in', 'Trapper'), perDay: 5 },
  { id: 'veteran-bodyguard', name: T('Erfahrene:r Leibwächter:in', 'Veteran Bodyguard'), perDay: 20 },
];
