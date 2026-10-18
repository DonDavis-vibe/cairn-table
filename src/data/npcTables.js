// Offizielle NSC-Tabellen (Cairn 2e, Warden's Guide -> NPC Tables): 60 Namen
// (3 x d20) sowie je eine d20-Tabelle fuer Auffaelligkeit, Beruf, Ziel, Tugend
// und Laster. Cairn von Yochai Gal, CC BY-SA 4.0 — die deutschen Texte sind
// eigene Uebersetzungen und stehen damit ebenfalls unter CC BY-SA 4.0.
//
// Namen bleiben unuebersetzt (wie die Namenslisten der Hintergruende).

const T = (de, en) => ({ de, en });

export const NPC_NAMES = [
  // d20 #1
  'Alaric', 'Carver', 'Cleaver', 'Darnel', 'Eoin', 'Evander', 'Glyph', 'Hemlock', 'Herald', 'Lisbeth',
  'Lucian', 'Luna', 'Lysander', 'Marius', 'Mend', 'Milo', 'Neria', 'Pan', 'Quill', 'Seraphine',
  // d20 #2
  'Ainsley', 'Azura', 'Brave', 'Callan', 'Cedric', 'Crow', 'Finch', 'Gunnar', 'Harper', 'Liora',
  'Lira', 'Lorelai', 'Lysandra', 'Marcellus', 'Shade', 'Shroud', 'Spade', 'Spike', 'Tanner', 'Thyme',
  // d20 #3
  'Alder', 'Alistair', 'Caius', 'Dain', 'Dax', 'Dorian', 'Godric', 'Harkin', 'Hildred', 'Kael',
  'Kavi', 'Mariner', 'Nazira', 'Onyx', 'Rolan', 'Rush', 'Sky', 'Storm', 'Taros', 'Thaddeus',
];

// "Quirk 1": koerperliche Auffaelligkeit.
export const NPC_QUIRKS = [
  T('Wachsam', 'Alert'), T('Kahlköpfig', 'Bald'), T('Strahlende Augen', 'Bright Eyes'), T('Breites Gesicht', 'Broad Face'),
  T('Schiefe Zähne', 'Crooked Teeth'), T('Ausgezehrt', 'Gaunt'), T('Gerade Haltung', 'Good Posture'), T('Schmuddelig', 'Grimy'),
  T('Harte Stimme', 'Harsh Voice'), T('Wulstige Brauen', 'Heavy Brow'), T('Hinkt', 'Limps'), T('Fehlendes Ohr', 'Missing Ear'),
  T('Muskulös', 'Muscular'), T('Auffälliges Haar', 'Notable Hair'), T('Angenehme Stimme', 'Pleasant Voice'), T('Kneift die Augen zusammen', 'Squints'),
  T('Kräftig', 'Strong'), T('Buschige Augenbrauen', 'Thick Eyebrows'), T('Müde', 'Tired'), T('Jung', 'Young'),
];

export const NPC_BACKGROUNDS = [
  T('Gelehrte:r', 'Academic'), T('Meuchelmörder:in', 'Assassin'), T('Schmied:in', 'Blacksmith'), T('Landwirt:in', 'Farmer'),
  T('General:in', 'General'), T('Totengräber:in', 'Gravedigger'), T('Wächter:in', 'Guard'), T('Heiler:in', 'Healer'),
  T('Kerkermeister:in', 'Jailer'), T('Arbeiter:in', 'Laborer'), T('Adlige:r', 'Lord'), T('Händler:in', 'Merchant'),
  T('Mönch/Nonne', 'Monk'), T('Mystiker:in', 'Mystic'), T('Auswärtige:r', 'Outlander'), T('Hausierer:in', 'Peddler'),
  T('Politiker:in', 'Politician'), T('Spion:in', 'Spy'), T('Dieb:in', 'Thief'), T('Schläger:in', 'Thug'),
];

export const NPC_GOALS = [
  T('Aufstieg', 'Ascension'), T('Läuterung', 'Cleansing'), T('Bewahrung', 'Conservation'), T('Verteidigung', 'Defense'),
  T('Herrschaft', 'Domination'), T('Bereicherung', 'Enrichment'), T('Ausdehnung', 'Expansion'), T('Freiheit', 'Freedom'),
  T('Heilung', 'Healing'), T('Eingliederung', 'Integration'), T('Gerechtigkeit', 'Justice'), T('Frieden', 'Peace'),
  T('Macht', 'Power'), T('Erhalt', 'Preservation'), T('Reinigung', 'Purification'), T('Erlösung', 'Redemption'),
  T('Rache', 'Revenge'), T('Überleben', 'Survival'), T('Einheit', 'Unity'), T('Reichtum', 'Wealth'),
];

export const NPC_VIRTUES = [
  T('Vorsichtig', 'Cautious'), T('Mitfühlend', 'Compassionate'), T('Gut vernetzt', 'Connected'), T('Mutig', 'Courageous'),
  T('Diszipliniert', 'Disciplined'), T('Diskret', 'Discreet'), T('Ehrlich', 'Honest'), T('Klug', 'Intelligent'),
  T('Besonnen', 'Judicious'), T('Loyal', 'Loyal'), T('Methodisch', 'Methodical'), T('Gewissenhaft', 'Meticulous'),
  T('Höflich', 'Polite'), T('Beliebt', 'Popular'), T('Pragmatisch', 'Pragmatic'), T('Einfallsreich', 'Resourceful'),
  T('Gewandt', 'Suave'), T('Scharfsinnig', 'Shrewd'), T('Zäh', 'Tenacious'), T('Schlagfertig', 'Witty'),
];

export const NPC_VICES = [
  T('Distanziert', 'Aloof'), T('Korrupt', 'Corrupt'), T('Feige', 'Craven'), T('Grausam', 'Cruel'),
  T('Zynisch', 'Cynical'), T('Betrügerisch', 'Deceptive'), T('Gierig', 'Greedy'), T('Impulsiv', 'Impulsive'),
  T('Unfähig', 'Incompetent'), T('Starr', 'Inflexible'), T('Manipulativ', 'Manipulative'), T('Launisch', 'Mercurial'),
  T('Naiv', 'Naive'), T('Pedantisch', 'Pedantic'), T('Skrupellos', 'Ruthless'), T('Sarkastisch', 'Sarcastic'),
  T('Selbstsüchtig', 'Selfish'), T('Stur', 'Stubborn'), T('Eitel', 'Vain'), T('Fremdenfeindlich', 'Xenophobic'),
];
