import {
  Flame, Apple, BookOpen, Scroll, Sparkles, Package, Trash2,
} from 'lucide-react';
import { IconSwords, IconShield, IconTriangleAlert } from './icons.jsx';
import { useLang, loc } from '../i18n/index.jsx';
import { toW } from '../rules/dice.js';
import { InfoHint } from './ui.jsx';

const ICONS = {
  weapon: IconSwords, armor: IconShield, light: Flame, ration: Apple, spellbook: BookOpen,
  scroll: Scroll, relic: Sparkles, condition: IconTriangleAlert, valuable: Sparkles, gear: Package,
};

export default function ItemCard({ item, span = 1, onRemove, onToggleUsage, onToggleCleared, onCast }) {
  const { lang, t } = useLang();
  const Icon = ICONS[item.type] || Package;
  const name = loc(item.name, lang);
  const effect = loc(item.effect, lang);
  const recharge = item.recharge ? loc(item.recharge, lang) : '';
  const infoText = recharge ? `${effect}\n\n${t('item.recharge')}: ${recharge}` : effect;
  const isCond = item.type === 'condition';

  return (
    <div className={`item-card item-${item.type}${span === 2 ? ' item-span2' : ''}${item.cleared ? ' item-cleared' : ''}`}>
      <div className="item-top">
        <Icon size={14} className="item-icon" />
        <span className="item-name">{name}</span>
        {infoText ? <InfoHint text={infoText} /> : null}
        {onRemove ? (
          <button type="button" className="item-x" onClick={onRemove} aria-label={t('common.remove')}>
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>

      <div className="item-meta">
        {item.damage ? <span className="badge badge-dmg">{toW(item.damage, t('dice.die'))}</span> : null}
        {item.armor ? <span className="badge badge-armor">+{item.armor} {t('item.armor')}</span> : null}
        {item.size === 2 ? <span className="badge">{t('item.bulky')}</span> : null}
        {item.size === 0 ? <span className="badge">{t('item.petty')}</span> : null}

        {item.usage ? (
          <span className="usage" role="group" aria-label={t('item.usage')}>
            {Array.from({ length: item.usage.max }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`dot${i < item.usage.current ? ' dot-on' : ''}`}
                onClick={() => onToggleUsage?.(i)}
                aria-label={`${t('item.usage')} ${i + 1}`}
              />
            ))}
          </span>
        ) : null}

        {isCond && onToggleCleared ? (
          <button type="button" className="chip chip-small" onClick={onToggleCleared}>
            {item.cleared ? t('item.uncleared') : t('item.cleared')}
          </button>
        ) : null}

        {item.type === 'spellbook' && onCast ? (
          <button type="button" className="chip chip-small chip-cast" onClick={onCast}>{t('item.cast')}</button>
        ) : null}
        {item.type === 'scroll' && onCast ? (
          <button type="button" className="chip chip-small chip-cast" onClick={onCast}>{t('item.useScroll')}</button>
        ) : null}
      </div>
    </div>
  );
}
