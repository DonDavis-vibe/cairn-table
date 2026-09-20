// Charaktermerkmale (Cairn 2e, Character Creation -> Character Traits, je 1W10)
// und Namen. Cairn von Yochai Gal, CC BY-SA 4.0.

import { loc } from '../i18n/index.jsx';

export const TRAIT_TABLES = {
  physique: {
    label: { de: 'Statur', en: 'Physique' },
    options: [
      { de: 'Athletisch', en: 'Athletic' }, { de: 'Kraeftig', en: 'Brawny' }, { de: 'Schwabbelig', en: 'Flabby' },
      { de: 'Hager', en: 'Lanky' }, { de: 'Wettergegerbt', en: 'Rugged' }, { de: 'Duerr', en: 'Scrawny' },
      { de: 'Klein', en: 'Short' }, { de: 'Stattlich', en: 'Statuesque' }, { de: 'Stämmig', en: 'Stout' }, { de: 'Hochgewachsen', en: 'Towering' },
    ],
  },
  skin: {
    label: { de: 'Haut', en: 'Skin' },
    options: [
      { de: 'Muttermal', en: 'Birthmarked' }, { de: 'Vernäht', en: 'Marked' }, { de: 'Ölig', en: 'Oily' },
      { de: 'Rosig', en: 'Rosy' }, { de: 'Vernarbt', en: 'Scarred' }, { de: 'Weich', en: 'Soft' },
      { de: 'Gebräunt', en: 'Tanned' }, { de: 'Tätowiert', en: 'Tattooed' }, { de: 'Verwittert', en: 'Weathered' }, { de: 'Schwimmhäute', en: 'Webbed' },
    ],
  },
  hair: {
    label: { de: 'Haar', en: 'Hair' },
    options: [
      { de: 'Kahl', en: 'Bald' }, { de: 'Geflochten', en: 'Braided' }, { de: 'Lockig', en: 'Curly' },
      { de: 'Dreckig', en: 'Filthy' }, { de: 'Kraus', en: 'Frizzy' }, { de: 'Lang', en: 'Long' },
      { de: 'Üppig', en: 'Luxurious' }, { de: 'Ölig', en: 'Oily' }, { de: 'Wellig', en: 'Wavy' }, { de: 'Dünn', en: 'Wispy' },
    ],
  },
  face: {
    label: { de: 'Gesicht', en: 'Face' },
    options: [
      { de: 'Knochig', en: 'Bony' }, { de: 'Gebrochen', en: 'Broken' }, { de: 'Markant', en: 'Chiseled' },
      { de: 'Länglich', en: 'Elongated' }, { de: 'Blass', en: 'Pale' }, { de: 'Makellos', en: 'Perfect' },
      { de: 'Verwegen', en: 'Rakish' }, { de: 'Scharf', en: 'Sharp' }, { de: 'Kantig', en: 'Square' }, { de: 'Eingefallen', en: 'Sunken' },
    ],
  },
  speech: {
    label: { de: 'Sprechweise', en: 'Speech' },
    options: [
      { de: 'Schroff', en: 'Blunt' }, { de: 'Dröhnend', en: 'Booming' }, { de: 'Kryptisch', en: 'Cryptic' },
      { de: 'Monoton', en: 'Droning' }, { de: 'Förmlich', en: 'Formal' }, { de: 'Rau', en: 'Gravelly' },
      { de: 'Präzise', en: 'Precise' }, { de: 'Quäkend', en: 'Squeaky' }, { de: 'Stotternd', en: 'Stuttering' }, { de: 'Flüsternd', en: 'Whispery' },
    ],
  },
  clothing: {
    label: { de: 'Kleidung', en: 'Clothing' },
    options: [
      { de: 'Antik', en: 'Antique' }, { de: 'Blutig', en: 'Bloody' }, { de: 'Elegant', en: 'Elegant' },
      { de: 'Verdreckt', en: 'Filthy' }, { de: 'Fremdländisch', en: 'Foreign' }, { de: 'Ausgefranst', en: 'Frayed' },
      { de: 'Bieder', en: 'Frumpy' }, { de: 'Livree', en: 'Livery' }, { de: 'Ranzig', en: 'Rancid' }, { de: 'Beschmutzt', en: 'Soiled' },
    ],
  },
  virtue: {
    label: { de: 'Tugend', en: 'Virtue' },
    options: [
      { de: 'Ehrgeizig', en: 'Ambitious' }, { de: 'Vorsichtig', en: 'Cautious' }, { de: 'Mutig', en: 'Courageous' },
      { de: 'Diszipliniert', en: 'Disciplined' }, { de: 'Gesellig', en: 'Gregarious' }, { de: 'Ehrenhaft', en: 'Honorable' },
      { de: 'Bescheiden', en: 'Humble' }, { de: 'Barmherzig', en: 'Merciful' }, { de: 'Gelassen', en: 'Serene' }, { de: 'Tolerant', en: 'Tolerant' },
    ],
  },
  vice: {
    label: { de: 'Laster', en: 'Vice' },
    options: [
      { de: 'Aggressiv', en: 'Aggressive' }, { de: 'Verbittert', en: 'Bitter' }, { de: 'Feige', en: 'Craven' },
      { de: 'Hinterlistig', en: 'Deceitful' }, { de: 'Gierig', en: 'Greedy' }, { de: 'Faul', en: 'Lazy' },
      { de: 'Nervös', en: 'Nervous' }, { de: 'Unhöflich', en: 'Rude' }, { de: 'Eitel', en: 'Vain' }, { de: 'Rachsüchtig', en: 'Vengeful' },
    ],
  },
};

export const TRAIT_KEYS = Object.keys(TRAIT_TABLES);

// Kurzprofil aus den ausgefuellten Merkmalsfeldern eines Bogens — leere
// Felder werden uebersprungen, kein Rate-Text bei einem frischen Bogen.
export function traitSummary(traits, lang) {
  return TRAIT_KEYS
    .map((k) => {
      const v = (traits?.[k] || '').trim();
      return v ? `${loc(TRAIT_TABLES[k].label, lang)}: ${v}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

// Namen aus den 2e-Hintergruenden zusammengetragen.
export const NAMES = [
  'Arlo', 'Lyra', 'Eamon', 'Salina', 'Elara', 'Freya', 'Bull', 'Sparrow', 'Ivy', 'Silas',
  'Hendel', 'Mabli', 'Tomas', 'Yorsha', 'Wregan', 'Perrin', 'Cwen', 'Odo', 'Brenna', 'Kael',
];

// Bande (W20) — Cairn 2e Character Creation. Zusammengefasst.
export const BONDS = [
  { de: 'Ein Einzel-Edelstein (500 gp, kalt und spröde) von einem toten Verwandten. Verschwendest du den Reichtum, wird eine alte Schuld eingefordert.', en: 'A single gem (500gp, cold and brittle) from a dead relative. Squander it, and a long-forgotten debt is called in.' },
  { de: '20 gp und ein seltsamer Kompass (petty), der stets auf etwas tief im Wald zeigt.', en: '20gp and a strange compass (petty) that always points to something deep in the Wood.' },
  { de: 'Ein Medaillon (petty) mit dem Bild einer verlorenen Liebe, die im Wald verschwand. Du weißt: sie lebt noch.', en: 'A locket portrait (petty) of a lost love who vanished into the Wood. Somehow you know they still live.' },
  { de: 'Ein winziges Kristallprisma (petty). Ins Licht gehalten zeigt es einen unbekannten Ort tief im Wald.', en: 'A tiny crystal prism (petty). Held to the light it shows an unknown place deep in the Wood.' },
  { de: 'Silbermoos (petty) von einer befreiten Najade. Bei Wasser geschluckt kommt sie einmal, um ihre Schuld zu begleichen.', en: 'Silver moss (petty) from a freed naiad. Swallow it near water and it comes, once, to repay its debt.' },
  { de: 'Ein altes Tagebuch aus Rinde. Jeden Abend füllen sich die Seiten mit den Ereignissen des Tages — grob, aber genau.', en: 'An old journal bound in bark. Each evening its pages fill with the day\'s events — crude but accurate.' },
  { de: 'Die eine Hälfte eines uralten Schlüssels (petty). Mit seinem Zwilling vereint öffnet er ein Tor durch jede Tür.', en: 'One half of an ancient key (petty). Joined with its twin, it opens a Gate through any door.' },
  { de: 'Ein Brief (petty) mit Beweis, dass deine wahren Eltern Feenadel sind — samt Datum und Ort eines Treffens tief im Wald.', en: 'A letter (petty) proving your true parentage is Fae nobility — with a date and place to meet, deep in the Wood.' },
  { de: 'Der Siegelring (petty) eines Adligen, dem du eine große Schuld schuldest. Beweis seines Schutzes und deiner Pflicht.', en: 'A noble\'s signet ring (petty). Proof of their protection and of your obligation.' },
  { de: 'Ein mutwilliger Geist in deinen Eingeweiden will heim, tief in den Wald. Belegt einen Slot, schluckt aber täglich eine Erschöpfung.', en: 'A mischievous spirit in your guts wants to go home, deep in the Wood. Takes a slot but absorbs one Fatigue each day.' },
  { de: 'Eine zusammengerollte Karte (petty) mit einem X — von einem umherziehenden Geschichtenerzähler.', en: 'A rolled-up map (petty) marked with an X, from a roaming storyteller.' },
  { de: 'Ein mit Baumharz versiegelter Brief (petty) eines sterbenden Jägers, adressiert nur an den Herrn des Winters.', en: 'A letter (petty) sealed with tree sap from a dying hunter, addressed only to the Lord of Winter.' },
  { de: 'Du siehst überall ein verwundetes Tier, das du einst ignoriert hast — nur wenn du allein bist. Du kannst allein handelnd nicht in Panik geraten.', en: 'You see a wounded beast you once ignored, but only when alone. You cannot become panicked while acting alone.' },
  { de: 'Ein Armband (petty) aus Bindfaden und Wildblumen — ein Versprechen an eine:n Kindheitsfreund:in, ein einzigartiges Geschenk mitzubringen.', en: 'A bracelet (petty) of twine and wildflowers — a promise to a childhood friend to bring back something unique.' },
  { de: 'Ein Steinherz-Fluch: mit jedem Monat wird der Stein um einen Slot schwerer. Bis die Schuld getilgt ist, kannst du nicht wahrhaft sterben.', en: 'A Stone Heart curse: each month the stone grows heavier by one slot. Until the debt is lifted, you cannot truly die.' },
  { de: 'Eine Pfeife (petty), geschnitzt aus dem Ast eines Eichenfürsten. Du wirst sie nicht los.', en: 'A whistle (petty) carved from an Oak Lord\'s branch. You cannot rid yourself of it.' },
  { de: 'Eine getrocknete blutrote Blume (petty) der Morgenbrigade. Wird sie weiß, ist der Gefallen fällig.', en: 'A dried blood-red flower (petty) from the Dawn Brigade. When it turns white, the favor is owed.' },
  { de: 'Eine Miniaturlaute eines Unterhalters, der eines Tages spurlos ging. Etwas klappert darin.', en: 'A miniature lute left by an entertainer who vanished without a word. Something rattles inside.' },
  { de: 'Ein Zweig (petty), den du nach einem Traum von einer weißen Krähe in der Hand hieltst. Er bringt Glück und riecht schwach nach Schwefel.', en: 'A twig (petty) you woke holding after dreaming of a white crow. You think it brings luck; it smells of sulfur.' },
  { de: 'Ein Vorfahr kränkte eine Mooshexe. Dein Anblick lässt Spiegel zerspringen — die Scherben enthüllen manchmal Illusionen.', en: 'An ancestor wronged a Moss Witch. Your visage shatters mirrors — the shards sometimes reveal illusions.' },
];

// Omen (W20) — Cairn 2e. Zusammengefasst; laut vorlesen.
export const OMENS = [
  { de: 'Das reiche Wasser eines lebensspendenden Flusses ist schwarz und faulig geworden und vergiftet das Land.', en: 'The rich waters of a life-giving river have turned black and putrid, tainting the land.' },
  { de: 'Der Winter kam zu früh. Im Reif an Fenstern und Pfützen erkennt man ein Muster — fast wie eine Karte.', en: 'Winter came too early. In the frost on windows and ponds there seems to be a pattern, almost a map.' },
  { de: 'Dichter, unnatürlicher Nebel dringt in einen uralten heiligen Hain — angeblich das Werk eines erzürnten Waldgeists.', en: 'An unnatural fog encroaches on an ancient holy grove — said to be the work of an angry forest spirit.' },
  { de: 'Der Nachthimmel wird jeden Abend dunkler, als verschwänden die Sterne. Höllenwesen sollen Bauern in die Wurzeln ziehen.', en: 'The night sky dims each evening, as if stars vanish one by one. Hellish creatures are said to pull farmers into the Roots.' },
  { de: 'Die Singvögel des Waldes sind verstummt. Jäger berichten von einer geisterhaften Gestalt, die jeden sehnsüchtig anblickt.', en: 'The songbirds of the Wood have fallen silent. Hunters speak of a spectral figure gazing longingly at all it meets.' },
  { de: 'Tränenförmige Steine tauchen überall auf — ein Goldrausch für Juweliere und Diebe. Die Tränen der Erde, sagen die Alten.', en: 'Tear-shaped stones appear everywhere — a gold rush for jewelers and thieves. The tears of the earth, locals say.' },
  { de: 'Schwärmende Schädlinge nagen an den Rändern der Träume; aus dem Wald dringt ein Summen, das näher kommt.', en: 'Swarming pests gnaw at the edges of dreams; a buzzing sound from deep in the Wood is getting closer.' },
  { de: 'Der berühmte „Mutterbaum" eines Dorfes hat begonnen, roten Saft zu bluten.', en: 'A village famed for its "mother tree" watches it begin to bleed red sap.' },
  { de: 'Der Mond färbt sich tiefrot. Manche sagen, es künde eine Zeit des Chaos, da die Grenzen zum Wald dünn werden.', en: 'The moon turns deep crimson. Some say it heralds chaos as the boundaries with the Wood grow thin.' },
  { de: 'Seltsame Risse erscheinen im Nachthimmel und geben einen wirbelnden Strudel aus Licht und Farbe frei.', en: 'Strange cracks appear in the night sky, revealing a swirling vortex of light and color.' },
  { de: 'Eine totgeglaubte, nachts blühende Blume sprießt im ganzen Wald. Ihr Duft berauscht — und verursacht lebhafte Alpträume.', en: 'A night-blooming flower thought extinct is sprouting throughout the Wood. Its scent intoxicates — and causes vivid nightmares.' },
  { de: 'Das Vieh ist zunehmend unruhig. Ein alter Schäfer nennt ein Heulen als Ursache, das bei Vollmond aus dem Wald dringt.', en: 'Livestock grow agitated. An old shepherd blames a howl that comes from the Wood each full moon.' },
  { de: 'Insektenschwärme fliehen aus dem Wald und zerstören jedes Holzbauwerk. Ihr Flügelschlag summt eine vertraute Melodie.', en: 'Swarms of insects flee the Wood, destroying every wooden structure. Their wings hum a familiar tune.' },
  { de: 'Ein Fluch trifft jeden, der ein Tier mit weißem Fellstreif tötet: bald darauf findet man ihn tot im eigenen Heim.', en: 'A curse befalls any who kill a beast with a white streak of fur: soon after, they are found dead at home.' },
  { de: 'Aus Brunnen der ganzen Stadt hört man leises Lachen, das nachts zu Schluchzen wird.', en: 'A faint laughter echoes from wells all over the city, turning to sobs at night.' },
  { de: 'Die Sternbilder verschieben sich langsam zu unbekannten Mustern. Selbst die Tiere wirken verstört.', en: 'The constellations slowly shift into unfamiliar patterns. Even the animals seem disturbed.' },
  { de: 'Ein alter Baum im Herzen eines verschlafenen Dorfes ist plötzlich verdorrt. In seinem Stamm fand man eine blutige Hand.', en: 'An ancient tree at the heart of a sleepy village has withered. In its trunk was found a bloody hand.' },
  { de: 'Statuen weinen seit Monaten Blut, und die Frauen des Dorfes bleiben unfruchtbar — bis auf ein einziges verborgenes Kind.', en: 'Statues have wept blood for months, and the village\'s wombs lie barren — save for one hidden child.' },
  { de: 'Die Fauna verhält sich seltsam: gesteigerte Aggression oder Flucht. Jäger sprechen von einer Schattengestalt, die die Tiere ruft.', en: 'The local fauna behaves oddly — heightened aggression or flight. Hunters speak of a shadowy figure calling to the animals.' },
  { de: 'Grenzstädte sind in Aufruhr: eine rotgewandete Gestalt erscheint den Kindern im Traum mit derselben Warnung — ein Feuer kommt, das alles verzehrt.', en: 'Border towns are in uproar: a red-robed figure appears in children\'s dreams with the same warning — a fire is coming, and it will consume everything.' },
];

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollD20() {
  return 1 + Math.floor(Math.random() * 20);
}

export function rollTrait(key) {
  const table = TRAIT_TABLES[key];
  const i = Math.floor(Math.random() * table.options.length);
  return { index: i, value: table.options[i] };
}

export function rollAge() {
  return 10 + (1 + Math.floor(Math.random() * 20)) + (1 + Math.floor(Math.random() * 20));
}
