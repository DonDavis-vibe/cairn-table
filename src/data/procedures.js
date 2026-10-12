// Tabellen und Beschriftungen fuer den Dungeon-/Wildnis-Ablauf (Cairn 2e Player's
// Guide, Procedures). Cairn von Yochai Gal, CC BY-SA 4.0 — Texte zusammengefasst.

export const DUNGEON_EVENTS = [
  { key: 'encounter', name: { de: 'Begegnung', en: 'Encounter' }, text: { de: 'Auf einer Begegnungstabelle würfeln. Möglicherweise feindlich — Reaktionswurf.', en: 'Roll on an encounter table. Possibly hostile — roll Reactions.' } },
  { key: 'sign', name: { de: 'Hinweis', en: 'Sign' }, text: { de: 'Ein Hinweis, eine Spur, ein verlassener Unterschlupf, ein Geruch, ein Opfer o. Ä. wird entdeckt.', en: 'A clue, spoor, track, abandoned lair, scent, victim, etc. is discovered.' } },
  { key: 'environment', name: { de: 'Umgebung', en: 'Environment' }, text: { de: 'Die Umgebung verändert oder verschärft sich: Wasser steigt, Decken stürzen ein, ein Ritual naht seiner Vollendung.', en: 'Surroundings shift or escalate: water rises, ceilings collapse, a ritual nears completion.' } },
  { key: 'loss', name: { de: 'Verlust', en: 'Loss' }, text: { de: 'Fackeln erlöschen, ein laufender Zauber verpufft usw. Die Gruppe muss die Folgen klären, bevor sie weiterzieht.', en: 'Torches are blown out, an ongoing spell fizzles, etc. The party must resolve the effects before moving on.' } },
  { key: 'exhaustion', name: { de: 'Erschöpfung', en: 'Exhaustion' }, text: { de: 'Die Gruppe muss kurz rasten (erneut würfeln), erhält 1 Erschöpfung oder verbraucht eine Ration.', en: 'The party must take a brief rest (roll again), add a Fatigue, or consume a ration.' } },
  { key: 'quiet', name: { de: 'Ruhe', en: 'Quiet' }, text: { de: 'Die Gruppe bleibt vorerst allein (und sicher).', en: 'The party is left alone (and safe) for the time being.' } },
];

export const WILDERNESS_EVENTS = [
  { key: 'encounter', name: { de: 'Begegnung', en: 'Encounter' }, text: { de: 'Auf der Begegnungstabelle für dieses Gelände würfeln. Reaktionswurf nicht vergessen.', en: 'Roll on the encounter table for this terrain. Don’t forget NPC reactions.' } },
  { key: 'sign', name: { de: 'Hinweis', en: 'Sign' }, text: { de: 'Die Gruppe entdeckt einen Hinweis, eine Spur oder ein Zeichen auf eine nahe Begegnung, einen Ort, ein verborgenes Merkmal oder die Umgebung.', en: 'The party discovers a clue, spoor, or sign of a nearby encounter, locality, hidden feature, or information about the area.' } },
  { key: 'environment', name: { de: 'Umgebung', en: 'Environment' }, text: { de: 'Ein Wetter- oder Geländewechsel.', en: 'A shift in weather or terrain.' } },
  { key: 'loss', name: { de: 'Verlust', en: 'Loss' }, text: { de: 'Die Gruppe steht vor einer Wahl, die eine Ressource (Rationen, Werkzeug usw.), Zeit oder Mühe kostet.', en: 'A choice that costs a resource (rations, tools, etc.), time, or effort.' } },
  { key: 'exhaustion', name: { de: 'Erschöpfung', en: 'Exhaustion' }, text: { de: 'Ein Hindernis erzwingt Mühe, Vorsicht oder Verzögerung: zusätzliche Zeit (und eine weitere Wildnis-Aktion) oder Erschöpfung.', en: 'A barrier forces effort, care, or delays: extra time (and another Wilderness Action) or Fatigue.' } },
  { key: 'discovery', name: { de: 'Entdeckung', en: 'Discovery' }, text: { de: 'Die Gruppe findet Nahrung, Schätze oder andere nützliche Ressourcen. Alternativ das Hauptmerkmal des Gebiets enthüllen.', en: 'The party finds food, treasure, or other useful resources. Or reveal the area’s primary feature.' } },
];
