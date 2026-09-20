import { useState } from 'react';
import { Dices, Sparkle, Users } from 'lucide-react';
import { IconSwords } from './icons.jsx';
import { useLang } from '../i18n/index.jsx';
import { ATTR_KEYS } from '../rules/character.js';
import {
  rollSave, rollDamage, rollDieOfFate, rollReaction, DAMAGE_DICE,
} from '../rules/dice.js';
import { shareRoll, shareSave } from '../utils/discord.js';
import { DiceStage, DieGlyph } from './DiceKit.jsx';

let rollSeq = 0;
const nextRollId = () => { rollSeq += 1; return rollSeq; };

export default function DiceRoller({ character, log, pushLog, onEvent = null }) {
  const { t } = useLang();
  const who = character.name || t('app.title');
  const [dmgDie, setDmgDie] = useState('d6');
  const [dmgMode, setDmgMode] = useState('normal');
  const [attackers, setAttackers] = useState(1);
  const [armor, setArmor] = useState(0);
  const [stage, setStage] = useState(null);

  const save = (attr) => {
    const r = rollSave(character[attr].current);
    pushLog({
      kind: r.ok ? 'ok' : 'bad',
      text: `${t('dice.saveVs', { attr: t(`attr.${attr}`) })} — W20 ${r.d} ${r.ok ? '≤' : '>'} ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}${r.nat1 ? ' ✦' : ''}${r.nat20 ? ' ✗' : ''}`,
    });
    setStage({
      id: nextRollId(),
      label: `${t(`attr.${attr}`)} ${t('dice.saveShort')}`,
      value: r.d,
      max: 20,
      tone: r.ok ? 'ok' : 'bad',
      verdict: `${r.ok ? t('dice.success') : t('dice.fail')}${r.nat1 ? ' ✦' : ''}${r.nat20 ? ' ✗' : ''}`,
    });
    shareSave(who, t(`attr.${attr}`), r.d, r.target, r.ok);
    onEvent?.({ kind: 'save', attr, roll: r.d, target: r.target, ok: r.ok });
  };

  // Panik (Procedures -> Panic): "all of their attacks are impaired" — kein
  // wählbarer Zustand, überstimmt die Angriffsart-Auswahl fest.
  const effDmgMode = character.panicked ? 'impaired' : dmgMode;

  const damage = () => {
    const r = rollDamage(dmgDie, { mode: effDmgMode, attackers: Number(attackers) || 1, armor: Number(armor) || 0 });
    const dieLabel = r.mode === 'impaired' ? 'W4' : r.mode === 'enhanced' ? 'W12' : dmgDie.replace('d', 'W');
    const rolls = r.pool.map((p) => p.roll).join('/');
    const armorPart = r.armor > 0 ? ` − ${r.armor} ${t('dice.armor')}` : '';
    const text = `${dieLabel}${Number(attackers) > 1 ? `×${attackers}` : ''} — [${rolls}]${armorPart} = ${r.final}`;
    pushLog({ kind: 'roll', text: `${t('dice.damage')} ${text}` });
    setStage({
      id: nextRollId(),
      label: t('dice.damage'),
      value: r.raw,
      max: r.pool[0].sides,
      die: r.pool.length === 1 ? r.pool[0].sides : null,
      verdict: `${armorPart.trim()}${armorPart ? ' ' : ''}= ${r.final}`.trim(),
      parts: r.pool.length > 1 ? r.pool.map((p) => ({ value: p.roll, label: `W${p.sides}` })) : null,
    });
    shareRoll(who, t('dice.damage'), r.final, text);
    onEvent?.({ kind: 'roll', label: t('dice.damage'), text });
  };

  const fate = () => {
    const r = rollDieOfFate();
    const text = `W6 ${r.d} · ${r.favorsPcs ? t('dice.fateGood') : t('dice.fateBad')}`;
    pushLog({ kind: r.favorsPcs ? 'ok' : 'bad', text: `${t('dice.fate')} — ${text}` });
    setStage({
      id: nextRollId(),
      label: t('dice.fate'),
      value: r.d,
      max: 6,
      die: 6,
      tone: r.favorsPcs ? 'ok' : 'bad',
      verdict: r.favorsPcs ? t('dice.fateGood') : t('dice.fateBad'),
    });
    shareRoll(who, t('dice.fate'), text);
    onEvent?.({ kind: 'roll', label: t('dice.fate'), text });
  };

  const reaction = () => {
    const r = rollReaction();
    const text = `2W6 ${r.dice.join('+')} = ${r.total} · ${t(`reaction.${r.key}`)}`;
    pushLog({ kind: 'roll', text: `${t('dice.reaction')} — ${text}` });
    setStage({
      id: nextRollId(),
      label: t('dice.reaction'),
      value: r.total,
      max: 12,
      verdict: t(`reaction.${r.key}`),
      parts: r.dice.map((d) => ({ value: d, label: 'W6' })),
    });
    shareRoll(who, t('dice.reaction'), text);
    onEvent?.({ kind: 'roll', label: t('dice.reaction'), text });
  };

  return (
    <div className="dice">
      <div className="dice-layout">
        <div className="dice-main">
          <div className="dice-group">
            <div className="dice-row">
              {ATTR_KEYS.map((k) => (
                <button key={k} type="button" className="btn" onClick={() => save(k)}>
                  <Dices size={15} /> {t(`attr.${k}`)} {t('dice.saveShort')}
                </button>
              ))}
            </div>
          </div>

          <div className="dice-group">
            <div className="dice-row dice-damage">
              <select className="text-input" value={dmgDie} onChange={(e) => setDmgDie(e.target.value)} aria-label={t('dice.damageDie')}>
                {DAMAGE_DICE.map((d) => <option key={d} value={d}>{d.replace('d', 'W')}</option>)}
              </select>
              <select
                className="text-input"
                value={effDmgMode}
                disabled={character.panicked}
                onChange={(e) => setDmgMode(e.target.value)}
                aria-label={t('dice.attackMode')}
              >
                <option value="normal">{t('dice.normal')}</option>
                <option value="impaired">{t('dice.impaired')}</option>
                <option value="enhanced">{t('dice.enhanced')}</option>
              </select>
              <label className="mini-num">{t('dice.attackers')}<input type="number" min="1" max="9" value={attackers} onChange={(e) => setAttackers(e.target.value)} /></label>
              <label className="mini-num">{t('dice.armor')}<input type="number" min="0" max="3" value={armor} onChange={(e) => setArmor(e.target.value)} /></label>
              <button type="button" className="btn" onClick={damage}><IconSwords size={15} /> {t('dice.rollDamage')}</button>
            </div>
            {character.panicked ? <span className="dmg-hint">{t('dice.panicImpaired')}</span> : null}
          </div>

          <div className="dice-row">
            <button type="button" className="btn btn-ghost" onClick={fate}><Sparkle size={15} /> {t('dice.fate')}</button>
            <button type="button" className="btn btn-ghost" onClick={reaction}><Users size={15} /> {t('dice.reaction')}</button>
          </div>

          <DiceStage result={stage} idleIcon={<DieGlyph sides={20} />} idleText={t('dice.logEmpty')} />
        </div>

        <div className="dice-side">
          <ul className="dice-log">
            {log.length === 0 ? <li className="dice-log-empty">{t('dice.logEmpty')}</li> : null}
            {log.map((e) => <li key={e.id} className={`dice-log-${e.kind}`}>{e.text}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
