import { useState } from 'react';
import {
  Plus, X, Trash2, PackagePlus, Dices, HeartPulse, RotateCcw,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { itemSlotCost, ATTR_KEYS } from '../rules/character.js';
import { toW, rollAttribute, rollDie, rollSave } from '../rules/dice.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { GM_GIVE } from '../multiplayer/protocol.js';
import { Field, TextInput, InfoHint } from './ui.jsx';
import AddItemMenu from './AddItemMenu.jsx';

// Mietling, Maultier, Karren — ein eigenes, benanntes Inventar mit
// Slot-Limit, getrennt vom persönlichen Bogen und von der Tischmitte.
// Rein lokale Warden-Verwaltung (wie die NSC-Bibliothek): kein Raum-Sync
// nötig, "Geben" nutzt den bestehenden GM_GIVE-Kanal direkt an eine:n
// Spieler:in. Ueberlebt einen Reload, ist aber wie die Tischmitte selbst
// noch nicht raum-synchronisiert (Spieler:innen sehen sie nicht).
//
// Optionale Werte (`stats`) machen aus einem Behälter einen Mietling, der
// kämpfen und retten kann — bewusst simpler als ein PC-Bogen (Cairn 2e,
// Core Rules -> Hirelings: 3W6 je Attribut + 1W6 TP), ohne die volle
// STÄ-Überlauf-Kette: Schaden geht direkt auf TP oder ein Attribut.
const KEY = 'cairn-table-containers';
let seq = 0;
const nid = () => `ctr${(seq += 1)}${Date.now().toString(36).slice(-3)}`;

const usedSlotsOf = (items) => items.reduce((n, it) => n + itemSlotCost(it), 0);

function rollHirelingStats() {
  const attr = () => { const v = rollAttribute().value; return { max: v, current: v }; };
  const hp = rollDie(6);
  return {
    str: attr(), dex: attr(), wil: attr(), hp: { max: hp, current: hp },
  };
}

function ItemLine({ item, lang, mark }) {
  const effect = loc(item.effect, lang);
  return (
    <div className="stash-item-info">
      <span className="stash-item-name">{loc(item.name, lang)}</span>
      {item.damage ? <span className="badge badge-dmg">{toW(item.damage, mark)}</span> : null}
      {item.armor ? <span className="badge badge-armor">+{item.armor}</span> : null}
      {effect ? <InfoHint text={effect} /> : null}
    </div>
  );
}

// Werte-Block eines Mietlings: TP-Leiste + Schaden, Attribute mit
// Rettungswurf je Feld. Eigener Sub-Komponente, damit ihr lokaler
// Mengen-State (Schaden-Eingabe) nicht den ganzen Behälter neu rendert.
function HirelingStats({ container: c, onChange, onRemove, onLog }) {
  const { t } = useLang();
  const [dmg, setDmg] = useState(1);
  const s = c.stats;

  const setStat = (patch) => onChange({ ...c, stats: { ...s, ...patch } });
  const hpPct = s.hp.max > 0 ? Math.round((s.hp.current / s.hp.max) * 100) : 0;
  const hpTone = s.hp.current <= 0 ? 'bad' : hpPct <= 50 ? 'warn' : 'ok';

  const applyDamage = () => {
    const amt = Math.max(0, Number(dmg) || 0);
    if (!amt) return;
    const next = Math.max(0, s.hp.current - amt);
    setStat({ hp: { ...s.hp, current: next } });
    onLog(t('container.log.damage', { name: c.name, amt, current: next, max: s.hp.max }), 'bad');
  };
  const healFull = () => { setStat({ hp: { ...s.hp, current: s.hp.max } }); onLog(t('container.log.healed', { name: c.name }), 'ok'); };
  const rollSaveFor = (attr) => {
    const r = rollSave(s[attr].current);
    onLog(`${c.name} — ${t('dice.saveVs', { attr: t(`attr.${attr}`) })} — ${t('dice.die')}20 ${r.d} ${r.ok ? '≤' : '>'} ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`, r.ok ? 'ok' : 'bad');
  };
  const reroll = () => {
    if (!window.confirm(t('container.statsRerollConfirm'))) return;
    onChange({ ...c, stats: rollHirelingStats() });
    onLog(t('container.log.rerolled', { name: c.name }), 'gm');
  };

  return (
    <div className="hireling-stats">
      <div className="hireling-hp">
        <HeartPulse size={13} />
        <span className={`hp-fig hp-fig-${hpTone}`}>{s.hp.current}/{s.hp.max}</span>
        <span className="hp-bar hireling-bar"><span style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }} /></span>
        <input type="number" min="0" className="hireling-dmg-input" value={dmg} onChange={(e) => setDmg(e.target.value)} aria-label={t('res.hp')} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={applyDamage}>{t('container.damage')}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={healFull}>{t('container.healFull')}</button>
      </div>
      <div className="hireling-attrs">
        {ATTR_KEYS.map((k) => (
          <span key={k} className="hireling-attr">
            {t(`attr.${k}`)}
            <input
              type="number"
              value={s[k].current}
              onChange={(e) => setStat({ [k]: { ...s[k], current: Number(e.target.value) || 0 } })}
            />
            <button type="button" className="chip chip-small" onClick={() => rollSaveFor(k)}>
              <Dices size={11} /> {t('dice.saveShort')}
            </button>
          </span>
        ))}
      </div>
      <div className="hireling-tools">
        <button type="button" className="btn btn-ghost btn-sm" onClick={reroll}><RotateCcw size={12} /> {t('container.statsReroll')}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>{t('container.statsRemove')}</button>
      </div>
    </div>
  );
}

export default function Containers({ mp }) {
  const { t, lang } = useLang();
  const [containers, setContainers] = useState(() => readJSON(KEY, []));
  const [newName, setNewName] = useState('');
  const [newSlots, setNewSlots] = useState(10);
  const [addingTo, setAddingTo] = useState(null);

  const persist = (next) => { setContainers(next); writeJSON(KEY, next); };
  const updateContainer = (updated) => persist(containers.map((c) => (c.id === updated.id ? updated : c)));
  const log = (text, tone) => mp.logGmAction({ text: `${t('gm.warden')}: ${text}`, tone, cmd: 'gm' });

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    persist([...containers, {
      id: nid(), name, slotsMax: Math.max(1, Number(newSlots) || 10), items: [], stats: null,
    }]);
    setNewName('');
    setNewSlots(10);
  };
  const removeContainer = (id) => {
    if (!window.confirm(t('container.deleteConfirm'))) return;
    persist(containers.filter((c) => c.id !== id));
  };
  const addItem = (id, item) => {
    persist(containers.map((c) => (c.id === id ? { ...c, items: [...c.items, item] } : c)));
    setAddingTo(null);
  };
  const removeItem = (id, itemId) => {
    persist(containers.map((c) => (c.id === id ? { ...c, items: c.items.filter((it) => it.itemId !== itemId) } : c)));
  };
  const give = (id, itemId, peerId) => {
    const c = containers.find((x) => x.id === id);
    const item = c?.items.find((it) => it.itemId === itemId);
    if (!item || !peerId) return;
    removeItem(id, itemId);
    mp.sendGmCommand(peerId, { cmd: GM_GIVE, item });
  };
  const addStats = (c) => {
    const stats = rollHirelingStats();
    updateContainer({ ...c, stats });
    log(t('container.log.rolled', { name: c.name, str: stats.str.max, dex: stats.dex.max, wil: stats.wil.max, hp: stats.hp.max }), 'gm');
  };
  const removeStats = (c) => updateContainer({ ...c, stats: null });

  const players = Object.entries(mp.players || {});

  return (
    <div className="containers">
      {containers.length === 0 ? <p className="stash-empty">{t('container.empty')}</p> : null}

      <ul className="container-list">
        {containers.map((c) => {
          const used = usedSlotsOf(c.items);
          const full = used >= c.slotsMax;
          return (
            <li key={c.id} className="container-card">
              <div className="container-head">
                <strong>{c.name}</strong>
                <span className={`badge${full ? ' badge-dmg' : ''}`}>{used}/{c.slotsMax}</span>
                <button type="button" className="item-x" onClick={() => removeContainer(c.id)} aria-label={t('common.remove')}>
                  <Trash2 size={13} />
                </button>
              </div>

              {c.stats ? (
                <HirelingStats
                  container={c}
                  onChange={updateContainer}
                  onRemove={() => removeStats(c)}
                  onLog={log}
                />
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addStats(c)} title={t('container.addStatsHint')}>
                  <Dices size={13} /> {t('container.addStats')}
                </button>
              )}

              {c.items.length ? (
                <ul className="stash-list">
                  {c.items.map((it) => (
                    <li key={it.itemId} className="stash-row">
                      <ItemLine item={it} lang={lang} mark={t('dice.die')} />
                      <div className="stash-row-actions">
                        <select
                          className="text-input stash-give"
                          value=""
                          onChange={(e) => { if (e.target.value) give(c.id, it.itemId, e.target.value); }}
                          disabled={!players.length}
                          aria-label={t('stash.giveTo')}
                        >
                          <option value="">{players.length ? t('stash.giveTo') : t('gm.noPlayers')}</option>
                          {players.map(([pid, p]) => (
                            <option key={pid} value={pid}>{p.character?.name?.trim() || t('gm.unnamed')}</option>
                          ))}
                        </select>
                        <button type="button" className="item-x" onClick={() => removeItem(c.id, it.itemId)} aria-label={t('common.remove')}>
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="stash-empty">{t('container.emptyItems')}</p>}

              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingTo(c.id)} disabled={full}>
                <PackagePlus size={13} /> {t('container.addItem')}
              </button>
              {addingTo === c.id ? (
                <AddItemMenu onClose={() => setAddingTo(null)} onPick={(item) => addItem(c.id, item)} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="container-new">
        <Field label={t('container.newName')}>
          <TextInput value={newName} onChange={setNewName} placeholder={t('container.newNamePlaceholder')} />
        </Field>
        <label className="mini-num">
          {t('container.slots')}
          <input type="number" min="1" max="40" value={newSlots} onChange={(e) => setNewSlots(e.target.value)} />
        </label>
        <button type="button" className="btn btn-sm btn-primary" disabled={!newName.trim()} onClick={create}>
          <Plus size={13} /> {t('container.create')}
        </button>
      </div>
    </div>
  );
}
