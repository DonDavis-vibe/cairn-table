import { Dices } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Stepper } from './ui.jsx';

// Ein Attribut: aktueller Wert (durch kritischen Schaden gesenkt) + Maximum.
export default function AttributeBox({ attrKey, data, onChange, onSave }) {
  const { t } = useLang();
  const lowered = data.current < data.max;

  return (
    <div className={`attr-box${lowered ? ' attr-lowered' : ''}${data.current === 0 ? ' attr-zero' : ''}`}>
      <button type="button" className="attr-name" onClick={onSave} title={t('dice.saveVs', { attr: t(`attr.${attrKey}`) })}>
        {t(`attr.${attrKey}`)} <Dices size={13} />
      </button>
      <div className="attr-current">{data.current}</div>
      <label className="attr-max">
        <span>{t('attr.max')}</span>
        <Stepper
          value={data.max}
          min={0}
          max={30}
          label={`${t(`attr.${attrKey}`)} ${t('attr.max')}`}
          onChange={(max) => onChange({ max, current: Math.min(data.current, max) })}
        />
      </label>
      <label className="attr-cur-edit">
        <span>{t('attr.current')}</span>
        <Stepper
          value={data.current}
          min={0}
          max={data.max}
          label={`${t(`attr.${attrKey}`)} ${t('attr.current')}`}
          onChange={(current) => onChange({ current })}
        />
      </label>
    </div>
  );
}
