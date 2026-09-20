import { Dices } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { rollSave } from '../rules/dice.js';
import { scarFor } from '../data/scars.js';

// Faelliger Wurf nach Schaden: STÄ-Rettungswurf gegen kritischen Schaden oder
// Wurf auf der Narbentabelle. Wird sowohl vom eigenen Schadensblock als auch von
// einem Warden-Schadensbefehl gefuellt.
export default function CombatPrompt({ prompt, setCharacter, pushLog, onEvent, onClose }) {
  const { t, lang } = useLang();

  if (prompt.kind === 'save') {
    const roll = () => {
      const s = rollSave(prompt.target);
      if (s.ok) {
        pushLog({ kind: 'ok', text: `${t('combat.strSave')} W20 ${s.d} ≤ ${prompt.target} · ${t('dice.success')}` });
      } else {
        setCharacter((c) => ({ ...c, critical: true }));
        pushLog({ kind: 'bad', text: `${t('combat.strSave')} W20 ${s.d} > ${prompt.target} · ${t('dice.fail')} — ${t('res.critical')}` });
      }
      onEvent?.({ kind: 'save', attr: 'str', roll: s.d, target: prompt.target, ok: s.ok, reason: t('combat.criticalShort') });
      onClose();
    };
    return (
      <div className="prompt-card prompt-warn">
        <strong>{t('combat.strSave')} W20 ≤ {prompt.target}</strong>
        <p>{t('combat.strSaveHint')}</p>
        <div className="scar-card-actions">
          <button type="button" className="btn btn-primary" onClick={roll}><Dices size={15} /> {t('dice.roll')}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('common.dismiss')}</button>
        </div>
      </div>
    );
  }

  // kind === 'scar'
  const scar = scarFor(prompt.hpLost);
  const record = () => {
    setCharacter((c) => ({ ...c, scars: [...c.scars, { index: scar.index, name: loc(scar.name, lang), at: Date.now() }] }));
    onEvent?.({ kind: 'scar', index: scar.index, name: loc(scar.name, lang) });
    onClose();
  };
  return (
    <div className="prompt-card prompt-bad">
      <strong>#{scar.index} — {loc(scar.name, lang)}</strong>
      <p>{loc(scar.text, lang)}</p>
      <div className="scar-card-actions">
        <button type="button" className="btn btn-primary" onClick={record}>{t('combat.recordScar')}</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t('common.dismiss')}</button>
      </div>
    </div>
  );
}
