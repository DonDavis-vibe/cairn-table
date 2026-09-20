import { useState } from 'react';
import {
  Plus, X, Trash2, PackagePlus,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { itemSlotCost } from '../rules/character.js';
import { toW } from '../rules/dice.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { GM_GIVE } from '../multiplayer/protocol.js';
import { Field, TextInput, InfoHint } from './ui.jsx';
import AddItemMenu from './AddItemMenu.jsx';

// Mietling, Maultier, Karren — ein eigenes, benanntes Inventar mit
// Slot-Limit, getrennt vom persönlichen Bogen und von der Tischmitte.
// Rein lokale Warden-Verwaltung (wie die NSC-Bibliothek): kein Raum-Sync
// nötig, "Geben" nutzt den bestehenden GM_GIVE-Kanal direkt an eine:n
// Spieler:in. Ueberlebt einen Reload, ist aber wie die Tischmitte selbst
// noch nicht raum-synchronisiert (Spieler:innen sehen sie nicht).
const KEY = 'cairn-table-containers';
let seq = 0;
const nid = () => `ctr${(seq += 1)}${Date.now().toString(36).slice(-3)}`;

const usedSlotsOf = (items) => items.reduce((n, it) => n + itemSlotCost(it), 0);

function ItemLine({ item, lang, mark }) {
  const effect = loc(item.effect, lang);
  return (
    <div className="stash-item-info">
      <span className="stash-item-name">{loc(item.name, lang)}</span>
      {item.damage ? <span className="badge badge-dmg">{toW(item.damage, mark)}</span> : null}
      {item.armor ? <span className="badge badge-armor">+{item.armor}</span> : null}
      {effect ? <InfoHint text={effect} /> : null}
    </div>
  );
}

export default function Containers({ mp }) {
  const { t, lang } = useLang();
  const [containers, setContainers] = useState(() => readJSON(KEY, []));
  const [newName, setNewName] = useState('');
  const [newSlots, setNewSlots] = useState(10);
  const [addingTo, setAddingTo] = useState(null);

  const persist = (next) => { setContainers(next); writeJSON(KEY, next); };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    persist([...containers, {
      id: nid(), name, slotsMax: Math.max(1, Number(newSlots) || 10), items: [],
    }]);
    setNewName('');
    setNewSlots(10);
  };
  const removeContainer = (id) => {
    if (!window.confirm(t('container.deleteConfirm'))) return;
    persist(containers.filter((c) => c.id !== id));
  };
  const addItem = (id, item) => {
    persist(containers.map((c) => (c.id === id ? { ...c, items: [...c.items, item] } : c)));
    setAddingTo(null);
  };
  const removeItem = (id, itemId) => {
    persist(containers.map((c) => (c.id === id ? { ...c, items: c.items.filter((it) => it.itemId !== itemId) } : c)));
  };
  const give = (id, itemId, peerId) => {
    const c = containers.find((x) => x.id === id);
    const item = c?.items.find((it) => it.itemId === itemId);
    if (!item || !peerId) return;
    removeItem(id, itemId);
    mp.sendGmCommand(peerId, { cmd: GM_GIVE, item });
  };

  const players = Object.entries(mp.players || {});

  return (
    <div className="containers">
      {containers.length === 0 ? <p className="stash-empty">{t('container.empty')}</p> : null}

      <ul className="container-list">
        {containers.map((c) => {
          const used = usedSlotsOf(c.items);
          const full = used >= c.slotsMax;
          return (
            <li key={c.id} className="container-card">
              <div className="container-head">
                <strong>{c.name}</strong>
                <span className={`badge${full ? ' badge-dmg' : ''}`}>{used}/{c.slotsMax}</span>
                <button type="button" className="item-x" onClick={() => removeContainer(c.id)} aria-label={t('common.remove')}>
                  <Trash2 size={13} />
                </button>
              </div>

              {c.items.length ? (
                <ul className="stash-list">
                  {c.items.map((it) => (
                    <li key={it.itemId} className="stash-row">
                      <ItemLine item={it} lang={lang} mark={t('dice.die')} />
                      <div className="stash-row-actions">
                        <select
                          className="text-input stash-give"
                          value=""
                          onChange={(e) => { if (e.target.value) give(c.id, it.itemId, e.target.value); }}
                          disabled={!players.length}
                          aria-label={t('stash.giveTo')}
                        >
                          <option value="">{players.length ? t('stash.giveTo') : t('gm.noPlayers')}</option>
                          {players.map(([pid, p]) => (
                            <option key={pid} value={pid}>{p.character?.name?.trim() || t('gm.unnamed')}</option>
                          ))}
                        </select>
                        <button type="button" className="item-x" onClick={() => removeItem(c.id, it.itemId)} aria-label={t('common.remove')}>
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="stash-empty">{t('container.emptyItems')}</p>}

              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingTo(c.id)} disabled={full}>
                <PackagePlus size={13} /> {t('container.addItem')}
              </button>
              {addingTo === c.id ? (
                <AddItemMenu onClose={() => setAddingTo(null)} onPick={(item) => addItem(c.id, item)} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="container-new">
        <Field label={t('container.newName')}>
          <TextInput value={newName} onChange={setNewName} placeholder={t('container.newNamePlaceholder')} />
        </Field>
        <label className="mini-num">
          {t('container.slots')}
          <input type="number" min="1" max="40" value={newSlots} onChange={(e) => setNewSlots(e.target.value)} />
        </label>
        <button type="button" className="btn btn-sm btn-primary" disabled={!newName.trim()} onClick={create}>
          <Plus size={13} /> {t('container.create')}
        </button>
      </div>
    </div>
  );
}
