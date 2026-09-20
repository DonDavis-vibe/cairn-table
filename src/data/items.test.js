import { describe, expect, it } from 'vitest';
import {
  makeItem, makeFatigue, makeCondition, makeSpellbook, makeScroll, makeRelic,
  makeTrinket, randomTrinket,
} from './items.js';
import { SPELLS } from './spells.js';
import { RELICS } from './relics.js';
import { TRINKETS } from './trinkets.js';
import { NPC_QUIRKS, NPC_MOTIVATIONS } from './npcFlavor.js';

describe('makeItem', () => {
  it('baut einen Katalog-Gegenstand mit Wuerfel und Groesse', () => {
    const it = makeItem('w_medium');
    expect(it.type).toBe('weapon');
    expect(it.damage).toBe('d8');
    expect(it.itemId).toMatch(/^i/);
  });

  it('overrides schlagen den Katalog', () => {
    const it = makeItem('w_light', { nameText: 'Dolch', name: { de: 'Dolch', en: 'Dagger' }, size: 0 });
    expect(it.size).toBe(0);
    expect(it.name.de).toBe('Dolch');
  });

  it('unbekannter key -> generischer Gegenstand', () => {
    const it = makeItem(null, { nameText: 'Dingsda' });
    expect(it.type).toBe('gear');
    expect(it.name.de).toBe('Dingsda');
  });
});

describe('makeFatigue / makeCondition', () => {
  it('Fatigue ist ein condition-Slot', () => {
    const f = makeFatigue();
    expect(f.type).toBe('condition');
    expect(f.key).toBe('fatigue');
    expect(f.cleared).toBe(false);
  });

  it('makeCondition mit bekanntem key traegt clear-Bedingung', () => {
    expect(makeCondition('frightened').clear.de).toBeTruthy();
  });
});

describe('makeSpellbook / makeScroll', () => {
  const spellId = SPELLS[0].id;

  it('Zauberbuch: 1 Slot, spellId, bilingualer Name', () => {
    const sb = makeSpellbook(spellId);
    expect(sb.type).toBe('spellbook');
    expect(sb.size).toBe(1);
    expect(sb.spellId).toBe(spellId);
    expect(sb.name.de).toContain('Zauberbuch');
    expect(sb.effect).toEqual(SPELLS[0].effect);
  });

  it('Schriftrolle: petty (size 0)', () => {
    const sc = makeScroll(spellId);
    expect(sc.type).toBe('scroll');
    expect(sc.size).toBe(0);
    expect(sc.name.en).toContain('Scroll');
  });

  it('unbekannte spellId -> null', () => {
    expect(makeSpellbook('nope')).toBeNull();
    expect(makeScroll('nope')).toBeNull();
  });
});

describe('makeRelic', () => {
  it('uebernimmt Groesse, Schaden/Ruestung und Ladungen', () => {
    const withCharges = RELICS.find((r) => r.charges || r.uses);
    const rel = makeRelic(withCharges.id);
    expect(rel.type).toBe('relic');
    expect(rel.relicId).toBe(withCharges.id);
    const n = withCharges.charges ?? withCharges.uses;
    expect(rel.usage).toEqual({ max: n, current: 0 });
  });

  it('Relikt ohne Ladungen hat usage null', () => {
    const noCharges = RELICS.find((r) => !r.charges && !r.uses);
    if (!noCharges) return;
    expect(makeRelic(noCharges.id).usage).toBeNull();
  });

  it('unbekannte relicId -> null', () => {
    expect(makeRelic('nope')).toBeNull();
  });
});

describe('Datenintegritaet', () => {
  it('jeder Zauber hat id + bilingualen Namen + Wirkung', () => {
    for (const s of SPELLS) {
      expect(s.id).toBeTruthy();
      expect(s.name.de && s.name.en).toBeTruthy();
      expect(s.effect.de && s.effect.en).toBeTruthy();
    }
  });

  it('Zauber-ids sind eindeutig', () => {
    const ids = SPELLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jedes Relikt hat id + bilingualen Namen + Wirkung', () => {
    for (const r of RELICS) {
      expect(r.id).toBeTruthy();
      expect(r.name.de && r.name.en).toBeTruthy();
      expect(r.effect.de && r.effect.en).toBeTruthy();
    }
  });

  it('Relikt-ids sind eindeutig', () => {
    const ids = RELICS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('genau 100 Kleinkram-Eintraege, alle bilingual', () => {
    expect(TRINKETS).toHaveLength(100);
    for (const tr of TRINKETS) expect(tr.de && tr.en).toBeTruthy();
  });

  it('NSC-Auffaelligkeiten und -Motivationen sind bilingual und eindeutig', () => {
    for (const list of [NPC_QUIRKS, NPC_MOTIVATIONS]) {
      for (const e of list) expect(e.de && e.en).toBeTruthy();
      expect(new Set(list.map((e) => e.de)).size).toBe(list.length);
    }
  });
});

describe('makeTrinket / randomTrinket', () => {
  it('baut einen petty Gegenstand ohne Effekt', () => {
    const tr = randomTrinket();
    const it = makeTrinket(tr);
    expect(it.size).toBe(0);
    expect(it.type).toBe('trinket');
    expect(it.name).toBe(tr);
  });
});
