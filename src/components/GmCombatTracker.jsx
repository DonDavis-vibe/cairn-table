import { useEffect, useMemo, useState } from 'react';
import {
  Plus, X, ChevronRight, RotateCcw, Skull, Users, Eye, EyeOff, Save,
} from 'lucide-react';
import { IconSwords } from './icons.jsx';
import { useLang, loc } from '../i18n/index.jsx';
import { Field, TextInput } from './ui.jsx';
import { rollDie, rollReaction, toW } from '../rules/dice.js';
import { CREATURES } from '../data/creatures.js';
import { readJSON, writeJSON } from '../utils/storage.js';

let seq = 0;
const nid = () => `f${(seq += 1)}${Date.now().toString(36).slice(-3)}`;

const LIB_KEY = 'cairn-table-user-monsters';

function fromCreature(c, lang) {
  return {
    id: nid(), name: loc(c.name, lang), hp: c.hp, hpMax: c.hp, armor: c.armor,
    str: c.str, dex: c.dex, wil: c.wil, attack: loc(c.attack, lang), dmg: c.dmg, detachment: c.detachment,
    note: loc(c.note, lang),
  };
}

// Eigene NSCs, lokal gesichert (nicht Teil der Raum-Synchronisation — reine
// Vorbereitungs-Bequemlichkeit fuer den Warden, wie das eingebaute Bestiarium).
function fromLibrary(m) {
  return {
    id: nid(), name: m.name, hp: m.hp, hpMax: m.hp, armor: m.armor,
    str: 10, dex: 10, wil: m.wil, attack: `W${m.dmg}`, dmg: m.dmg, detachment: m.detachment, note: '',
  };
}

export default function GmCombatTracker({ mp }) {
  const { t, lang } = useLang();
  const [round, setRound] = useState(0);
  const [foes, setFoes] = useState([]);
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState({
    name: '', hp: 4, armor: 0, dmg: 6, wil: 8, detachment: false,
  });
  const [library, setLibrary] = useState(() => readJSON(LIB_KEY, []));

  const saveToLibrary = () => {
    const name = custom.name.trim();
    if (!name) return;
    const entry = { id: nid(), name, hp: custom.hp, armor: custom.armor, dmg: custom.dmg, wil: custom.wil, detachment: custom.detachment };
    setLibrary((lib) => {
      const next = [...lib, entry];
      writeJSON(LIB_KEY, next);
      return next;
    });
  };
  const deleteFromLibrary = (id) => setLibrary((lib) => {
    const next = lib.filter((m) => m.id !== id);
    writeJSON(LIB_KEY, next);
    return next;
  });

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return CREATURES
      .filter((c) => `${c.name.de} ${c.name.en}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [q]);

  const log = (text, tone) => mp.logGmAction({ text: `${t('gm.warden')}: ${text}`, tone, cmd: 'gm' });

  const add = (foe) => setFoes((f) => [...f, foe]);
  const remove = (id) => setFoes((f) => f.filter((x) => x.id !== id));
  const setHp = (id, hp) => setFoes((f) => f.map((x) => (x.id === id ? { ...x, hp } : x)));
  const toggleVisible = (id) => setFoes((f) => f.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)));
  const toggleDetach = (id) => setFoes((f) => f.map((x) => (x.id === id ? { ...x, detachment: !x.detachment } : x)));

  // Sichtbar geschaltete Gegner (nur Namen) an die Spieler:innen spiegeln.
  const shareNpcs = mp.shareNpcs;
  useEffect(() => {
    shareNpcs?.(foes.filter((x) => x.visible && x.hp > 0).map((x) => ({ id: x.id, name: x.name })));
  }, [foes, shareNpcs]);

  const attack = (foe) => {
    if (foe.detachment) {
      // Abteilungen gegen Einzelne: verstaerkt (W12) + Stoss (je Ziel einzeln).
      const roll = rollDie(12);
      log(`${foe.name} ${t('combat.log.attackRoll', { die: 'W12', roll })} — ${t('gm.detachAttack')}`, 'bad');
      return;
    }
    const roll = rollDie(foe.dmg || 6);
    log(`${foe.name} ${t('combat.log.attackRoll', { die: `W${foe.dmg}`, roll })}`, 'bad');
  };
  const morale = (foe) => {
    // Moral ist ein WIL-Rettungswurf: 1 gelingt immer, 20 misslingt immer.
    const d = rollDie(20);
    const ok = d === 1 ? true : d === 20 ? false : d <= foe.wil;
    log(`${foe.name} — ${t('gm.moraleRoll', { roll: d, wil: foe.wil })}: ${ok ? t('gm.moraleHold') : t('gm.moraleFlee')}`, ok ? 'gm' : 'bad');
  };
  const reaction = () => {
    const r = rollReaction();
    log(`${t('dice.reaction')} — 2W6 ${r.dice.join('+')} · ${t(`reaction.${r.key}`)}`);
  };

  const nextRound = () => {
    const n = round + 1;
    setRound(n);
    log(n === 1 ? t('gm.round1') : t('gm.roundN', { n }), 'gm');
  };
  const reset = () => { setRound(0); setFoes([]); };

  return (
    <div className="combat">
      <div className="combat-bar">
        <button type="button" className="btn btn-sm btn-primary" onClick={nextRound}>
          <ChevronRight size={14} /> {round === 0 ? t('gm.startCombat') : t('gm.nextRound')}
        </button>
        {round > 0 ? <span className="combat-round">{t('gm.roundLabel', { n: round })}</span> : null}
        <button type="button" className="btn btn-sm" onClick={reaction}><Users size={13} /> {t('dice.reaction')}</button>
        {round > 0 || foes.length ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={reset}><RotateCcw size={13} /> {t('common.reset')}</button>
        ) : null}
      </div>

      {round === 1 ? <p className="combat-hint">{t('gm.round1Hint')}</p> : null}

      {foes.length === 0 ? <p className="combat-empty">{t('gm.noFoes')}</p> : null}
      <ul className="combat-list">
        {foes.map((foe) => (
          <li key={foe.id} className={`combat-foe${foe.hp <= 0 ? ' is-down' : ''}`}>
            <div className="combat-foe-head">
              {foe.hp <= 0 ? <Skull size={14} /> : null}
              <strong>{foe.name}</strong>
              <button
                type="button"
                className={`badge combat-detach${foe.detachment ? ' on' : ''}`}
                onClick={() => toggleDetach(foe.id)}
                title={foe.detachment ? t('gm.unmarkDetach') : t('gm.markDetach')}
              >
                {t('gm.detachment')}
              </button>
              <button
                type="button"
                className={`combat-eye${foe.visible ? ' on' : ''}`}
                onClick={() => toggleVisible(foe.id)}
                aria-label={foe.visible ? t('gm.hideFromPlayers') : t('gm.showToPlayers')}
                title={foe.visible ? t('gm.hideFromPlayers') : t('gm.showToPlayers')}
              >
                {foe.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button type="button" className="item-x" onClick={() => remove(foe.id)} aria-label={t('common.remove')}><X size={12} /></button>
            </div>
            <div className="combat-foe-stats">
              <label className="mini-num">{t('res.hp')}
                <input type="number" value={foe.hp} onChange={(e) => setHp(foe.id, Number(e.target.value))} />
              </label>
              <span>/ {foe.hpMax}</span>
              {foe.armor ? <span className="badge badge-armor">{foe.armor} {t('item.armor')}</span> : null}
              <span className="combat-attr">STÄ {foe.str}</span>
              <span className="combat-attr">GES {foe.dex}</span>
              <span className="combat-attr">WIL {foe.wil}</span>
              {foe.attack !== '—' ? <span className="combat-atk">{toW(foe.attack)}</span> : null}
            </div>
            <div className="combat-foe-actions">
              {foe.dmg ? <button type="button" className="btn btn-bad btn-sm" onClick={() => attack(foe)}><IconSwords size={12} /> {t('gm.rollAttack')}</button> : null}
              <button type="button" className="btn btn-sm" onClick={() => morale(foe)}>{t('gm.morale')}</button>
            </div>
            {foe.detachment ? <p className="combat-note combat-detach-note">{t('gm.detachVuln')}</p> : null}
            {foe.note ? <p className="combat-note">{foe.note}</p> : null}
          </li>
        ))}
      </ul>

      <div className="combat-add">
        <Field label={t('gm.addFoe')}>
          <TextInput value={q} onChange={setQ} placeholder={t('gm.foeSearch')} />
        </Field>
        {matches.length ? (
          <ul className="combat-matches">
            {matches.map((c) => (
              <li key={c.name.en}>
                <button type="button" className="catalog-item" onClick={() => { add(fromCreature(c, lang)); setQ(''); }}>
                  <span className="catalog-name">{loc(c.name, lang)}</span>
                  <span className="badge">{c.hp} {t('res.hp')}</span>
                  {c.armor ? <span className="badge badge-armor">{c.armor}</span> : null}
                  {loc(c.attack, lang) !== '—' ? <span className="badge badge-dmg">{toW(loc(c.attack, lang))}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {library.length ? (
          <div className="combat-lib">
            <span className="field-label">{t('gm.myMonsters')}</span>
            <ul className="combat-matches">
              {library.map((m) => (
                <li key={m.id} className="combat-lib-row">
                  <button type="button" className="catalog-item" onClick={() => add(fromLibrary(m))}>
                    <span className="catalog-name">{m.name}</span>
                    <span className="badge">{m.hp} {t('res.hp')}</span>
                    {m.armor ? <span className="badge badge-armor">{m.armor}</span> : null}
                    <span className="badge badge-dmg">{toW(`W${m.dmg}`)}</span>
                  </button>
                  <button type="button" className="item-x" onClick={() => deleteFromLibrary(m.id)} aria-label={t('common.remove')}><X size={12} /></button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="custom-row">
          <TextInput value={custom.name} onChange={(name) => setCustom((s) => ({ ...s, name }))} placeholder={t('inv.customName')} />
          <label className="mini-num">{t('res.hp')}<input type="number" value={custom.hp} onChange={(e) => setCustom((s) => ({ ...s, hp: Number(e.target.value) }))} /></label>
          <label className="mini-num">{t('item.armor')}<input type="number" value={custom.armor} onChange={(e) => setCustom((s) => ({ ...s, armor: Number(e.target.value) }))} /></label>
          <label className="mini-num">{t('dice.damage')}<input type="number" value={custom.dmg} onChange={(e) => setCustom((s) => ({ ...s, dmg: Number(e.target.value) }))} /></label>
          <label className="mini-num">WIL<input type="number" value={custom.wil} onChange={(e) => setCustom((s) => ({ ...s, wil: Number(e.target.value) }))} /></label>
          <label className="radio-line">
            <input type="checkbox" checked={custom.detachment} onChange={(e) => setCustom((s) => ({ ...s, detachment: e.target.checked }))} />
            {t('gm.detachment')}
          </label>
          <button type="button" className="btn btn-sm btn-primary" disabled={!custom.name.trim()} onClick={() => {
            add({
              id: nid(), name: custom.name.trim(), hp: custom.hp, hpMax: custom.hp, armor: custom.armor, str: 10, dex: 10, wil: custom.wil, attack: `W${custom.dmg}`, dmg: custom.dmg, detachment: custom.detachment, note: '',
            });
            setCustom({
              name: '', hp: 4, armor: 0, dmg: 6, wil: 8, detachment: false,
            });
          }}><Plus size={13} /> {t('inv.add')}</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!custom.name.trim()} onClick={saveToLibrary} title={t('gm.saveMonsterHint')}>
            <Save size={13} /> {t('gm.saveMonster')}
          </button>
        </div>
      </div>
    </div>
  );
}
