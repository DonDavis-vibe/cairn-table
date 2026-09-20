<div align="center">

<sub>English · [Deutsch](README.de.md)</sub>

<img src="public/banner.jpg" width="100%" alt="A raven on a rune-carved standing stone looks across a foggy moor toward a lantern-lit cairn at the edge of the wood" />

# Cairn Table

**Character sheet · Warden dashboard · serverless real-time multiplayer**
for the tabletop role-playing game **[Cairn](https://cairnrpg.com/)** (2nd Edition) —
all in the browser, no sign-up.

<sub>bilingual DE / EN · everything stays local in your browser · no account, no server</sub>

### [**▶ Play Cairn Table**](https://dondavis-vibe.github.io/cairn-table/)

</div>

---

Open [the page](https://dondavis-vibe.github.io/cairn-table/), roll up an adventurer, and go. With others, the Warden opens a
room and shares a link — the connection runs directly between browsers
(WebRTC), so no game data ever passes through a server.

<p align="center">
  <img src="public/screenshot-sheet.jpg" width="49%" alt="Character sheet with attributes, Hit Protection and the damage chain" />
  <img src="public/screenshot-warden.jpg" width="49%" alt="Warden dashboard with room, combat tracker and a foe" />
</p>

## For players

- **Character sheet** — STR / DEX / WIL (3–18), Hit Protection, gold, Deprivation,
  scars, age, traits, bond, omen. Everything saves automatically in the browser.
- **Character creation** following Cairn 2e — all **20 backgrounds** with fixed
  starting gear and d6 sub-tables, 3d6 per attribute (two swappable),
  HP 1d6, gold 3d6, 8 trait tables, bond & omen.
- **10-slot inventory via drag & drop** — four worn/in hand, six in the backpack;
  1- and 2-slot items, petty (no slot), usage points, Fatigue as a slot card.
- **Dice** — saves (d20 ≤ attribute, advantage/disadvantage), damage rolls
  (die choice, impaired/enhanced, multiple attackers, armor deduction),
  die of fate, reaction. Automatic damage chain: armor → HP → STR →
  save → scar/death.
- **Rest** — a short rest restores HP fully, a week's rest restores attributes too.

## For Wardens

- **Dashboard** — every hero at a glance: HP bar, attributes, gold, armor,
  occupied slots, conditions & scars as chips, expandable inventory.
- **Per-sheet actions** — damage (runs the full chain), heal, gold ±,
  demand a save, add Fatigue, toggle Deprived, trigger a rest, whisper.
- **Shared round log** and announcements to everyone.
- **Combat tracker** — foes from the **2e bestiary (84 creatures)** or your own,
  HP tracking, attack rolls, morale (WIL save), reaction, round counter with
  a "first round: DEX save" hint.
- **Secret Warden notes** per player — local only, never sent.

## Playing together

Serverless multiplayer over WebRTC / PeerJS. The Warden is the host; players
join with a 4-letter code or a `?join` link. Reconnect and reload recovery
are built in. Game data runs directly and encrypted between browsers — only
the connection setup uses the public PeerJS broker and Google STUN.

## Developing

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/index.html  (portable single file, viteSingleFile)
npm run preview
npm run lint       # oxlint
```

A push to `main` builds and deploys via GitHub Actions to GitHub Pages.

**Stack:** Vite + React 19 (plain JS, no TypeScript), `@dnd-kit` for the
inventory grid, `peerjs` for multiplayer, `lucide-react` for icons. Fonts
(IM Fell English, Spectral) are self-hosted. No backend, no account.

## Rule data & images

`src/data/*` is derived from the official **Cairn 2e SRD** by Yochai Gal
(**CC BY-SA 4.0**). Effect texts are summarized, not copied verbatim.
Derived rule text is therefore also CC BY-SA 4.0. The full SRD clone under
`reference/` stays local only (excluded via `.gitignore`).

Logo, banner, social card and woodcut vignettes are original AI generations
(sources in `img/`, local only) — **not** official Cairn artwork.

## Legal

[Imprint](public/impressum.html) · [Privacy policy](public/datenschutz.html) —
standalone pages. The imprint's contact block is injected at deploy time from
the repository secret `IMPRESSUM_KONTAKT` (template:
[`.github/KONTAKT.beispiel.html`](.github/KONTAKT.beispiel.html)) and never
appears in the public source code. German law (§5 DDG) requires an imprint
for any publicly run online service, commercial or not — if you fork this
and run your own instance, you'll need your own.

## License

Code: **MIT** (`LICENSE`).

> *Based on Cairn by Yochai Gal, used under CC-BY-SA 4.0. Cairn Table is an independent,
> non-commercial fan tool and is not affiliated with Cairn RPG.*
