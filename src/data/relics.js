// Reliquiar aus dem Cairn-2e Warden's Guide. Cairn von Yochai Gal, CC BY-SA 4.0.
// Relikte verursachen keine Erschöpfung. Sie haben begrenzte Nutzungen/Ladungen
// und meist eine Aufladebedingung. Texte sind zusammengefasst.
//
//   uses / charges : Anzahl (Nutzungspunkte)
//   recharge       : Aufladebedingung (nur bei charges)
//   size           : 0 petty · 1 · 2 bulky   ·   damage / armor optional

const R = (id, de, en, o) => ({ id, name: { de, en }, ...o });
const E = (de, en) => ({ de, en });

export const RELICS = [
  R('blade_hope', 'Eine Klinge namens Hoffnung', 'A Blade Called Hope', {
    size: 1, damage: 'd6',
    effect: E('Dünnes, gekrümmtes Schwert mit schwachem Licht. In praller Sonne gebadet ist der erste Angriff verstärkt.', 'A thin curved sword that glows faintly. Bathed in heavy sunlight, its first attack is Enhanced.'),
  }),
  R('assassin_goblets', 'Meuchlerkelche', "Assassin's Goblets", {
    effect: E('Ein Paar zerbrechlicher Weinflöten. Jede eingegossene Flüssigkeit wird mit der anderen getauscht.', 'A pair of fragile wine flutes. Any liquid poured into one is swapped with the other.'),
  }),
  R('babbleflask', 'Plapperflasche', 'Babbleflask', {
    uses: 2,
    effect: E('Eine fremde Sprache wird verstanden und fließend gesprochen, solange die eigene weder gesprochen noch gehört wird.', 'A foreign language is understood and spoken fluently, so long as your native tongue is neither spoken nor heard.'),
  }),
  R('barbed_epaulets', 'Widerhaken-Epauletten', 'Barbed Epaulets', {
    armor: 1,
    effect: E('Bestachelte Schulterstücke, die jeden vergiften, der sie berührt (STÄ-RW oder bewusstlos). +1 Rüstung.', 'Spiked shoulder pads that poison anyone who touches them (STR save or lose consciousness). +1 Armor.'),
  }),
  R('betterwand', 'Besserstab', 'Betterwand', {
    charges: 2, recharge: E('Willige in ein schlechtes Geschäft ein, während du den Stab besitzt.', 'Willingly accept a poor deal or trade while holding the wand.'),
    effect: E('Vibriert stärker, wenn er auf das beste einer Reihe von Gegenständen zeigt.', 'Vibrates more intensely when pointed at the best of a series of objects.'),
  }),
  R('bloodmap', 'Blutkarte', 'Bloodmap', {
    charges: 1, recharge: E('Gieß ein Pint eigenes Lebensblut auf die Karte. Du bist depriviert, bis du rastest und eine Ration isst.', 'Pour a pint of your own life essence onto the map. You are deprived until you rest and eat a ration.'),
    effect: E('Leeres Lederpergament: Auf ihm vergossenes Blut wird aufgesogen; entrollt zeigt es kurz den Standort allen verbliebenen Bluts.', 'Blank parchment: spilled blood is absorbed; unrolled, briefly shows the location of any remaining blood.'),
  }),
  R('coin_father', 'Münze des Vaters', 'Coin of the Father', {
    charges: 1, size: 0, recharge: E('Trage die Münze drei Tage, ohne Geld auszugeben oder zu verdienen.', 'Carry the coin for three days without spending or earning any money.'),
    effect: E('In die Luft geworfen wird sie zu 1W100 Goldmünzen. Die Trugmünzen verschwinden nach einer Stunde.', 'Flipped into the air, it becomes d100 gold coins. The illusory coins vanish after one hour.'),
  }),
  R('dryads_tear', 'Träne der Dryade', "Dryad's Tear", {
    uses: 1,
    effect: E('Zerschmettere den Kristall, um mit einem berührten Baum zu verschmelzen und das Geschehen in seinem Wald wahrzunehmen.', 'Shatter the crystal to merge with a tree you touch and perceive the goings-on within its forest.'),
  }),
  R('empathy_rod', 'Empathiestab', 'Empathy Rod', {
    charges: 3, recharge: E('Schenke den Stab einem früheren Feind. Einbahnstraße.', 'Give the rod to a former enemy as a gift. One-way only.'),
    effect: E('Berühren zwei Kreaturen den Holzstab gleichzeitig, verschmelzen ihre körperlichen und seelischen Zustände, bis sie loslassen.', 'When two creatures touch the pole at once, their physical and emotional states intertwine until they let go.'),
  }),
  R('eyestone', 'Augenstein', 'Eyestone', {
    charges: 3, recharge: E('Lege ihn über Nacht in einen Eimer Regenwasser.', 'Place in a bucket of rainwater overnight.'),
    effect: E('Wähle einen von Lebewesen geschaffenen Gegenstand; du spürst das nächste Exemplar.', 'Choose an object made by living creatures. You can sense the nearest example.'),
  }),
  R('falconstone', 'Falkenstein', 'Falconstone', {
    charges: 3, recharge: E('Töte und iss eine gewöhnliche Beute; gare das Fleisch mit dem Stein.', 'Kill and eat a common quarry, cooking the meat alongside the stone.'),
    effect: E('Nimm die Welt durch Augen und Ohren eines nahen Greifvogels wahr. Du fühlst, was er fühlt, steuerst ihn aber nicht.', "Perceive the world through a nearby bird of prey's eyes and ears. No control over it."),
  }),
  R('footpads_friend', 'Freund des Schleichers', "Footpad's Friend", {
    effect: E('Weiche Lederschuhe, die jede Fußgröße annehmen. Ihre Abdrücke zerstreuen sich und wenden verwirrend — Verfolgung ist fast unmöglich.', 'Soft shoes that fit any foot. Their prints scatter and turn confusingly, making tracking nigh-impossible.'),
  }),
  R('gate_chalk', 'Torkreide', 'Gate Chalk', {
    uses: 1, size: 0,
    effect: E('Zeichne eine Tür auf jede flache Fläche, um einen Einbahn-Durchgang zu den Wurzeln zu öffnen. Viel Glück.', 'Draw a doorway on any flat surface to open a one-way passage to the Roots. Good luck.'),
  }),
  R('golden_wheat_paste', 'Goldweizen-Paste', 'Golden Wheat Paste', {
    uses: 2,
    effect: E('Mit Wasser gemischt verbindet dieser Stoff zwei beliebige Gegenstände chemisch.', 'Mixed with water, this substance chemically bonds any two objects.'),
  }),
  R('gossip_box', 'Klatschdose', 'Gossip Box', {
    charges: 1, recharge: E('Verbreite in Gegenwart der Dose erfolgreich eine Lüge.', 'Successfully spread one falsehood in the presence of the box.'),
    effect: E('Kurbeln lässt jedes Geräusch des letzten Tages an deinem Ort wieder erklingen — pro Kurbel eine Stunde zurück.', 'Wind the crank to replay any sound made in the past day here. Each crank goes back one hour.'),
  }),
  R('harbingers_bell', 'Vorbotenglocke', "Harbinger's Bell", {
    charges: 1, recharge: E('Einschmelzen und neu schmieden. Jedes Mal 1W6: Bei 1-2 zerbricht sie für immer.', 'Melt and reforge. Each time roll d6; on 1-2 it breaks forever.'),
    effect: E('Auf Brusthöhe gehängt läutet sie, wenn Gefahr unmittelbar bevorsteht.', 'Hang at chest height to ring when danger is imminent.'),
  }),
  R('homunculus_nail', 'Homunkulus-Nagel', 'Homunculus Nail', {
    uses: 1, size: 0,
    effect: E('Steche einen Finger und hämmere ihn in einen kleinen Gegenstand: ein treuer Diener entsteht (3 TP, 4 STÄ, 13 GES, 5 WIL).', 'Prick a finger and hammer into a small object to form a loyal servant (3 HP, 4 STR, 13 DEX, 5 WIL).'),
  }),
  R('honest_earworm', 'Ehrlicher Ohrwurm', 'Honest Earworm', {
    uses: 1,
    effect: E('Ein übel riechender Wurm, der einer schlafenden Person ins Ohr kriecht. Das Opfer kann 1W4 Stunden nicht lügen.', 'A foul-smelling worm that crawls into a sleeper\'s ear. The victim cannot lie for 1d4 hours.'),
  }),
  R('jar_of_ants', 'Ameisenglas', 'Jar of Ants', {
    effect: E('Zerbrich es, um eine Kolonie Feuerameisen freizulassen (6 TP, 2 STÄ, W10 Biss, Abteilung). Frisst alle zwei Tage eine Ration.', 'Break to release a colony of fire ants (6 HP, 2 STR, bite d10, detachment). Consumes a ration every two days.'),
  }),
  R('last_breath', 'Letzter Atem', 'Last Breath', {
    size: 1, damage: 'd6', charges: 1, recharge: E('Führe mit dem Schwert einen Todesstoß aus und absorbiere die Seele des Sterbenden in die Klinge.', "Deliver a killing blow with the sword, absorbing the dying victim's soul into the blade."),
    effect: E('Ein schartiges Kurzschwert. In die Erde gerammt bildet es eine unzerstörbare Kristallkuppel um den Träger, bis das Schwert wieder gehoben wird.', 'A chipped short sword. Driven into the earth, forms an impenetrable crystal dome around the wielder until lifted.'),
  }),
  R('lightsucker_candle', 'Lichtschluck-Kerze', 'Lightsucker Candle', {
    uses: 3,
    effect: E('Angezündet spendet dieses schwarze Talg Dunkelheit statt Licht, selbst am hellsten Tag.', 'Once lit, this black tallow wax sheds darkness rather than light, even in bright day.'),
  }),
  R('lovers_covenant', 'Liebesbund', "Lover's Covenant", {
    uses: 1,
    effect: E('Rotgetönte Tinte. Schreibe einen Vertrag beliebiger Länge; wer unterschreibt, ist bei Todesstrafe zur Einhaltung gebunden.', 'Red-tinted ink. Write a contract of any length; any who sign are bound to obey by penalty of death.'),
  }),
  R('mace_kingslayer', 'Streitkolben des Königsmörders', 'Mace of the Kingslayer', {
    size: 1, damage: 'd8', charges: 2, recharge: E('Versetze dem Anführer einer Gruppe oder Fraktion einen tödlichen Schlag.', 'Deliver a fatal blow to the leader of a group or faction.'),
    effect: E('Halte die Waffe empor und rufe einen Befehl. Wer den WIL-RW nicht schafft, muss gehorchen.', 'Hold the weapon aloft and shout an order. Any who fail a WIL save must obey.'),
  }),
  R('moth_mirror', 'Mottenspiegel', 'Moth Mirror', {
    size: 2,
    effect: E('Ein beidseitiger Standspiegel. Tritt hinein, um zu einem anderen bekannten Spiegel zu reisen — als Mottenschwarm, der Umstehende lähmt (WIL-RW).', 'A double-sided mirror. Step in to travel to another mirror you know, emerging as a moth swarm that paralyzes onlookers (WIL save).'),
  }),
  R('muffle_dust', 'Dämpfstaub', 'Muffle Dust', {
    uses: 2,
    effect: E('Ein Beutel feinen Staubs, der verstreut allen Schall in 12 m Radius dämpft.', 'A pouch of fine dust that muffles all sound in a 40ft radius when scattered.'),
  }),
  R('nightstone', 'Nachtstein', 'Nightstone', {
    uses: 1,
    effect: E('Ganz geschluckt hebt er alle Erschöpfung und Entbehrung auf, als hättest du gut geschlafen und gegessen. Der Abgang ist unangenehm.', 'Swallow whole to relieve all fatigue and deprivation as if well slept and fed. Passing it is not fun.'),
  }),
  R('obliteration_scroll', 'Tilgungsrolle', 'Obliteration Scroll', {
    uses: 1, size: 0,
    effect: E('Unterschreibe irgendwo auf der Seite, um jedes Wissen um deine Existenz aus dieser Realität zu tilgen. Niemand erinnert sich an dich.', 'Sign anywhere to remove all knowledge of your existence from this plane. No one remembers you.'),
  }),
  R('parliaments_promise', 'Versprechen des Parlaments', "Parliament's Promise", {
    armor: 1,
    effect: E('Ein Helm in Form eines Eulenkopfs. Der Träger kann den Kopf wie eine Eule drehen und im Dunkeln klar sehen, kann aber nicht sprechen. +1 Rüstung.', "An owl's-head helm. The wearer can twist their head around and see in darkness, but cannot speak. +1 Armor."),
  }),
  R('phoenix_ash', 'Phönixasche', 'Phoenix Ash', {
    uses: 1,
    effect: E('Über eine Leiche gestreut erweckt sie den Toten mit voller Gesundheit, aber ohne Erinnerung an sein früheres Leben.', 'Sprinkle over a corpse to resurrect them at full health, with no memory of their past life.'),
  }),
  R('ring_snake', 'Schlangenring', 'Ring of the Snake', {
    size: 0, charges: 1, recharge: E('Begrabe den Ring mit einer Leiche. Grab die Leiche einen Monat später aus und hole ihn.', 'Bury the ring with a corpse. Exhume it a month later and retrieve it.'),
    effect: E('Am Finger fällst du in einen todesähnlichen Schlaf. Wird der Ring abgenommen, erwachst du erfrischt; sonst hält es einen Monat.', 'On your finger, fall into a death-like sleep. Remove the ring to wake refreshed; else it lasts a month.'),
  }),
  R('roc_feather', 'Rok-Feder', 'Roc Feather', {
    uses: 1,
    effect: E('Beim Fallen gehalten schwebst du aus jeder Höhe sicher zu Boden.', 'Hold while falling to float safely to the ground from any height.'),
  }),
  R('skull_whistle', 'Schädelpfeife', 'Skull Whistle', {
    charges: 3, recharge: E('Füttere das Instrument mit einer Haarsträhne, aus einem lebenden Schädel gerissen.', 'Feed the whistle a clump of hair pulled from a living skull.'),
    effect: E('Ein eisiger Schrei zwingt alle Hörenden (auch den Bläser) zu einem WIL-RW oder sie sind kurz kampfunfähig.', 'A chilling scream forces all who hear it (including the blower) to WIL save or be briefly incapacitated.'),
  }),
  R('soul_clump', 'Seelenklumpen', 'Soul Clump', {
    effect: E('Ein fauststgroßer Ball mit Noppen. Über eine Fläche gerollt sammelt er alle Gegenstände kleiner als seine Masse ein. Lebewesen sind immun.', 'A fist-sized bumpy ball. Rolled on a flat surface, it collects any objects smaller than its mass. Living creatures are immune.'),
  }),
  R('spystone', 'Spähstein', 'Spystone', {
    charges: 1, recharge: E('Lass den Stein mindestens dreimal über ein Gewässer springen und hole ihn zurück.', 'Skip the stone at least three times on water and recover it.'),
    effect: E('Drücken nimmt Ton in 12 m Radius auf. Erneut drücken spielt ihn ab, beliebig oft.', 'Squeeze to record audio in a 40ft radius. Squeeze again to play it back, as often as you like.'),
  }),
  R('sticky_rope', 'Klebeseil', 'Sticky Rope', {
    size: 1, charges: 1, recharge: E('Schneide 3 m Seil ab, die dann zerfallen.', 'Cut off 10ft of rope, which then withers away.'),
    effect: E('Ein 30-m-Seil, das an jeder Fläche haftet.', 'A 100ft rope that can stick to any surface.'),
  }),
  R('stone_eater', 'Steinfresser', 'Stone Eater', {
    uses: 1,
    effect: E('Ein nagergroßer Hundertfüßer, der Stein frisst und in unter einer Stunde einen kleinen Tunnel gräbt. Mehrfach nutzbar — wenn du ihn fängst (GES 18).', 'A rodent-sized centipede that eats stone, tunneling in under an hour. Reusable if you can catch it (DEX 18).'),
  }),
  R('stonewax_gum', 'Steinwachs-Kaugummi', 'Stonewax Gum', {
    uses: 3, size: 0,
    effect: E('Kauen, dann ausspucken: härtet und dehnt sich zu einer perfekten, unzerstörbaren Versiegelung.', 'Chew, then spit. Hardens and stretches into a perfect, unbreakable seal.'),
  }),
  R('sponge_army', 'Schwammheer', 'Sponge Army', {
    uses: 1,
    effect: E('Ein Dutzend Miniatursoldaten aus Schwamm. Mit Wasser bespritzt wachsen sie zu voller Größe (8 TP, 6 STÄ, W6, Abteilung) für ~10 Minuten.', 'A dozen sea-sponge soldiers. Splashed with water they grow full-size (8 HP, 6 STR, d6, detachment) for ~10 minutes.'),
  }),
  R('tupshead_crown', 'Widderkopf-Krone', 'Tupshead Crown', {
    size: 2, armor: 1, damage: 'd6+d6',
    effect: E('Ein Widderkopfhelm aus Bergeiche. Die Hörner sind eine Waffe (W6+W6). +1 Rüstung, sperrig.', "A ram's-head helm of alpine oak. The horns are a weapon (d6+d6). +1 Armor, bulky."),
  }),
  R('veilsilk_grip', 'Schleierseiden-Griff', 'Veilsilk Grip', {
    size: 0, charges: 1, recharge: E('Schneide einen der Finger ab.', 'Snip off one of the fingers.'),
    effect: E('Eine Hand in diesem Handschuh kann durch feste Gegenstände hindurchgreifen.', 'A hand wearing this glove can phase through solid objects.'),
  }),
  R('voice_mountain', 'Stimme des Berges', 'Voice of the Mountain', {
    uses: 1,
    effect: E('Ein rauer Kiesel mit dem Wesen eines Berggeists. Zerdrücken ruft ein Erdbeben oder ähnliche Naturkatastrophe hervor. Erwarte keine Verschonung.', "A rough pebble with a mountain spirit's essence. Crush to call an earthquake. Do not expect to be spared."),
  }),
  R('ward_stone', 'Bannstein', 'Ward Stone', {
    uses: 1,
    effect: E('Ein Flussstein mit verblassten Symbolen. Zerschlagen setzt er in 6 m Radius ein silbriges Pulver frei, das jeden befriedet, der es einatmet.', 'A river stone notched with faded symbols. Smash to release a silvery powder in a 20ft radius that pacifies anyone who breathes it.'),
  }),
  R('whispergale', 'Flüsterböe', 'Whispergale', {
    uses: 1,
    effect: E('Eine ballonförmige Pflanze, die eine gesprochene Botschaft fängt und binnen eines Tages an einen Ort in Gehweite bringt.', "A balloon-shaped plant that captures a spoken message and delivers it within a day's walk."),
  }),
  R('whistle_rope', 'Pfeifseil', 'Whistle-Rope', {
    size: 1,
    effect: E('4,5 m sehr biegsames Leder. In der Luft geschwungen erzeugt es einen kräftigen Infraschall, der Wildtiere vertreibt. Auch unter Wasser.', '15ft of flexible leather. Swirl in the air to drive away wildlife with a subsonic effect. Works underwater.'),
  }),
  R('wonder_bar', 'Wunderstange', 'Wonder Bar', {
    size: 1, charges: 1, recharge: E('Halte die Stange eine Stunde ununterbrochen mit beiden Händen (WIL-RW).', 'Hold the bar with both hands for one continuous hour (WIL save).'),
    effect: E('Ein Druck auf den Schalter friert die Eisenstange an Ort und Stelle ein, selbst in der Luft, bis der Schalter wieder gedrückt wird.', 'Press the switch to freeze the iron bar in place, even midair, until pressed again.'),
  }),
  R('wraith_lantern', 'Wraithlaterne', 'Wraith Lantern', {
    size: 1, charges: 1, recharge: E('Töte die zuletzt mithilfe der Laterne gefundene Person und fange ihren Geist ein.', 'Kill the last person found with the help of the lantern, trapping their spirit inside.'),
    effect: E('Schreibe einen Namen aufs Glas; er verschwindet und die Laterne weist dir einen Weg zum aktuellen Aufenthaltsort dieser Person.', "Write a name on the glass; it vanishes and the lantern reveals a path to that person's current location."),
  }),
];

export const RELIC_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r]));
