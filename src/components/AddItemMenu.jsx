import { useMemo, useState } from 'react';
import { useLang, loc } from '../i18n/index.jsx';
import { Modal, Field, TextInput } from './ui.jsx';
import {
  ITEM_CATALOG, CATALOG_KEYS, makeItem, makeSpellbook, makeScroll, makeRelic,
} from '../data/items.js';
import { SPELLS } from '../data/spells.js';
import { RELICS } from '../data/relics.js';
import { toW } from '../rules/dice.js';

const TYPE_ORDER = ['weapon', 'armor', 'light', 'ration', 'gear'];

// petty: nur slotlose Gegenstaende — Katalog gefiltert, eigener Gegenstand
// gleich als petty voreingestellt (Yochai: "create petty item" neben den Petty-Slots).
export default function AddItemMenu({ onPick, onClose, petty = false }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('gear'); // gear | spell | relic
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState({ name: '', size: petty ? 0 : 1, type: 'gear', damage: '', armor: '' });

  const needle = q.trim().toLowerCase();

  const groups = useMemo(() => {
    const byType = {};
    for (const key of CATALOG_KEYS) {
      const spec = ITEM_CATALOG[key];
      if (petty && spec.size !== 0) continue;
      const label = `${loc(spec.name, lang)} ${loc(spec.effect, lang)}`.toLowerCase();
      if (needle && !label.includes(needle)) continue;
      (byType[spec.type] ||= []).push(key);
    }
    return byType;
  }, [needle, lang, petty]);

  const spellHits = useMemo(
    () => SPELLS.filter((s) => `${loc(s.name, lang)} ${loc(s.effect, lang)}`.toLowerCase().includes(needle)),
    [needle, lang],
  );
  const relicHits = useMemo(
    () => RELICS.filter((r) => `${loc(r.name, lang)} ${loc(r.effect, lang)}`.toLowerCase().includes(needle)),
    [needle, lang],
  );

  const addCustom = () => {
    if (!custom.name.trim()) return;
    onPick(makeItem(null, {
      nameText: custom.name.trim(),
      name: { de: custom.name.trim(), en: custom.name.trim() },
      type: custom.type,
      size: Number(custom.size),
      damage: custom.damage || null,
      armor: custom.armor ? Number(custom.armor) : null,
    }));
  };

  return (
    <Modal title={petty ? t('inv.addPettyTitle') : t('inv.addItem')} onClose={onClose} wide>
      {petty ? <p className="help-intro">{t('inv.pettyHint')}</p> : null}
      <div className="dice-row" style={{ marginBottom: 12 }}>
        {(petty ? ['gear'] : ['gear', 'spell', 'relic']).map((tp) => (
          <button key={tp} type="button" className={`chip${tab === tp ? ' chip-on' : ''}`} onClick={() => setTab(tp)}>
            {t(`inv.tab.${tp}`)}
          </button>
        ))}
      </div>

      <Field label={t('inv.search')}>
        <TextInput value={q} onChange={setQ} placeholder={t(`inv.searchPlaceholder.${tab}`)} autoFocus />
      </Field>

      {tab === 'gear' ? (
        <>
          {TYPE_ORDER.filter((tp) => groups[tp]?.length).map((tp) => (
            <div key={tp} className="catalog-group">
              <h4>{t(`item.type.${tp}`)}</h4>
              <ul className="catalog-list">
                {groups[tp].map((key) => {
                  const spec = ITEM_CATALOG[key];
                  return (
                    <li key={key}>
                      <button type="button" className="catalog-item" onClick={() => onPick(makeItem(key))}>
                        <span className="catalog-name">{loc(spec.name, lang)}</span>
                        {spec.damage ? <span className="badge badge-dmg">{toW(spec.damage, t('dice.die'))}</span> : null}
                        {spec.armor ? <span className="badge badge-armor">+{spec.armor}</span> : null}
                        {spec.size === 2 ? <span className="badge">{t('item.bulky')}</span> : null}
                        {spec.size === 0 ? <span className="badge">{t('item.petty')}</span> : null}
                        {spec.cost ? <span className="catalog-cost">{spec.cost} gp</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="catalog-group">
            <h4>{t('inv.custom')}</h4>
            <div className="custom-row">
              <TextInput value={custom.name} onChange={(name) => setCustom((c) => ({ ...c, name }))} placeholder={t('inv.customName')} />
              <select className="text-input" value={custom.type} onChange={(e) => setCustom((c) => ({ ...c, type: e.target.value }))}>
                {['gear', 'weapon', 'armor', 'light', 'ration', 'valuable'].map((tp) => (
                  <option key={tp} value={tp}>{t(`item.type.${tp}`)}</option>
                ))}
              </select>
              <select className="text-input" value={custom.size} disabled={petty} onChange={(e) => setCustom((c) => ({ ...c, size: e.target.value }))}>
                <option value={0}>{t('item.petty')}</option>
                <option value={1}>1</option>
                <option value={2}>{t('item.bulky')}</option>
              </select>
              <TextInput value={custom.damage} onChange={(damage) => setCustom((c) => ({ ...c, damage }))} placeholder="d6" />
              <button type="button" className="btn btn-primary" onClick={addCustom}>{t('inv.add')}</button>
            </div>
          </div>
        </>
      ) : null}

      {tab === 'spell' ? (
        <div className="catalog-group">
          <h4>{t('inv.spellPick')}</h4>
          <ul className="spell-list">
            {(needle ? spellHits : SPELLS).map((s) => (
              <li key={s.id} className="spell-row">
                <div className="spell-info">
                  <strong>{loc(s.name, lang)}</strong>
                  <span>{loc(s.effect, lang)}</span>
                </div>
                <div className="spell-actions">
                  <button type="button" className="btn btn-sm" onClick={() => onPick(makeSpellbook(s.id))}>{t('inv.asSpellbook')}</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => onPick(makeScroll(s.id))}>{t('inv.asScroll')}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'relic' ? (
        <div className="catalog-group">
          <h4>{t('inv.relicPick')}</h4>
          <ul className="spell-list">
            {(needle ? relicHits : RELICS).map((r) => (
              <li key={r.id} className="spell-row">
                <div className="spell-info">
                  <strong>{loc(r.name, lang)}
                    {r.charges ? <span className="badge"> {r.charges} {t('item.charges')}</span> : null}
                    {r.uses ? <span className="badge"> {r.uses} {t('item.usage')}</span> : null}
                    {r.damage ? <span className="badge badge-dmg"> {toW(r.damage, t('dice.die'))}</span> : null}
                    {r.armor ? <span className="badge badge-armor"> +{r.armor}</span> : null}
                  </strong>
                  <span>{loc(r.effect, lang)}{r.recharge ? ` — ${t('item.recharge')}: ${loc(r.recharge, lang)}` : ''}</span>
                </div>
                <div className="spell-actions">
                  <button type="button" className="btn btn-sm" onClick={() => onPick(makeRelic(r.id))}>{t('inv.add')}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Modal>
  );
}
