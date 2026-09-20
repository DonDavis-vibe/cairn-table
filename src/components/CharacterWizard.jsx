import { useMemo, useState } from 'react';
import { Dices, ArrowLeftRight, Wand2 } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';
import { rollDie } from '../rules/dice.js';
import { blankCharacter, ATTR_KEYS } from '../rules/character.js';
import { addItem } from '../rules/inventory.js';
import { makeItem } from '../data/items.js';
import { BACKGROUNDS, backgroundByRoll } from '../data/backgrounds.js';
import {
  TRAIT_TABLES, TRAIT_KEYS, BONDS, OMENS, rollAge, rollD20,
} from '../data/tables.js';

const STEPS = 6;
const d6 = () => rollDie(6);
const roll3d6 = () => { const d = [d6(), d6(), d6()]; return { dice: d, value: d[0] + d[1] + d[2] }; };

function gearToItem(entry) {
  if (entry.key) return makeItem(entry.key);
  const o = entry.custom;
  return makeItem(null, {
    name: o.de || o.en ? { de: o.de, en: o.en } : o.name,
    type: o.type || 'gear',
    size: o.petty ? 0 : (o.size || 1),
    damage: o.damage || null,
    armor: o.armor || null,
    usage: o.usage ? { max: o.usage } : null,
  });
}

export default function CharacterWizard({ onDone, onCancel }) {
  const { t, lang } = useLang();
  const [step, setStep] = useState(1);

  const [bgId, setBgId] = useState(BACKGROUNDS[0].id);
  const bg = useMemo(() => BACKGROUNDS.find((b) => b.id === bgId), [bgId]);

  const [subRolls, setSubRolls] = useState([0, 0]); // Index in bg.tables[i].rolls

  const [attrs, setAttrs] = useState(() => ({ str: roll3d6(), dex: roll3d6(), wil: roll3d6() }));
  const [swapA, setSwapA] = useState('str');
  const [swapB, setSwapB] = useState('dex');

  const [hp, setHp] = useState(d6);
  const [gp, setGp] = useState(() => d6() + d6() + d6());
  const [age, setAge] = useState(rollAge);

  const [traitIdx, setTraitIdx] = useState(() => Object.fromEntries(TRAIT_KEYS.map((k) => [k, Math.floor(Math.random() * 10)])));
  const [bondIdx, setBondIdx] = useState(() => rollD20() - 1);
  const [bond2Idx, setBond2Idx] = useState(() => rollD20() - 1);
  const [isYoungest, setIsYoungest] = useState(false);
  const [omenIdx, setOmenIdx] = useState(() => rollD20() - 1);

  const [name, setName] = useState(() => bg.names[Math.floor(Math.random() * bg.names.length)]);

  const wantsOmen = isYoungest || bg.extra?.omenAlways;
  const wantsBond2 = bg.extra?.bondTwice === true || (bg.extra?.bondTwice === 'onSix' && subRolls[0] === 5);

  const pickBackground = (id) => {
    setBgId(id);
    const nb = BACKGROUNDS.find((b) => b.id === id);
    setName(nb.names[Math.floor(Math.random() * nb.names.length)]);
    setSubRolls([0, 0]);
  };
  const rollBackground = () => pickBackground(backgroundByRoll(rollD20()).id);
  const rollSub = (i) => setSubRolls((s) => s.map((v, j) => (j === i ? Math.floor(Math.random() * 6) : v)));

  const doSwap = () => {
    if (swapA === swapB) return;
    setAttrs((a) => ({ ...a, [swapA]: a[swapB], [swapB]: a[swapA] }));
  };

  // Vollständig ausgewürfelter Beispiel-Charakter, sofort fertig.
  const rollExample = () => {
    const eb = backgroundByRoll(rollD20());
    const ea = { str: roll3d6(), dex: roll3d6(), wil: roll3d6() };
    const eSub = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
    const eHp = d6();
    const eGp = d6() + d6() + d6();
    const eAge = rollAge();
    const youngest = Math.random() < 0.5;

    let c = blankCharacter();
    c.name = eb.names[Math.floor(Math.random() * eb.names.length)];
    for (const k of ATTR_KEYS) c[k] = { max: ea[k].value, current: ea[k].value };
    c.hp = { max: eHp, current: eHp };
    c.gp = eGp;
    c.age = eAge;
    c.background = loc(eb.name, lang);
    c.traits = Object.fromEntries(TRAIT_KEYS.map((k) => [k, loc(TRAIT_TABLES[k].options[Math.floor(Math.random() * 10)], lang)]));
    c.bond = loc(BONDS[rollD20() - 1], lang);
    if (youngest || eb.extra?.omenAlways) c.omen = loc(OMENS[rollD20() - 1], lang);
    for (const entry of eb.gear) {
      const res = addItem(c, gearToItem(entry));
      if (res.ok) c = res.character;
    }
    const lines = eb.tables.map((tbl, i) => `${loc(tbl.q, lang)} (${eSub[i] + 1}): ${loc(tbl.rolls[eSub[i]], lang)}`);
    const wantsB2 = eb.extra?.bondTwice === true || (eb.extra?.bondTwice === 'onSix' && eSub[0] === 5);
    if (wantsB2) lines.push(`${t('wizard.bond2')}: ${loc(BONDS[rollD20() - 1], lang)}`);
    c.notes = lines.join('\n');
    onDone(c);
  };

  const finish = () => {
    let c = blankCharacter();
    c.name = name.trim();
    for (const k of ATTR_KEYS) c[k] = { max: attrs[k].value, current: attrs[k].value };
    c.hp = { max: hp, current: hp };
    c.gp = gp;
    c.age = age;
    c.background = loc(bg.name, lang);
    c.traits = Object.fromEntries(TRAIT_KEYS.map((k) => [k, loc(TRAIT_TABLES[k].options[traitIdx[k]], lang)]));
    c.bond = loc(BONDS[bondIdx], lang);
    if (wantsOmen) c.omen = loc(OMENS[omenIdx], lang);

    for (const entry of bg.gear) {
      const res = addItem(c, gearToItem(entry));
      if (res.ok) c = res.character;
    }

    const lines = [];
    bg.tables.forEach((tbl, i) => {
      lines.push(`${loc(tbl.q, lang)} (${subRolls[i] + 1}): ${loc(tbl.rolls[subRolls[i]], lang)}`);
    });
    if (wantsBond2) lines.push(`${t('wizard.bond2')}: ${loc(BONDS[bond2Idx], lang)}`);
    c.notes = lines.join('\n');

    onDone(c);
  };

  const footer = (
    <div className="wizard-nav">
      <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('wizard.cancel')}</button>
      <div className="wizard-nav-right">
        {step === 1 ? (
          <button type="button" className="btn" onClick={rollExample} title={t('wizard.exampleHint')}>
            <Wand2 size={15} /> {t('wizard.example')}
          </button>
        ) : null}
        {step > 1 ? <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>{t('wizard.back')}</button> : null}
        {step < STEPS
          ? <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>{t('wizard.next')}</button>
          : <button type="button" className="btn btn-primary" disabled={name.trim().length < 1} onClick={finish}>{t('wizard.finish')}</button>}
      </div>
    </div>
  );

  return (
    <Modal title={t('wizard.title')} onClose={onCancel} footer={footer} wide>
      <p className="wizard-step">{t('wizard.step', { n: step, total: STEPS })}</p>

      {step === 1 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.background')}</h3>
          <div className="dice-row">
            <select className="text-input" value={bgId} onChange={(e) => pickBackground(e.target.value)}>
              {BACKGROUNDS.map((b, i) => <option key={b.id} value={b.id}>{i + 1}. {loc(b.name, lang)}</option>)}
            </select>
            <button type="button" className="btn" onClick={rollBackground}><Dices size={15} /> {t('wizard.rollD20')}</button>
          </div>
          <p className="wizard-blurb">{loc(bg.blurb, lang)}</p>
          <div className="grants">
            <span className="grants-label">{t('wizard.startingGear')}</span>
            <ul>
              <li>{t('wizard.gold3d6')}</li>
              {bg.gear.map((e, i) => <li key={i}>{loc(gearToItem(e).name, lang)}</li>)}
            </ul>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.bgTables')}</h3>
          {bg.tables.map((tbl, i) => (
            <div key={i} className="grants">
              <span className="grants-label">{loc(tbl.q, lang)}</span>
              <p className="wizard-sub-result"><strong>{subRolls[i] + 1}.</strong> {loc(tbl.rolls[subRolls[i]], lang)}</p>
              <button type="button" className="btn btn-ghost" onClick={() => rollSub(i)}><Dices size={14} /> {t('wizard.rollD6')}</button>
            </div>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.attributes')}</h3>
          <p className="hint">{t('wizard.attributesHint')}</p>
          <div className="roll-row">
            {ATTR_KEYS.map((k) => (
              <div key={k} className="roll-box">
                <span>{t(`attr.${k}`)}</span>
                <strong>{attrs[k].value}</strong>
                <span className="roll-dice">{attrs[k].dice.join(' ')}</span>
              </div>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setAttrs({ str: roll3d6(), dex: roll3d6(), wil: roll3d6() })}>
            <Dices size={15} /> {t('wizard.rerollAll')}
          </button>
          <div className="swap-row">
            <span className="hint">{t('wizard.swap')}</span>
            <select className="text-input" value={swapA} onChange={(e) => setSwapA(e.target.value)}>
              {ATTR_KEYS.map((k) => <option key={k} value={k}>{t(`attr.${k}`)}</option>)}
            </select>
            <select className="text-input" value={swapB} onChange={(e) => setSwapB(e.target.value)}>
              {ATTR_KEYS.map((k) => <option key={k} value={k}>{t(`attr.${k}`)}</option>)}
            </select>
            <button type="button" className="icon-btn" onClick={doSwap} aria-label={t('wizard.swap')}><ArrowLeftRight size={16} /></button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.numbers')}</h3>
          <div className="roll-row">
            <div className="roll-box"><span>{t('res.hp')}</span><strong>{hp}</strong>
              <button type="button" className="icon-btn" onClick={() => setHp(d6())} aria-label={t('wizard.rollD6')}><Dices size={14} /></button>
            </div>
            <div className="roll-box"><span>{t('res.gp')}</span><strong>{gp}</strong>
              <button type="button" className="icon-btn" onClick={() => setGp(d6() + d6() + d6())} aria-label={t('wizard.roll')}><Dices size={14} /></button>
            </div>
            <div className="roll-box"><span>{t('sheet.age')}</span><strong>{age}</strong>
              <button type="button" className="icon-btn" onClick={() => setAge(rollAge())} aria-label={t('wizard.roll')}><Dices size={14} /></button>
            </div>
          </div>
          <label className="radio-line">
            <input type="checkbox" checked={isYoungest} onChange={(e) => setIsYoungest(e.target.checked)} />
            {t('wizard.youngest')}
          </label>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.traits')}</h3>
          <button type="button" className="btn btn-ghost" onClick={() => setTraitIdx(Object.fromEntries(TRAIT_KEYS.map((k) => [k, Math.floor(Math.random() * 10)])))}>
            <Dices size={14} /> {t('wizard.rerollAll')}
          </button>
          <div className="traits-grid">
            {TRAIT_KEYS.map((k) => (
              <Field key={k} label={loc(TRAIT_TABLES[k].label, lang)}>
                <select className="text-input" value={traitIdx[k]} onChange={(e) => setTraitIdx((s) => ({ ...s, [k]: +e.target.value }))}>
                  {TRAIT_TABLES[k].options.map((o, i) => <option key={i} value={i}>{loc(o, lang)}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <Field label={t('sheet.bond')}>
            <div className="inline-roll">
              <select className="text-input" value={bondIdx} onChange={(e) => setBondIdx(+e.target.value)}>
                {BONDS.map((b, i) => <option key={i} value={i}>{i + 1}. {loc(b, lang).slice(0, 60)}…</option>)}
              </select>
              <button type="button" className="icon-btn" onClick={() => setBondIdx(rollD20() - 1)} aria-label={t('wizard.roll')}><Dices size={16} /></button>
            </div>
          </Field>
          {wantsBond2 ? (
            <Field label={t('wizard.bond2')}>
              <div className="inline-roll">
                <select className="text-input" value={bond2Idx} onChange={(e) => setBond2Idx(+e.target.value)}>
                  {BONDS.map((b, i) => <option key={i} value={i}>{i + 1}. {loc(b, lang).slice(0, 60)}…</option>)}
                </select>
                <button type="button" className="icon-btn" onClick={() => setBond2Idx(rollD20() - 1)} aria-label={t('wizard.roll')}><Dices size={16} /></button>
              </div>
            </Field>
          ) : null}
          {wantsOmen ? (
            <Field label={t('sheet.omen')} hint={t('wizard.omenHint')}>
              <div className="inline-roll">
                <select className="text-input" value={omenIdx} onChange={(e) => setOmenIdx(+e.target.value)}>
                  {OMENS.map((o, i) => <option key={i} value={i}>{i + 1}. {loc(o, lang).slice(0, 60)}…</option>)}
                </select>
                <button type="button" className="icon-btn" onClick={() => setOmenIdx(rollD20() - 1)} aria-label={t('wizard.roll')}><Dices size={16} /></button>
              </div>
            </Field>
          ) : null}
        </div>
      ) : null}

      {step === 6 ? (
        <div className="wizard-pane">
          <h3 className="sub-h">{t('wizard.review')}</h3>
          <Field label={t('sheet.name')}>
            <div className="inline-roll">
              <TextInput value={name} onChange={setName} />
              <button type="button" className="icon-btn" onClick={() => setName(bg.names[Math.floor(Math.random() * bg.names.length)])} aria-label={t('wizard.roll')}><Dices size={16} /></button>
            </div>
          </Field>
          <ul className="review-list">
            <li>{loc(bg.name, lang)} · {t('sheet.age')} {age}</li>
            <li>{ATTR_KEYS.map((k) => `${t(`attr.${k}`)} ${attrs[k].value}`).join(' · ')}</li>
            <li>{t('res.hp')} {hp} · {t('res.gp')} {gp}</li>
            <li>{bg.gear.length} {t('wizard.gearItems')} · {gp} {t('res.gp')}</li>
          </ul>
        </div>
      ) : null}
    </Modal>
  );
}
