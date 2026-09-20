import { useLang, loc } from '../i18n/index.jsx';
import { ATTR_KEYS } from '../rules/character.js';
import { formatLogEntry, entryTone } from '../multiplayer/logFormat.js';

function Member({ m, t, lang }) {
  const pct = m.hp.max > 0 ? Math.round((m.hp.current / m.hp.max) * 100) : 0;
  const tone = m.hp.current <= 0 ? 'bad' : pct <= 50 ? 'warn' : 'ok';
  return (
    <div className="party-member">
      <div className="party-member-head">
        <strong>{m.name || t('gm.unnamed')}</strong>
        {m.background ? <span className="party-bg">{m.background}</span> : null}
        {m.critical ? <span className="badge badge-dmg">{t('res.critical')}</span> : null}
        {m.panicked ? <span className="badge badge-dmg">{t('res.panicked')}</span> : null}
        {m.deprived ? <span className="badge">{t('res.deprived')}</span> : null}
        {m.dex.current === 0 ? <span className="badge badge-dmg">{t('res.paralyzed')}</span> : null}
        {m.wil.current === 0 ? <span className="badge badge-dmg">{t('res.delirious')}</span> : null}
      </div>
      <div className={`party-hp party-hp-${tone}`}>
        <span>{t('res.hpAbbr')}</span>
        <div className="hp-bar"><span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
        <strong>{m.hp.current}/{m.hp.max}</strong>
      </div>
      <div className="party-attrs">
        {ATTR_KEYS.map((k) => (
          <span key={k} className={`party-attr${m[k].current < m[k].max ? ' lowered' : ''}${m[k].current === 0 ? ' zero' : ''}`}>
            {t(`attr.${k}`)} <b>{m[k].current}</b>{m[k].current < m[k].max ? `/${m[k].max}` : ''}
          </span>
        ))}
      </div>
      {m.conditions?.length ? (
        <div className="party-chips">
          {m.conditions.map((cd, i) => <span key={i} className="chip chip-small">{loc(cd, lang)}</span>)}
        </div>
      ) : null}
    </div>
  );
}

export default function PartyView({ mp }) {
  const { t, lang } = useLang();
  const members = mp.partyMembers || [];
  const log = mp.partyLog ? (mp.liveLog || []) : [];

  return (
    <div className="party-view">
      {members.length === 0 ? (
        <p className="stash-empty">{t('party.alone')}</p>
      ) : (
        <div className="party-members">
          {members.map((m) => <Member key={m.id} m={m} t={t} lang={lang} />)}
        </div>
      )}

      {mp.partyLog ? (
        <div className="party-log-wrap">
          <span className="field-label">{t('gm.log')}</span>
          <ul className="dice-log">
            {log.length === 0 ? <li className="dice-log-empty">{t('gm.logEmpty')}</li> : null}
            {log.map((e) => (
              <li key={e.id} className={`dice-log-${entryTone(e)}`}>{formatLogEntry(e, t)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
