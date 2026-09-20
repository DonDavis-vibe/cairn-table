import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { readPortrait } from '../utils/portrait.js';

export default function Portrait({ src, onChange, editable = false, size = 96 }) {
  const { t } = useLang();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await readPortrait(file));
    } catch {
      /* stilles Scheitern — ungueltiges Bild */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portrait" style={{ '--pf': `${size}px` }}>
      {src
        ? <img src={src} alt="" className="portrait-img" />
        : <span className="portrait-empty" aria-hidden="true">{editable ? <ImagePlus size={size * 0.28} /> : null}</span>}

      {editable ? (
        <>
          <button
            type="button"
            className="portrait-btn"
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-label={t('portrait.upload')}
          >
            <ImagePlus size={14} />
          </button>
          {src ? (
            <button type="button" className="portrait-x" onClick={() => onChange('')} aria-label={t('common.remove')}>
              <X size={12} />
            </button>
          ) : null}
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
          />
        </>
      ) : null}
    </div>
  );
}
