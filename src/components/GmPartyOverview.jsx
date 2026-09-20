import { useLang } from '../i18n/index.jsx';

// Kompakte Uebersicht aller verbundenen Spieler:innen, nebeneinander statt
// untereinander — bewusst viel schlanker als die ausfuehrlichen GmPlayerCards
// (Eingriffs-Knoepfe, Attribute usw.), damit der Warden auch bei vielen
// Spielenden auf einen Blick den Zustand der Gruppe sieht.
function Card({ c, t }) {
  const hp = c.hp || { current: 0, max: 0 };
  const pct = hp.max > 0 ? Math.round((hp.current / hp.max) * 100) : 0;
  const tone = hp.current <= 0 ? 'bad' : pct <= 50 ? 'warn' : 'ok';
  const flagged = c.critical || c.panicked || c.deprived || c.dex?.current === 0 || c.wil?.current === 0;
  return (
    <div className="gm-ov-card">
      <span className="gm-ov-name">{c.name?.trim() || t('gm.unnamed')}</span>
      <span className={`gm-ov-hp gm-ov-hp-${tone}`}>
        <span className="hp-bar gm-ov-bar"><span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span>
        {hp.current}/{hp.max}
      </span>
      {flagged ? (
        <span className="gm-ov-flags">
          {c.critical ? <span className="badge badge-dmg">{t('res.critical')}</span> : null}
          {c.panicked ? <span className="badge badge-dmg">{t('res.panicked')}</span> : null}
          {c.deprived ? <span className="badge">{t('res.deprived')}</span> : null}
          {c.dex?.current === 0 ? <span className="badge badge-dmg">{t('res.paralyzed')}</span> : null}
          {c.wil?.current === 0 ? <span className="badge badge-dmg">{t('res.delirious')}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

export default function GmPartyOverview({ players }) {
  const { t } = useLang();
  const entries = Object.entries(players || {});
  if (entries.length === 0) return <p className="stash-empty">{t('gm.noPlayers')}</p>;
  return (
    <div className="gm-ov-list">
      {entries.map(([peerId, p]) => <Card key={peerId} c={p.character || {}} t={t} />)}
    </div>
  );
}
