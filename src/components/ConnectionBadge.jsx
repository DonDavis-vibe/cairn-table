import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';

export default function ConnectionBadge({ mp, onOpen }) {
  const { t } = useLang();

  if (!mp.role) {
    return (
      <button type="button" className="btn btn-ghost" onClick={onOpen}>
        <Radio size={16} /> {t('mp.badge.solo')}
      </button>
    );
  }

  const connected = mp.connectionState === 'connected' && (mp.role !== 'gm' || mp.roomOnline);
  const label = mp.role === 'gm'
    ? t('mp.badge.warden', { code: mp.roomCode })
    : t('mp.badge.player', { code: mp.roomCode });

  return (
    <button type="button" className={`btn conn-badge conn-${connected ? 'on' : 'off'}`} onClick={onOpen}>
      {connected ? <Wifi size={15} /> : <WifiOff size={15} />} {label}
      {mp.role === 'gm' ? <span className="conn-count">{Object.keys(mp.players).length}</span> : null}
    </button>
  );
}
