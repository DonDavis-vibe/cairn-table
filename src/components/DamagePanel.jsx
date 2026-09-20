import { useState } from 'react';
import { Plus, HeartPulse } from 'lucide-react';
import { IconSwords } from './icons.jsx';
import { useLang } from '../i18n/index.jsx';
import { ATTR_KEYS } from '../rules/character.js';
import { resolveDamage, resolveAttributeDamage, heal } from '../rules/combat.js';
import { shareEvent } from '../utils/discord.js';

export default function DamagePanel({ character, setCharacter, pushLog, onEvent = null, onPrompt = () => {} }) {
  const { t } = useLang();
  const [amount, setAmount] = useState(1);
  const [attr, setAttr] = useState('str');
  const who = character.name || t('app.title');

  const amt = Math.max(0, Number(amount) || 0);

  const takeHpDamage = () => {
    const r = resolveDamage(character, amt);
    setCharacter(r.character);

    if (r.death) {
      pushLog({ kind: 'bad', text: `☠ ${t('combat.dead')} — ${t(r.log.key, r.log.vars)}` });
    } else if (r.scar) {
      pushLog({ kind: 'bad', text: t('combat.scarRolled', { n: r.scar.hpLost }) });
      onPrompt({ kind: 'scar', hpLost: r.scar.hpLost });
    } else if (r.strSave) {
      pushLog({ kind: 'warn', text: t(r.log.key, r.log.vars) });
      onPrompt({ kind: 'save', target: r.strSave.target });
    } else {
      pushLog({ kind: 'bad', text: `−${amt} ${t('res.hp')} → ${r.character.hp.current}` });
    }
    shareEvent(who, `🩸 −${amt} ${t('res.hp')}`, 'bad');
    onEvent?.({ kind: 'damage', amount: amt, target: 'hp' });
  };

  const takeAttrDamage = () => {
    const r = resolveAttributeDamage(character, attr, amt);
    setCharacter(r.character);
    pushLog({ kind: 'bad', text: `−${amt} ${t(`attr.${attr}`)} → ${r.character[attr].current}${r.zero ? ` · ${t(`combat.zero.${attr}`)}` : ''}` });
    shareEvent(who, `🩸 −${amt} ${t(`attr.${attr}`)}${r.zero ? ` · ${t(`combat.zero.${attr}`)}` : ''}`, 'bad');
    onEvent?.({ kind: 'damage', amount: amt, target: attr });
  };

  const doHeal = (target) => {
    if (character.deprived) { pushLog({ kind: 'warn', text: t('combat.noHealDeprived') }); return; }
    setCharacter((c) => heal(c, target, amt));
    pushLog({ kind: 'ok', text: `+${amt} ${target === 'hp' ? t('res.hp') : t(`attr.${target}`)}` });
    shareEvent(who, `💚 +${amt} ${target === 'hp' ? t('res.hp') : t(`attr.${target}`)}`, 'ok');
    onEvent?.({ kind: 'heal', amount: amt, target });
  };

  return (
    <div className="dmgpanel">
      <label className="dmg-amount">
        {t('combat.amount')}
        <input type="number" min="0" max="99" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>

      <div className="dmg-row">
        <button type="button" className="btn btn-bad" onClick={takeHpDamage}>
          <IconSwords size={15} /> {t('combat.hpDamage')}
        </button>
        <span className="dmg-hint">{t('combat.hpDamageHint')}</span>
      </div>

      <div className="dmg-row">
        <select className="text-input" value={attr} onChange={(e) => setAttr(e.target.value)}>
          {ATTR_KEYS.map((k) => <option key={k} value={k}>{t(`attr.${k}`)}</option>)}
        </select>
        <button type="button" className="btn btn-bad" onClick={takeAttrDamage}>
          <IconSwords size={15} /> {t('combat.attrDamage')}
        </button>
        <span className="dmg-hint">{t('combat.attrDamageHint')}</span>
      </div>

      <div className="dmg-row">
        <button type="button" className="btn btn-ok" onClick={() => doHeal('hp')}><HeartPulse size={15} /> {t('res.hp')}</button>
        {ATTR_KEYS.map((k) => (
          <button key={k} type="button" className="btn btn-ok" onClick={() => doHeal(k)}><Plus size={14} /> {t(`attr.${k}`)}</button>
        ))}
      </div>
    </div>
  );
}
