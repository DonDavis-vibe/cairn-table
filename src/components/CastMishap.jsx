import { useLang } from '../i18n/index.jsx';
import { mishapOptions, destroyBook, mishapInjury } from '../rules/casting.js';
import { giveFatigue } from '../rules/fatigue.js';

// Folgen eines misslungenen WIL-Rettungswurfs beim Zaubern (Cairn 2e, Casting Spells):
// im Verhaeltnis zum Zauber — zusaetzliche Erschoepfung, zerstoertes Zauberbuch,
// Verletzung, sogar Tod. Der Warden entscheidet; hier stehen die Knoepfe dafuer.
export default function CastMishap({ mishap, character, setCharacter, pushLog, onEvent, onClose }) {
  const { t } = useLang();

  const say = (kind, text) => {
    pushLog({ kind, text });
    onEvent?.({ kind: 'note', text });
  };

  const apply = (option) => {
    if (option === 'fatigue') {
      const f = giveFatigue(character);
      setCharacter(f.character);
      say('bad', f.placed ? t('inv.castMishap.fatigue') : t('inv.fatigueOwed'));
    } else if (option === 'destroy') {
      setCharacter(destroyBook(character, mishap.itemId));
      say('bad', t('inv.castMishap.destroyed', { name: mishap.name }));
    } else if (option === 'injury') {
      const r = mishapInjury(character);
      setCharacter(r.character);
      say('bad', t('inv.castMishap.injury', { n: r.d, str: r.character.str.current }) + (r.zero ? ` · ${t('combat.zero.str')}` : ''));
    }
    onClose();
  };

  const options = mishapOptions(mishap.kind).filter((o) => o !== 'destroy' || character.items[mishap.itemId]);

  return (
    <div className="prompt-card prompt-bad">
      <strong>{t('inv.castMishap.title', { name: mishap.name })}</strong>
      <p>{t('inv.castMishap.hint')}</p>
      <div className="scar-card-actions">
        {options.map((o) => (
          <button key={o} type="button" className="btn btn-sm btn-bad" onClick={() => apply(o)}>{t(`inv.castMishap.opt.${o}`)}</button>
        ))}
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>{t('inv.castMishap.none')}</button>
      </div>
    </div>
  );
}
