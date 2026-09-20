import { useState } from 'react';
import {
  HeartPulse, Dices, MessageCircle, ChevronDown, Moon,
} from 'lucide-react';
import { IconSwords, IconCoins, IconTriangleAlert } from './icons.jsx';
import { useLang, loc } from '../i18n/index.jsx';
import { readJSON, writeJSON } from '../utils/storage.js';
import {
  ATTR_KEYS, ALL_SLOTS, itemSlotCost, armorOf,
} from '../rules/character.js';
import { toW } from '../rules/dice.js';
import Portrait from './Portrait.jsx';
import {
  GM_DAMAGE, GM_HEAL, GM_GOLD, GM_SAVE, GM_FATIGUE, GM_DEPRIVED, GM_PANICKED, GM_REST, GM_WHISPER,
} from '../multiplayer/protocol.js';
import { shareEvent } from '../utils/discord.js';

const NOTE_KEY = (id) => `cairn-table-gm-note-${id}`;

function usedSlotsOf(c) {
  let n = 0;
  for (const s of ALL_SLOTS) {
    const ref = c.slots?.[s];
    if (ref && !ref.cont) n += itemSlotCost(c.items?.[ref.itemId]);
  }
  return n;
}

export default function GmPlayerCard({ peerId, character: c, mp }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [dmgTarget, setDmgTarget] = useState('hp');
  const [saveAttr, setSaveAttr] = useState('str');
  const [whisper, setWhisper] = useState('');
  const [note, setNote] = useState(() => readJSON(NOTE_KEY(c.id), '') || '');

  const amt = Math.max(0, Number(amount) || 0);
  const send = (cmd, extra) => mp.sendGmCommand(peerId, { cmd, ...extra });
  // logg: schreibt ins Runden-Log + Discord. Aktionen, die der Spieler-Bogen als
  // T_EVENT zurueckspiegelt (Schaden, Heilung, RW, Erschoepfung, Rast), bekommen
  // `echoed` — dann macht der Bogen Log + Discord, hier passiert nichts (sonst
  // stuende alles doppelt drin).
  const logg = (text, tone, echoed = false) => {
    if (echoed) return;
    mp.logGmAction({ text: `${c.name || '?'}: ${text}`, tone, cmd: 'gm' });
    if (tone !== 'whisper') shareEvent(c.name || t('gm.warden'), text, tone === 'bad' ? 'bad' : tone === 'ok' ? 'ok' : 'info');
  };

  const hpPct = c.hp?.max > 0 ? Math.round((c.hp.current / c.hp.max) * 100) : 0;
  const hpTone = c.hp?.current <= 0 ? 'bad' : hpPct <= 50 ? 'warn' : 'ok';
  const conditions = Object.values(c.items || {}).filter((i) => i.type === 'condition');
  const used = usedSlotsOf(c);

  const saveNote = (v) => { setNote(v); writeJSON(NOTE_KEY(c.id), v); };

  const tLabel = (target) => (target === 'hp' ? t('res.hp') : t(`attr.${target}`));

  return (
    <div className="gm-card">
      <div className="gm-card-head">
        {c.portrait ? <Portrait src={c.portrait} onChange={() => {}} size={44} /> : null}
        <div className="gm-card-id">
          <strong className="gm-card-name">{c.name || t('gm.unnamed')}</strong>
          <span className="gm-card-bg">{c.background} {c.age ? `· ${t('sheet.age')} ${c.age}` : ''}</span>
        </div>
        {c.critical ? <span className="badge badge-dmg">{t('res.critical')}</span> : null}
        {c.panicked ? <span className="badge badge-dmg">{t('res.panicked')}</span> : null}
        {c.deprived ? <span className="badge">{t('res.deprived')}</span> : null}
        {c.dex?.current === 0 ? <span className="badge badge-dmg">{t('res.paralyzed')}</span> : null}
        {c.wil?.current === 0 ? <span className="badge badge-dmg">{t('res.delirious')}</span> : null}
      </div>

      <div className={`gm-hp gm-hp-${hpTone}`}>
        <span>{t('res.hp')}</span>
        <div className="hp-bar"><span style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }} /></div>
        <strong>{c.hp?.current}/{c.hp?.max}</strong>
      </div>

      <div className="gm-attrs">
        {ATTR_KEYS.map((k) => (
          <span key={k} className={`gm-attr${c[k]?.current < c[k]?.max ? ' lowered' : ''}${c[k]?.current === 0 ? ' zero' : ''}`}>
            {t(`attr.${k}`)} <b>{c[k]?.current}</b>{c[k]?.current < c[k]?.max ? `/${c[k].max}` : ''}
          </span>
        ))}
        <span className="gm-attr"><IconCoins size={12} /> <b>{c.gp ?? 0}</b></span>
        <span className="gm-attr">{t('item.armor')} <b>{armorOf(c)}</b></span>
        <span className="gm-attr">{used}/10</span>
      </div>

      {conditions.length || c.scars?.length ? (
        <div className="gm-chips">
          {conditions.map((cd) => <span key={cd.itemId} className="chip chip-small">{loc(cd.name, lang)}</span>)}
          {(c.scars || []).map((s, i) => <span key={i} className="chip chip-small chip-scar">#{s.index} {s.name}</span>)}
        </div>
      ) : null}

      <div className="gm-actions">
        <input type="number" min="0" max="99" value={amount} onChange={(e) => setAmount(e.target.value)} className="gm-amt" />
        <select className="text-input gm-sel" value={dmgTarget} onChange={(e) => setDmgTarget(e.target.value)}>
          <option value="hp">{t('res.hp')}</option>
          {ATTR_KEYS.map((k) => <option key={k} value={k}>{t(`attr.${k}`)}</option>)}
        </select>
        <button type="button" className="btn btn-bad btn-sm" onClick={() => { send(GM_DAMAGE, { amount: amt, target: dmgTarget }); logg(`−${amt} ${tLabel(dmgTarget)}`, 'bad', true); }}>
          <IconSwords size={13} /> {t('gm.damage')}
        </button>
        <button type="button" className="btn btn-ok btn-sm" onClick={() => { send(GM_HEAL, { amount: amt, target: dmgTarget }); logg(`+${amt} ${tLabel(dmgTarget)}`, 'ok', true); }}>
          <HeartPulse size={13} /> {t('gm.heal')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_GOLD, { amount: amt }); logg(`+${amt} ${t('res.gp')}`); }}>
          <IconCoins size={13} /> +{t('res.gp')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_GOLD, { amount: -amt }); logg(`−${amt} ${t('res.gp')}`); }}>
          <IconCoins size={13} /> −{t('res.gp')}
        </button>
      </div>

      <div className="gm-actions">
        <select className="text-input gm-sel" value={saveAttr} onChange={(e) => setSaveAttr(e.target.value)}>
          {ATTR_KEYS.map((k) => <option key={k} value={k}>{t(`attr.${k}`)}</option>)}
        </select>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_SAVE, { attr: saveAttr }); logg(t('gm.demandedSave', { attr: t(`attr.${saveAttr}`) }), undefined, true); }}>
          <Dices size={13} /> {t('gm.demandSave')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_FATIGUE, {}); logg(t('inv.fatigueAdded'), 'bad', true); }}>
          <IconTriangleAlert size={13} /> {t('inv.addFatigue')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_DEPRIVED, { on: !c.deprived }); logg(c.deprived ? t('gm.deprivedOff') : t('gm.deprivedOn')); }}>
          {c.deprived ? t('gm.deprivedOff') : t('gm.deprivedOn')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_PANICKED, { on: !c.panicked }); logg(c.panicked ? t('gm.panickedOff') : t('gm.panickedOn'), c.panicked ? 'ok' : 'bad'); }}>
          {c.panicked ? t('gm.panickedOff') : t('gm.panickedOn')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_REST, { kind: 'short' }); logg(t('rest.short'), 'ok', true); }}>
          <Moon size={13} /> {t('rest.short')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_REST, { kind: 'night' }); logg(t('rest.night'), 'ok', true); }}>
          <Moon size={13} /> {t('rest.night')}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { send(GM_REST, { kind: 'week' }); logg(t('rest.week'), 'ok', true); }}>
          <Moon size={13} /> {t('rest.week')}
        </button>
      </div>

      <div className="gm-actions">
        <input className="text-input" placeholder={t('gm.whisperPlaceholder')} value={whisper} onChange={(e) => setWhisper(e.target.value)} />
        <button type="button" className="btn btn-sm" disabled={!whisper.trim()} onClick={() => { send(GM_WHISPER, { text: whisper.trim() }); logg(`${t('gm.whispered')}: "${whisper.trim()}"`, 'whisper'); setWhisper(''); }}>
          <MessageCircle size={13} /> {t('gm.whisper')}
        </button>
      </div>

      <button type="button" className="gm-toggle" onClick={() => setOpen((o) => !o)}>
        <ChevronDown size={14} className={open ? 'rot' : ''} /> {t('gm.details')}
      </button>
      {open ? (
        <div className="gm-details">
          <ul className="gm-inv">
            {ALL_SLOTS.map((s) => {
              const ref = c.slots?.[s];
              if (!ref || ref.cont) return null;
              const it = c.items?.[ref.itemId];
              if (!it) return null;
              return <li key={s}>{loc(it.name, lang)}{it.damage ? ` (${toW(it.damage, t('dice.die'))})` : ''}{it.armor ? ` (+${it.armor})` : ''}</li>;
            })}
            {Object.values(c.items || {}).filter((i) => i.petty).map((i) => <li key={i.itemId} className="petty">{loc(i.name, lang)}</li>)}
          </ul>
          {c.notes ? <p className="gm-player-notes">{c.notes}</p> : null}
          <label className="field">
            <span className="field-label">{t('gm.secretNote')}</span>
            <textarea className="notes" rows={2} value={note} onChange={(e) => saveNote(e.target.value)} />
          </label>
        </div>
      ) : null}
    </div>
  );
}
