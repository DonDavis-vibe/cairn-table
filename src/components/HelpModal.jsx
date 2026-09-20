import { useLang } from '../i18n/index.jsx';
import { Modal } from './ui.jsx';
import { LINKS } from '../config.js';

const SECTIONS = ['what', 'storage', 'sheet', 'inventory', 'dice', 'mp', 'warden', 'map', 'rules'];

export default function HelpModal({ onClose }) {
  const { t } = useLang();
  return (
    <Modal title={t('help.title')} onClose={onClose} wide>
      <p className="help-intro">{t('help.intro')}</p>
      {SECTIONS.map((s, i) => (
        <details key={s} className="help-section" open={i === 0}>
          <summary>{t(`help.${s}.title`)}</summary>
          <p>{t(`help.${s}.body`)}</p>
        </details>
      ))}
      <p className="help-foot">
        <a href={LINKS.cairn} target="_blank" rel="noreferrer">cairnrpg.com</a>
        {' · '}
        <a href={LINKS.srd} target="_blank" rel="noreferrer">Cairn SRD</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
      </p>
    </Modal>
  );
}
