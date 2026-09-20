// Narbentabelle (Cairn 2e, Core Rules -> Scars). Index = beim Treffer verlorene HP
// (1-12). Ausgeloest nur, wenn HP EXAKT auf 0 fallen. Texte sind zusammengefasst.
// Cairn von Yochai Gal, CC BY-SA 4.0 — abgeleitete Texte ebenfalls CC BY-SA 4.0.

import { rollDie } from '../rules/dice.js';

export const SCARS = {
  1: {
    name: { de: 'Bleibende Narbe', en: 'Lasting Scar' },
    text: {
      de: '1W6: 1 Hals, 2 Hände, 3 Auge, 4 Brust, 5 Beine, 6 Ohr. Dann 1W6 — ist die Summe höher als deine max. TP, nimm den neuen Wert.',
      en: '1d6: 1 neck, 2 hands, 3 eye, 4 chest, 5 legs, 6 ear. Then 1d6 — if the total beats your max HP, take the new result.',
    },
  },
  2: {
    name: { de: 'Erschütternder Schlag', en: 'Rattling Blow' },
    text: {
      de: 'Benommen und erschüttert. Beschreibe, wie du dich neu sammelst. 1W6 — schlägt die Summe deine max. TP, nimm den neuen Wert.',
      en: 'Disoriented and shaken. Describe how you refocus. 1d6 — if it beats your max HP, take the new result.',
    },
  },
  3: {
    name: { de: 'Voll erwischt', en: 'Walloped' },
    text: {
      de: 'Du fliegst und landest auf dem Gesicht, ohne Luft. Entbehrung, bis du einige Stunden rastest. Dann 1W6 auf deine max. TP addieren.',
      en: 'Sent flying, land flat, winded. Deprived until you rest for a few hours. Then add 1d6 to your max HP.',
    },
  },
  4: {
    name: { de: 'Gebrochenes Glied', en: 'Broken Limb' },
    text: {
      de: '1W6: 1-2 Bein, 3-4 Arm, 5 Rippe, 6 Schädel. Nach dem Heilen 2W6 — schlägt die Summe deine max. TP, nimm den neuen Wert.',
      en: '1d6: 1-2 leg, 3-4 arm, 5 rib, 6 skull. Once mended, 2d6 — if it beats your max HP, take the new result.',
    },
  },
  5: {
    name: { de: 'Erkrankt', en: 'Diseased' },
    text: {
      de: 'Eine eklige, unangenehme Infektion. Wenn du sie überstehst, 2W6 — schlägt die Summe deine max. TP, nimm den neuen Wert.',
      en: 'A gross, uncomfortable infection. When you get over it, 2d6 — if it beats your max HP, take the new result.',
    },
  },
  6: {
    name: { de: 'Umorientierende Kopfwunde', en: 'Reorienting Head Wound' },
    text: {
      de: '1W6: 1-2 STÄ, 3-4 GES, 5-6 WIL. 3W6 — ist die Summe höher als dein aktueller Wert in diesem Attribut, nimm den neuen Wert.',
      en: '1d6: 1-2 STR, 3-4 DEX, 5-6 WIL. 3d6 — if higher than your current score in that attribute, take the new result.',
    },
  },
  7: {
    name: { de: 'Kniesehne durchtrennt', en: 'Hamstrung' },
    text: {
      de: 'Du kannst dich kaum bewegen, bis du ernsthafte Hilfe und Rast bekommst. Danach 3W6 — schlägt die Summe deine max. GES, nimm den neuen Wert.',
      en: 'You can barely move until serious help and rest. After recovery, 3d6 — if it beats your max DEX, take the new result.',
    },
  },
  8: {
    name: { de: 'Taub', en: 'Deafened' },
    text: {
      de: 'Du hörst nichts mehr, bis du außergewöhnliche Hilfe findest. WIL-Rettungswurf: bei Erfolg steigt deine max. WIL um 1W4.',
      en: 'You cannot hear until you find extraordinary aid. WIL save: on a pass, raise max WIL by 1d4.',
    },
  },
  9: {
    name: { de: 'Umgekrempelt', en: 'Re-brained' },
    text: {
      de: 'Ein verborgener Teil deiner Psyche wird losgerüttelt. 3W6 — schlägt die Summe deine max. WIL, nimm den neuen Wert.',
      en: 'Some hidden part of your psyche is knocked loose. 3d6 — if it beats your max WIL, take the new result.',
    },
  },
  10: {
    name: { de: 'Abgetrennt', en: 'Sundered' },
    text: {
      de: 'Ein Körperglied ist ab, verkrüppelt oder nutzlos (SL entscheidet welches). WIL-Rettungswurf: bei Erfolg steigt deine max. WIL um 1W6.',
      en: 'An appendage is torn off, crippled or useless (Warden decides). WIL save: on a pass, raise max WIL by 1d6.',
    },
  },
  11: {
    name: { de: 'Tödliche Wunde', en: 'Mortal Wound' },
    text: {
      de: 'Entbehrung und außer Gefecht. Du stirbst in einer Stunde ohne Heilung. Nach der Genesung 2W6 — das ist deine neue max. TP.',
      en: 'Deprived and out of action. You die in one hour unless healed. On recovery, 2d6 becomes your new max HP.',
    },
  },
  12: {
    name: { de: 'Verdammt', en: 'Doomed' },
    text: {
      de: 'Der Tod war zum Greifen nah. Misslingt dein nächster Rettungswurf gegen kritischen Schaden, stirbst du grauenhaft. Gelingt er: 3W6 — schlägt die Summe deine max. TP, nimm den neuen Wert.',
      en: 'Death was ever so close. If your next critical-damage save fails, you die horribly. If it passes, 3d6 — if it beats your max HP, take the new result.',
    },
  },
};

// hpLost -> Narbeneintrag (auf 1..12 begrenzt).
export function scarFor(hpLost) {
  const i = Math.max(1, Math.min(12, Math.round(hpLost)));
  return { index: i, ...SCARS[i] };
}

export { rollDie };
