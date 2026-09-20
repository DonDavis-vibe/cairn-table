import { useEffect, useState } from 'react';
import { Copy, Check, Megaphone, Dices } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { Panel } from './ui.jsx';
import { rollDie, rollReaction, rollDieOfFate } from '../rules/dice.js';
import { GM_BROADCAST } from '../multiplayer/protocol.js';
import { formatLogEntry, entryTone } from '../multiplayer/logFormat.js';
import { shareRoll, shareEvent } from '../utils/discord.js';
import GmPlayerCard from './GmPlayerCard.jsx';
import GmCombatTracker from './GmCombatTracker.jsx';
import GmGenerators from './GmGenerators.jsx';
import Stash from './Stash.jsx';
import Containers from './Containers.jsx';
import MapPanel from './MapPanel.jsx';
import emptyLobby from '../assets/vg-barrow.jpg';

function inviteLink(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = '';
  return url.toString();
}

export default function GmDashboard({ mp }) {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const [shout, setShout] = useState('');

  const entries = Object.entries(mp.players);

  const { stashEvent, clearStashEvent, logGmAction } = mp;
  useEffect(() => {
    if (!stashEvent) return;
    const { kind, playerName, item } = stashEvent;
    const key = kind === 'add' ? 'stash.log.added' : 'stash.log.took';
    logGmAction({ text: `${playerName} ${t(key, { item: loc(item.name, lang) })}`, cmd: 'gm', tone: 'gm' });
    clearStashEvent();
  }, [stashEvent, clearStashEvent, logGmAction, t, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(mp.roomCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const gmRoll = (label, fn) => {
    const r = fn();
    mp.logGmAction({ text: `${t('gm.warden')}: ${label} — ${r}`, tone: 'gm', cmd: 'gm' });
    shareRoll(t('gm.warden'), label, r);
  };

  return (
    <div className="gm-dash">
      <Panel title={t('gm.title')}>
        <div className="gm-room-row">
          <span className="mp-room-label">{t('mp.roomCode')}</span>
          <strong className="mp-room-code">{mp.roomCode}</strong>
          <span className={`mp-dot ${mp.roomOnline ? 'on' : 'off'}`}>{mp.roomOnline ? t('mp.roomOnline') : t('mp.roomOffline')}</span>
          <button type="button" className="btn btn-sm" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {t('mp.copyLink')}
          </button>
          <span className="gm-count">{t('mp.playersConnected', { n: entries.length })}</span>
        </div>
        <div className="gm-room-row">
          <input className="text-input" placeholder={t('gm.shoutPlaceholder')} value={shout} onChange={(e) => setShout(e.target.value)} />
          <button type="button" className="btn btn-sm" disabled={!shout.trim()} onClick={() => { mp.sendGmCommand(null, { cmd: GM_BROADCAST, text: shout.trim() }); mp.logGmAction({ text: `${t('gm.announced')}: "${shout.trim()}"`, cmd: 'gm' }); shareEvent(t('gm.warden'), `📣 ${shout.trim()}`, 'info'); setShout(''); }}>
            <Megaphone size={14} /> {t('gm.announce')}
          </button>
        </div>
        <div className="gm-room-row">
          <span className="field-label">{t('sheet.dice')}:</span>
          <button type="button" className="btn btn-sm" onClick={() => gmRoll('W20', () => rollDie(20))}><Dices size={13} /> W20</button>
          <button type="button" className="btn btn-sm" onClick={() => gmRoll('W6', () => rollDie(6))}><Dices size={13} /> W6</button>
          <button type="button" className="btn btn-sm" onClick={() => gmRoll(t('dice.reaction'), () => { const x = rollReaction(); return `${x.dice.join('+')} · ${t(`reaction.${x.key}`)}`; })}>{t('dice.reaction')}</button>
          <button type="button" className="btn btn-sm" onClick={() => gmRoll(t('dice.fate'), () => { const x = rollDieOfFate(); return `${x.d} · ${x.favorsPcs ? t('dice.fateGood') : t('dice.fateBad')}`; })}>{t('dice.fate')}</button>
        </div>
        <label className="radio-line">
          <input type="checkbox" checked={mp.partyLog} onChange={(e) => mp.setPartyLogShared(e.target.checked)} />
          {t('mp.sharePartyLog')}
        </label>
      </Panel>

      <Panel title={t('gm.combat')}>
        <GmCombatTracker mp={mp} />
      </Panel>

      <Panel title={t('map.title')}>
        <MapPanel mp={mp} />
      </Panel>

      <Panel title={t('stash.title')}>
        <Stash mp={mp} />
      </Panel>

      <Panel title={t('container.title')}>
        <Containers mp={mp} />
      </Panel>

      <Panel title={t('gen.title')}>
        <GmGenerators mp={mp} />
      </Panel>

      <Panel title={t('gm.log')} className="panel-dice">
        <ul className="dice-log gm-log">
          {mp.liveLog.length === 0 ? <li className="dice-log-empty">{t('gm.logEmpty')}</li> : null}
          {mp.liveLog.map((e) => (
            <li key={e.id} className={`dice-log-${entryTone(e)}`}>{formatLogEntry(e, t)}</li>
          ))}
        </ul>
      </Panel>

      {entries.length === 0 ? (
        <Panel title={t('gm.party')}>
          <div className="gm-empty">
            <img src={emptyLobby} alt="" width="200" />
            <p>{t('gm.noPlayers')}</p>
          </div>
        </Panel>
      ) : (
        <div className="gm-cards">
          {entries.map(([peerId, p]) => (
            <GmPlayerCard key={peerId} peerId={peerId} character={p.character} mp={mp} />
          ))}
        </div>
      )}
    </div>
  );
}
