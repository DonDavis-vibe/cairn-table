import { Scroll, Crown, Users } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Modal } from './ui.jsx';
import art from '../assets/vg-torch.jpg';

// Einmalige Willkommensseite (Yochai Gal: "a welcome page that goes away
// after the first time — what this tool is and what it can do; people can
// X out"). Zwingt nichts auf: Bogen bauen, Warden hosten oder einfach
// umschauen. Danach nie wieder; die Hilfe bleibt jederzeit erreichbar.
const FEATURES = [
  { key: 'sheet', Icon: Scroll },
  { key: 'warden', Icon: Crown },
  { key: 'together', Icon: Users },
];

export default function WelcomeModal({ onClose, onPlayer, onWarden }) {
  const { t } = useLang();
  return (
    <Modal title={t('welcome.title')} onClose={onClose} wide>
      <div className="welcome">
        <img className="welcome-art" src={art} alt="" width="150" />
        <p className="welcome-intro">{t('welcome.intro')}</p>
        <ul className="welcome-features">
          {FEATURES.map(({ key, Icon }) => (
            <li key={key}>
              <Icon size={18} className="welcome-icon" />
              <div>
                <strong>{t(`welcome.${key}.title`)}</strong>
                <p>{t(`welcome.${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="welcome-storage">{t('welcome.storage')}</p>
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={onPlayer}>{t('welcome.cta.player')}</button>
          <button type="button" className="btn" onClick={onWarden}>{t('welcome.cta.warden')}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('welcome.cta.look')}</button>
        </div>
        <p className="welcome-foot">{t('welcome.once')}</p>
      </div>
    </Modal>
  );
}
