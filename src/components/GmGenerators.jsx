import { useState } from 'react';
import { Dices, HandCoins } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { rollDie, rollAttribute } from '../rules/dice.js';
import { TRAIT_TABLES } from '../data/tables.js';
import {
  NPC_NAMES, NPC_QUIRKS, NPC_BACKGROUNDS, NPC_GOALS, NPC_VIRTUES, NPC_VICES,
} from '../data/npcTables.js';
import { randomTrinket, makeTrinket } from '../data/items.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Aussehen aus den Merkmalstabellen der Charaktererschaffung; Tugend und Laster
// kommen aus den NSC-Tabellen (Warden's Guide), nicht aus den SC-Merkmalen.
const LOOK_KEYS = ['physique', 'skin', 'hair', 'face', 'speech', 'clothing'];

function rollStranger() {
  const name = pick(NPC_NAMES);
  const age = rollDie(20) + rollDie(20) + 10;
  const str = rollAttribute().value;
  const dex = rollAttribute().value;
  const wil = rollAttribute().value;
  const hp = rollDie(6);
  const traits = [
    ...LOOK_KEYS.map((k) => ({ key: k, label: TRAIT_TABLES[k].label, value: pick(TRAIT_TABLES[k].options) })),
    { key: 'virtue', label: TRAIT_TABLES.virtue.label, value: pick(NPC_VIRTUES) },
    { key: 'vice', label: TRAIT_TABLES.vice.label, value: pick(NPC_VICES) },
  ];
  return {
    id: Date.now(),
    name,
    background: pick(NPC_BACKGROUNDS),
    age,
    str,
    dex,
    wil,
    hp,
    traits,
    quirk: pick(NPC_QUIRKS),
    goal: pick(NPC_GOALS),
  };
}

export default function GmGenerators({ mp }) {
  const { t, lang } = useLang();
  const [npc, setNpc] = useState(null);
  const [trinket, setTrinket] = useState(null);
  const [given, setGiven] = useState(false);

  const rollNpc = () => setNpc(rollStranger());
  const rollTrinket = () => { setTrinket(randomTrinket()); setGiven(false); };
  const toStash = () => { mp.stashAdd(makeTrinket(trinket)); setGiven(true); };

  return (
    <div className="gm-gen">
      <div className="gm-gen-col">
        <div className="gm-gen-head">
          <span className="field-label">{t('gen.npc')}</span>
          <button type="button" className="btn btn-sm" onClick={rollNpc}><Dices size={13} /> {t('gen.roll')}</button>
        </div>
        {npc ? (
          <div className="gm-gen-card">
            <p className="gm-gen-title">
              <strong>{npc.name}</strong> — {loc(npc.background, lang)}, {npc.age} {t('sheet.age')}
            </p>
            <p className="gm-gen-attrs">
              {t('attr.str')} {npc.str} · {t('attr.dex')} {npc.dex} · {t('attr.wil')} {npc.wil} · {t('res.hpAbbr')} {npc.hp}
            </p>
            <p className="gm-gen-traits">
              {npc.traits.map((tr) => `${loc(tr.label, lang)}: ${loc(tr.value, lang)}`).join(' · ')}
            </p>
            <p className="gm-gen-quirk">{t('gen.quirk')}: {loc(npc.quirk, lang)}</p>
            <p className="gm-gen-motivation">{t('gen.goal')}: {loc(npc.goal, lang)}</p>
          </div>
        ) : <p className="gm-gen-empty">{t('gen.npcEmpty')}</p>}
      </div>

      <div className="gm-gen-col">
        <div className="gm-gen-head">
          <span className="field-label">{t('gen.item')}</span>
          <button type="button" className="btn btn-sm" onClick={rollTrinket}><Dices size={13} /> {t('gen.roll')}</button>
        </div>
        {trinket ? (
          <div className="gm-gen-card">
            <p className="gm-gen-title">{loc(trinket, lang)}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={toStash} disabled={given}>
              <HandCoins size={13} /> {given ? t('gen.givenToStash') : t('gen.toStash')}
            </button>
          </div>
        ) : <p className="gm-gen-empty">{t('gen.itemEmpty')}</p>}
      </div>
    </div>
  );
}
