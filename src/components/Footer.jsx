import {
  Github, MessagesSquare, Coffee, BookOpen, ExternalLink,
} from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import {
  REPO_URL, DISCORD_URL, CAIRN_DISCORD_URL, KOFI_URL, LINKS, APP_VERSION,
} from '../config.js';
import Mark from './Mark.jsx';

function Ext({ href, icon: Icon, children }) {
  return (
    <a className="footer-link" href={href} target="_blank" rel="noopener noreferrer">
      {Icon ? <Icon size={14} /> : null}
      {children}
      <ExternalLink size={10} className="footer-link-ext" />
    </a>
  );
}

export default function Footer({ onHelp }) {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Mark size={32} />
          <div>
            <strong>{t('app.title')}</strong>
            <p>{t('footer.blurb')}</p>
            <p className="footer-meta">v{APP_VERSION} · {t('footer.codeLicense')} · {t('footer.rulesLicense')}</p>
          </div>
        </div>

        <nav className="footer-links" aria-label={t('footer.nav')}>
          {onHelp ? <button type="button" className="footer-link" onClick={onHelp}>{t('header.help')}</button> : null}
          <Ext href={LINKS.cairn} icon={BookOpen}>Cairn RPG</Ext>
          <Ext href={LINKS.srd}>Cairn SRD</Ext>
          <Ext href={CAIRN_DISCORD_URL} icon={MessagesSquare}>{t('footer.cairnDiscord')}</Ext>
          <Ext href={DISCORD_URL} icon={MessagesSquare}>{t('footer.discord')}</Ext>
          <Ext href={REPO_URL} icon={Github}>GitHub</Ext>
          <Ext href={KOFI_URL} icon={Coffee}>{t('footer.kofi')}</Ext>
          <a className="footer-link" href="./impressum.html">{t('footer.imprint')}</a>
          <a className="footer-link" href="./datenschutz.html">{t('footer.privacy')}</a>
        </nav>
      </div>

      <p className="footer-legal">{t('footer.storage')} {t('footer.noTracking')}</p>
      <p className="footer-legal">
        Based on <a href={LINKS.cairn} target="_blank" rel="noreferrer">Cairn</a> by Yochai Gal,
        used under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC&nbsp;BY-SA&nbsp;4.0</a>.
        {' '}{t('footer.disclaimer')}
      </p>
    </footer>
  );
}
