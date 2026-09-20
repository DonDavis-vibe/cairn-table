import { useEffect, useRef, useState } from 'react';
import {
  Download, Upload, Sparkles, Languages, Monitor, Sun, Moon, CircleHelp,
} from 'lucide-react';
import { useLang, LANGS } from '../i18n/index.jsx';
import { useTheme } from '../useTheme.js';
import {
  blankCharacter, isBlank, normalizeCharacter,
} from '../rules/character.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { downloadCharacter, readCharacterFile } from '../utils/exportImport.js';
import { useMultiplayer } from '../multiplayer/useMultiplayer.js';
import CharacterSheet from './CharacterSheet.jsx';
import CharacterWizard from './CharacterWizard.jsx';
import GmDashboard from './GmDashboard.jsx';
import MultiplayerModal from './MultiplayerModal.jsx';
import ConnectionBadge from './ConnectionBadge.jsx';
import HelpModal from './HelpModal.jsx';
import Footer from './Footer.jsx';
import Mark from './Mark.jsx';

const STORAGE_KEY = 'cairn-table-character-v1';

export default function App() {
  const { t, lang, setLang } = useLang();
  const { theme, cycle: cycleTheme } = useTheme();
  const mp = useMultiplayer();

  const [character, setCharacter] = useState(() => {
    const saved = readJSON(STORAGE_KEY);
    return saved ? normalizeCharacter(saved) : blankCharacter();
  });
  const [toast, setToast] = useState(null);
  const [showWizard, setShowWizard] = useState(() => isBlank(readJSON(STORAGE_KEY)));
  const [showMp, setShowMp] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const toastTimer = useRef(null);
  const fileInput = useRef(null);

  const isGm = mp.role === 'gm';

  const notify = (message, kind = 'info') => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { writeJSON(STORAGE_KEY, character); }, [character]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    if (isBlank(character)) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [character]);

  const onImport = async (file) => {
    if (!file) return;
    try {
      setCharacter(await readCharacterFile(file));
      notify(t('toast.imported'), 'ok');
    } catch {
      notify(t('toast.importFailed'), 'bad');
    }
  };

  const newCharacter = () => {
    if (isBlank(character) || window.confirm(t('confirm.new'))) {
      setCharacter(blankCharacter());
      setShowWizard(true);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Mark size={44} /></span>
          <div>
            <h1 className="brand-title">{t('app.title')}</h1>
            <p className="brand-sub">{t('app.tagline')}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <ConnectionBadge mp={mp} onOpen={() => setShowMp(true)} />
          {!isGm ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={newCharacter}>
                <Sparkles size={16} /> {t('header.new')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => downloadCharacter(character)}>
                <Download size={16} /> {t('header.export')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
                <Upload size={16} /> {t('header.import')}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }}
              />
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost btn-icon-only"
            onClick={cycleTheme}
            aria-label={`${t('header.theme')}: ${t(`theme.${theme}`)}`}
            title={`${t('header.theme')}: ${t(`theme.${theme}`)}`}
          >
            {theme === 'system' ? <Monitor size={16} /> : theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon-only"
            onClick={() => setShowHelp(true)}
            aria-label={t('header.help')}
            title={t('header.help')}
          >
            <CircleHelp size={16} />
          </button>
          <div className="lang-switch" role="group" aria-label={t('header.language')}>
            <Languages size={15} />
            {LANGS.map((l) => (
              <button key={l.code} type="button" className={l.code === lang ? 'active' : ''} onClick={() => setLang(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {isGm
          ? <GmDashboard mp={mp} />
          : <CharacterSheet character={character} setCharacter={setCharacter} mp={mp} notify={notify} />}
      </main>

      <Footer onHelp={() => setShowHelp(true)} />

      {showMp ? <MultiplayerModal mp={mp} onClose={() => setShowMp(false)} /> : null}
      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}

      {showWizard && !isGm ? (
        <CharacterWizard
          onCancel={() => setShowWizard(false)}
          onDone={(c) => {
            setCharacter(c);
            setShowWizard(false);
            notify(t('toast.wizardDone'), 'ok');
          }}
        />
      ) : null}

      {toast ? <div className={`toast toast-${toast.kind}`}>{toast.message}</div> : null}
    </div>
  );
}
