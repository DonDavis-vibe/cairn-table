import { useState } from 'react';
import {
  Package, Trash2, Plus, HandCoins, PackageOpen,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { toW } from '../rules/dice.js';
import { firstFreeFit, isPetty, removeItem } from '../rules/inventory.js';
import { InfoHint } from './ui.jsx';
import AddItemMenu from './AddItemMenu.jsx';

function ItemLine({ item, lang }) {
  const effect = loc(item.effect, lang);
  return (
    <div className="stash-item-info">
      <Package size={13} className="item-icon" />
      <span className="stash-item-name">{loc(item.name, lang)}</span>
      {item.damage ? <span className="badge badge-dmg">{toW(item.damage)}</span> : null}
      {item.armor ? <span className="badge badge-armor">+{item.armor}</span> : null}
      {item.size === 2 ? <span className="badge">·</span> : null}
      {effect ? <InfoHint text={effect} /> : null}
    </div>
  );
}

export default function Stash({ mp, character, setCharacter, pushLog }) {
  const { t, lang } = useLang();
  const [adding, setAdding] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const isGm = mp.role === 'gm';
  const stash = mp.stash || [];
  const players = Object.entries(mp.players || {});

  const drop = (it) => {
    setCharacter((c) => removeItem(c, it.itemId));
    mp.stashDrop(it);
    pushLog?.({ kind: 'roll', text: t('stash.dropped', { item: loc(it.name, lang) }) });
    setDropOpen(false);
  };

  const take = (it) => {
    const size = it.size === 2 ? 2 : 1;
    if (!isPetty(it) && !firstFreeFit(character.slots, size)) {
      pushLog?.({ kind: 'warn', text: t('inv.noRoom') });
      return;
    }
    mp.stashTake(it.itemId);
    pushLog?.({ kind: 'roll', text: t('stash.took', { item: loc(it.name, lang) }) });
  };

  const droppable = character
    ? Object.values(character.items).filter((i) => i.type !== 'condition')
    : [];

  return (
    <div className="stash">
      {stash.length === 0 ? (
        <p className="stash-empty">{isGm ? t('stash.emptyGm') : t('stash.empty')}</p>
      ) : (
        <ul className="stash-list">
          {stash.map((it) => (
            <li key={it.itemId} className="stash-row">
              <ItemLine item={it} lang={lang} />
              <div className="stash-row-actions">
                {isGm ? (
                  <>
                    <select
                      className="text-input stash-give"
                      value=""
                      onChange={(e) => { if (e.target.value) mp.stashGive(e.target.value, it.itemId); }}
                      disabled={!players.length}
                      aria-label={t('stash.giveTo')}
                    >
                      <option value="">{players.length ? t('stash.giveTo') : t('gm.noPlayers')}</option>
                      {players.map(([pid, p]) => (
                        <option key={pid} value={pid}>{p.character?.name?.trim() || t('gm.unnamed')}</option>
                      ))}
                    </select>
                    <button type="button" className="item-x" onClick={() => mp.stashRemove(it.itemId)} aria-label={t('common.remove')}>
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <button type="button" className="chip chip-small chip-cast" onClick={() => take(it)}>
                    <HandCoins size={12} /> {t('stash.take')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="stash-actions">
        {isGm ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
            <Plus size={14} /> {t('stash.addLoot')}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDropOpen((v) => !v)} disabled={!droppable.length}>
            <PackageOpen size={14} /> {t('stash.drop')}
          </button>
        )}
      </div>

      {!isGm && dropOpen ? (
        <div className="stash-drop-pick">
          <span className="field-label">{t('stash.dropPick')}</span>
          <ul>
            {droppable.map((it) => (
              <li key={it.itemId}>
                <button type="button" className="catalog-item" onClick={() => drop(it)}>
                  <span className="catalog-name">{loc(it.name, lang)}</span>
                  {it.damage ? <span className="badge badge-dmg">{toW(it.damage)}</span> : null}
                  {it.armor ? <span className="badge badge-armor">+{it.armor}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {adding ? (
        <AddItemMenu
          onClose={() => setAdding(false)}
          onPick={(item) => { mp.stashAdd(item); setAdding(false); }}
        />
      ) : null}
    </div>
  );
}
