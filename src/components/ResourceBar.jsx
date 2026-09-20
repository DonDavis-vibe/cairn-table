import { Zap, Brain } from 'lucide-react';
import {
  IconShield, IconCoins, IconTriangleAlert, IconHeartCrack, IconGhost,
} from './icons.jsx';
import { useLang } from '../i18n/index.jsx';
import { Stepper, InfoHint } from './ui.jsx';
import { effectiveMaxHp, freeSlots, goldSlots } from '../rules/character.js';

const GOLD_THRESHOLD = 100;

export default function ResourceBar({ character, onChange }) {
  const { t } = useLang();
  const effMax = effectiveMaxHp(character);
  const hpPct = character.hp.max > 0 ? Math.round((character.hp.current / character.hp.max) * 100) : 0;
  const tone = character.hp.current <= 0 ? 'bad' : hpPct <= 50 ? 'warn' : 'ok';
  const free = freeSlots(character);
  const goldRuleOn = (character.goldSlotThreshold || 0) > 0;
  const gSlots = goldSlots(character);

  return (
    <div className="resbar">
      <div className={`res res-hp res-${tone}`}>
        <div className="hp-head">
          <IconShield size={17} />
          <span className="hp-label">{t('res.hp')} <em>({t('res.hpAbbr')})</em></span>
          <InfoHint text={t('res.hpInfo')} />
          <span className="hp-big">{character.hp.current}<i>/{character.hp.max}</i></span>
        </div>
        <div className="hp-bar"><span style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }} /></div>
        <div className="hp-foot">
          <div className="res-nums">
            <Stepper value={character.hp.current} min={0} max={character.hp.max} label={t('res.hp')}
              onChange={(current) => onChange({ hp: { ...character.hp, current } })} />
            <span className="res-sep">/</span>
            <Stepper value={character.hp.max} min={0} max={30} label={`${t('res.hp')} ${t('attr.max')}`}
              onChange={(max) => onChange({ hp: { max, current: Math.min(character.hp.current, max) } })} />
          </div>
          {character.panicked && character.hp.max > 0
            ? <p className="res-warn">{t('res.hpPanicked')}</p>
            : effMax === 0 && character.hp.max > 0
              ? <p className="res-warn">{t('res.hpCapped')}</p>
              : <p className="res-slots">{t('res.slotsFree', { n: free })}</p>}
        </div>
      </div>

      <div className="res-sub">
        <div className="res res-gp">
          <div className="res-head"><IconCoins size={15} /> <span>{t('res.gp')}</span><InfoHint text={t('res.gpInfo')} /></div>
          <Stepper value={character.gp} min={0} max={100000} label={t('res.gp')} onChange={(gp) => onChange({ gp })} />
          <label className={`flag flag-small${goldRuleOn ? ' flag-on' : ''}`}>
            <input
              type="checkbox"
              checked={goldRuleOn}
              onChange={(e) => onChange({ goldSlotThreshold: e.target.checked ? GOLD_THRESHOLD : 0 })}
            />
            {t('res.goldSlots')}
            <InfoHint text={t('res.goldSlotsInfo')} />
          </label>
          {goldRuleOn && gSlots > 0 ? <p className="res-slots">{t('res.goldSlotsHint', { n: gSlots })}</p> : null}
        </div>

        <div className="res res-flags">
          <label className={`flag${character.deprived ? ' flag-on' : ''}`}>
            <input type="checkbox" checked={!!character.deprived} onChange={(e) => onChange({ deprived: e.target.checked })} />
            <IconTriangleAlert size={14} /> {t('res.deprived')}
            <InfoHint text={t('res.deprivedInfo')} />
          </label>
          <label className={`flag${character.critical ? ' flag-bad' : ''}`}>
            <input type="checkbox" checked={!!character.critical} onChange={(e) => onChange({ critical: e.target.checked })} />
            <IconHeartCrack size={14} /> {t('res.critical')}
            <InfoHint text={t('res.criticalInfo')} />
            {character.critical ? (
              <button
                type="button"
                className="chip chip-small chip-cast"
                onClick={(e) => { e.preventDefault(); onChange({ critical: false }); }}
              >
                {t('res.stabilize')}
              </button>
            ) : null}
          </label>
          <label className={`flag${character.panicked ? ' flag-bad' : ''}`}>
            <input type="checkbox" checked={!!character.panicked} onChange={(e) => onChange({ panicked: e.target.checked })} />
            <IconGhost size={14} /> {t('res.panicked')}
            <InfoHint text={t('res.panickedInfo')} />
          </label>
          {character.dex.current === 0 ? (
            <span className="flag flag-bad">
              <Zap size={14} /> {t('res.paralyzed')}
              <InfoHint text={t('res.paralyzedInfo')} />
            </span>
          ) : null}
          {character.wil.current === 0 ? (
            <span className="flag flag-bad">
              <Brain size={14} /> {t('res.delirious')}
              <InfoHint text={t('res.deliriousInfo')} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
