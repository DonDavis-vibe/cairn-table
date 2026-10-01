# Custom backgrounds for Cairn Table

Cairn Table's character wizard ships the 20 official Cairn 2e backgrounds. You
can add your own — or anyone else's — as a `.json` file: open the wizard,
step 1 ("Background"), **Import custom backgrounds**. The file is validated on
the spot and, if it's good, your backgrounds show up in the dropdown right
away, grouped separately from the official ones.

This is entirely local: the file is read in your browser and kept in
`localStorage` there. Nothing is uploaded anywhere. To share a pack with your
table, send the `.json` file itself (Discord, email, whatever) — each player
imports it into their own browser.

Custom backgrounds never appear in "Roll d20" or "Roll an example" — those
simulate the official SRD table, which has exactly 20 fixed entries. Pick a
custom background from the dropdown instead.

## File shape

A file can be:

- a single background object,
- a plain array of background objects, or
- `{ "packName": "...", "backgrounds": [ ... ] }` — the `packName` is just a
  label shown in the importer's list so you can tell packs apart later.

Invalid entries are rejected individually with a reason; the rest of the file
still imports.

## Background object

```jsonc
{
  "id": "riverwarden",                    // required, unique, no spaces
  "name": { "de": "Flusswächter:in", "en": "Riverwarden" },   // required
  "blurb": { "de": "...", "en": "..." },  // optional, shown under the dropdown
  "names": ["Alder", "Reed", "Marsh"],    // required, at least one
  "gear": [ /* see below */ ],            // required (may be empty)
  "tables": [ /* see below */ ],          // optional
  "extra": { "omenAlways": true }         // optional, see below
}
```

`id` must not collide with an official background or another background
you've already imported — the importer tells you exactly which if it does.

### `gear`

Each entry is either a reference to Cairn Table's built-in item catalog, or a
fully custom item:

```jsonc
{ "key": "rations" }
```
```jsonc
{ "custom": {
  "de": "Angelrute", "en": "Fishing rod",
  "size": 1,          // optional: 0 petty, 1 normal (default), 2 bulky
  "damage": "d6",      // optional, dice notation ("d6", "d6+d6" for a paired weapon)
  "armor": 1,           // optional, positive number
  "usage": 3             // optional, positive number — "N uses"
} }
```

Setting `"size": 0` (or no size at all on a weightless flavor item) makes it
petty, same as the built-in catalog.

Catalog keys you can reference with `"key"` (59 total — matches the 2e
Marketplace):

```
w_light, w_medium, w_heavy, w_bow, w_crossbow, a_shield, a_helmet, a_gambeson,
a_brigandine, a_chainmail, a_plate, torch, lantern, oil_can, rations,
bandages, rope, grappling_hook, pole, lockpicks, common_tools, common_agents,
containers, cooking_gear, outdoor_comfort, tent, caltrops, net, antitoxin,
sedative, repellent, spyglass, compass, trap, instrument_simple, air_bladder,
bathing_goods, book, card_deck, chain, chest, chisel, instrument_complex,
costume_gear, dowsing_rod, expeditionary_gear, fire_oil, fishing_rod, games,
mirror, parchment, sewing_kit, specialized_tools, spiked_boots, chalk,
whistle, smoking_pipe, gloves, wilderness_clothes
```

(Starting gold — 3d6 gp — is automatic for every background; don't list it
in `gear`.)

### `tables`

The usual Cairn background shape: one or more sub-tables the player rolls on
and records in their notes. Each needs at least 2 options (not fixed at 6 —
use whatever die size fits):

```jsonc
{
  "q": { "de": "Woher stammt deine Narbe?", "en": "Where did your scar come from?" },
  "rolls": [
    { "de": "Ein Unfall beim Fischen.", "en": "A fishing accident." },
    { "de": "Ein Streit, der eskalierte.", "en": "A quarrel that got out of hand." }
  ]
}
```

### `extra` (optional)

Matches the two special clauses the official backgrounds use:

- `"bondTwice": true` — roll two Bonds instead of one.
- `"bondTwice": "onSix"` — roll a second Bond only if the **first** sub-table
  result was its last option (the "6" on a d6 table).
- `"omenAlways": true` — this background always rolls an Omen, regardless of
  who's youngest at the table.

## Worked example

Save as `riverwarden.json` and import it:

```json
{
  "packName": "River Folk",
  "backgrounds": [
    {
      "id": "riverwarden",
      "name": { "de": "Flusswächter:in", "en": "Riverwarden" },
      "blurb": {
        "de": "Du kennst jede Furt, jede Strömung, jedes Boot auf dem Fluss.",
        "en": "You know every ford, every current, every boat on the river."
      },
      "names": ["Alder", "Reed", "Marsh", "Fen", "Sorrel"],
      "gear": [
        { "key": "rations" },
        { "key": "rope" },
        { "custom": { "de": "Staken-Boot (für 2)", "en": "Pole boat (fits 2)", "size": 2 } },
        { "custom": { "de": "Angelrute", "en": "Fishing rod" } }
      ],
      "tables": [
        {
          "q": { "de": "Was hast du einmal aus dem Fluss gezogen?", "en": "What did you once pull from the river?" },
          "rolls": [
            { "de": "Einen ertrunkenen Ring, der nicht rostet.", "en": "A drowned ring that doesn't rust." },
            { "de": "Eine versiegelte Flasche mit einer Karte darin.", "en": "A sealed bottle with a map inside." },
            { "de": "Ein Boot ohne Besatzung, Segel noch gesetzt.", "en": "A boat with no crew, sail still set." },
            { "de": "Eine Glocke, die nicht aus dieser Gegend stammt.", "en": "A bell that isn't from around here." },
            { "de": "Einen Fremden, der sich an nichts erinnert.", "en": "A stranger who remembers nothing." },
            { "de": "Etwas, das du niemandem gezeigt hast.", "en": "Something you've shown no one." }
          ]
        },
        {
          "q": { "de": "Wem schuldest du eine Überfahrt?", "en": "Who do you owe a crossing to?" },
          "rolls": [
            { "de": "Einer Händlerin, die dich einst aus dem Wasser zog.", "en": "A trader who once pulled you from the water." },
            { "de": "Deiner eigenen Familie, flussabwärts.", "en": "Your own family, downriver." },
            { "de": "Niemandem — und das macht dich misstrauisch.", "en": "No one — which makes you suspicious of offers." },
            { "de": "Einem Fährmann, der nicht mehr fährt.", "en": "A ferryman who no longer ferries." },
            { "de": "Einer Gottheit, der der Fluss gehört.", "en": "A deity the river belongs to." },
            { "de": "Jemandem, den du über Bord gehen ließt.", "en": "Someone you let go overboard." }
          ]
        }
      ]
    }
  ]
}
```

## Errors

The importer validates every background and reports problems in plain
language — missing required fields, an unknown catalog key, a duplicate
`id`, dice notation that doesn't parse. A bad entry is skipped; everything
else in the file still imports.
