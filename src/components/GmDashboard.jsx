import { useEffect, useState } from 'react';
import {
  Copy, Check, Megaphone, Dices, GripVertical, RotateCcw,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLang, loc } from '../i18n/index.jsx';
import { Panel } from './ui.jsx';
import { rollDie, rollReaction, rollDieOfFate } from '../rules/dice.js';
import { GM_BROADCAST } from '../multiplayer/protocol.js';
import { formatLogEntry, entryTone } from '../multiplayer/logFormat.js';
import { shareRoll, shareEvent } from '../utils/discord.js';
import { loadGmLayout, saveGmLayout, resetGmLayout } from '../utils/gmLayout.js';
import GmPlayerCard from './GmPlayerCard.jsx';
import GmPartyOverview from './GmPartyOverview.jsx';
import GmCombatTracker from './GmCombatTracker.jsx';
import GmGenerators from './GmGenerators.jsx';
import Stash from './Stash.jsx';
import Containers from './Containers.jsx';
import MapPanel from './MapPanel.jsx';
import emptyLobby from '../assets/vg-barrow.jpg';

function inviteLink(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('join', code);
  url.hash = '';
  return url.toString();
}

// Ein Panel, das sich per Griff in eine der beiden Spalten ziehen und dort
// umsortieren laesst. Der Griff haengt am Panel::actions-Slot statt am ganzen
// Panel, damit Klicks/Eingaben im Panelinhalt selbst nicht zu Drag-Versuchen werden.
function SortablePanel({ id, title, dragLabel, children }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const handle = (
    <button type="button" className="panel-drag-handle" title={dragLabel} aria-label={dragLabel} {...attributes} {...listeners}>
      <GripVertical size={14} />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      <Panel title={title} actions={handle}>{children}</Panel>
    </div>
  );
}

// Eine Spalte ist selbst ein Drop-Ziel (auch leer treffbar) UND der Sortier-
// kontext fuer ihre Panels.
function DroppableColumn({ id, items, className, children }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

export default function GmDashboard({ mp }) {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const [shout, setShout] = useState('');
  const [layout, setLayout] = useState(() => loadGmLayout());

  const entries = Object.entries(mp.players);

  const { stashEvent, clearStashEvent, logGmAction } = mp;
  useEffect(() => {
    if (!stashEvent) return;
    const { kind, playerName, item } = stashEvent;
    const key = kind === 'add' ? 'stash.log.added' : 'stash.log.took';
    logGmAction({ text: `${playerName} ${t(key, { item: loc(item.name, lang) })}`, cmd: 'gm', tone: 'gm' });
    clearStashEvent();
  }, [stashEvent, clearStashEvent, logGmAction, t, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(mp.roomCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const gmRoll = (label, fn) => {
    const r = fn();
    mp.logGmAction({ text: `${t('gm.warden')}: ${label} — ${r}`, tone: 'gm', cmd: 'gm' });
    shareRoll(t('gm.warden'), label, r);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
  );

  const findColumn = (id) => {
    if (layout.left.includes(id)) return 'left';
    if (layout.right.includes(id)) return 'right';
    return null;
  };

  const onDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = findColumn(active.id);
    const to = findColumn(over.id) || (over.id === 'left' || over.id === 'right' ? over.id : null);
    if (!from || !to || from === to) return;
    setLayout((prev) => {
      const fromItems = prev[from].filter((id) => id !== active.id);
      const overIndex = prev[to].indexOf(over.id);
      const toItems = [...prev[to]];
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, active.id);
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  };

  const onDragEnd = ({ active, over }) => {
    if (!over) { saveGmLayout(layout); return; }
    const col = findColumn(active.id);
    if (!col) { saveGmLayout(layout); return; }
    const items = layout[col];
    const activeIndex = items.indexOf(active.id);
    const overIndex = items.indexOf(over.id);
    let next = layout;
    if (overIndex >= 0 && activeIndex !== overIndex) {
      next = { ...layout, [col]: arrayMove(items, activeIndex, overIndex) };
      setLayout(next);
    }
    saveGmLayout(next);
  };

  const resetLayout = () => {
    const next = resetGmLayout();
    setLayout(next);
    saveGmLayout(next);
  };

  const PANELS = {
    warden: {
      title: t('gm.title'),
      node: (
        <>
          <div className="gm-room-row">
            <span className="mp-room-label">{t('mp.roomCode')}</span>
            <strong className="mp-room-code">{mp.roomCode}</strong>
            <span className={`mp-dot ${mp.roomOnline ? 'on' : 'off'}`}>{mp.roomOnline ? t('mp.roomOnline') : t('mp.roomOffline')}</span>
            <button type="button" className="btn btn-sm" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {t('mp.copyLink')}
            </button>
            <span className="gm-count">{t('mp.playersConnected', { n: entries.length })}</span>
          </div>
          <div className="gm-room-row">
            <input className="text-input" placeholder={t('gm.shoutPlaceholder')} value={shout} onChange={(e) => setShout(e.target.value)} />
            <button type="button" className="btn btn-sm" disabled={!shout.trim()} onClick={() => { mp.sendGmCommand(null, { cmd: GM_BROADCAST, text: shout.trim() }); mp.logGmAction({ text: `${t('gm.announced')}: "${shout.trim()}"`, cmd: 'gm' }); shareEvent(t('gm.warden'), `📣 ${shout.trim()}`, 'info'); setShout(''); }}>
              <Megaphone size={14} /> {t('gm.announce')}
            </button>
          </div>
          <div className="gm-room-row">
            <span className="field-label">{t('sheet.dice')}:</span>
            <button type="button" className="btn btn-sm" onClick={() => gmRoll(`${t('dice.die')}20`, () => rollDie(20))}><Dices size={13} /> {t('dice.die')}20</button>
            <button type="button" className="btn btn-sm" onClick={() => gmRoll(`${t('dice.die')}6`, () => rollDie(6))}><Dices size={13} /> {t('dice.die')}6</button>
            <button type="button" className="btn btn-sm" onClick={() => gmRoll(t('dice.reaction'), () => { const x = rollReaction(); return `${x.dice.join('+')} · ${t(`reaction.${x.key}`)}`; })}>{t('dice.reaction')}</button>
            <button type="button" className="btn btn-sm" onClick={() => gmRoll(t('dice.fate'), () => { const x = rollDieOfFate(); return `${x.d} · ${x.favorsPcs ? t('dice.fateGood') : t('dice.fateBad')}`; })}>{t('dice.fate')}</button>
          </div>
          <label className="radio-line">
            <input type="checkbox" checked={mp.partyLog} onChange={(e) => mp.setPartyLogShared(e.target.checked)} />
            {t('mp.sharePartyLog')}
          </label>
        </>
      ),
    },
    combat: { title: t('gm.combat'), node: <GmCombatTracker mp={mp} /> },
    map: { title: t('map.title'), node: <MapPanel mp={mp} /> },
    stash: { title: t('stash.title'), node: <Stash mp={mp} /> },
    containers: { title: t('container.title'), node: <Containers mp={mp} /> },
    generators: { title: t('gen.title'), node: <GmGenerators mp={mp} /> },
    log: {
      title: t('gm.log'),
      node: (
        <ul className="dice-log gm-log">
          {mp.liveLog.length === 0 ? <li className="dice-log-empty">{t('gm.logEmpty')}</li> : null}
          {mp.liveLog.map((e) => (
            <li key={e.id} className={`dice-log-${entryTone(e)}`}>{formatLogEntry(e, t)}</li>
          ))}
        </ul>
      ),
    },
    party: {
      title: t('gm.party'),
      node: entries.length === 0 ? (
        <div className="gm-empty">
          <img src={emptyLobby} alt="" width="200" />
          <p>{t('gm.noPlayers')}</p>
        </div>
      ) : (
        <div className="gm-cards">
          {entries.map(([peerId, p]) => (
            <GmPlayerCard key={peerId} peerId={peerId} character={p.character} mp={mp} />
          ))}
        </div>
      ),
    },
  };

  return (
    <>
      {/* Bewusst ausserhalb des Drag-and-drop-Systems und ueber beide Spalten:
          der Warden soll den Zustand der Gruppe immer auf einen Blick sehen,
          unabhaengig davon, wie die uebrigen Panels gerade angeordnet sind. */}
      <Panel title={t('gm.overview')} className="panel-overview">
        <GmPartyOverview players={mp.players} />
      </Panel>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="gm-dash-tools">
          <button type="button" className="btn btn-sm btn-ghost" onClick={resetLayout}>
            <RotateCcw size={13} /> {t('gm.layoutReset')}
          </button>
        </div>
        <div className="gm-dash">
          <DroppableColumn id="left" items={layout.left} className="gm-main">
            {layout.left.map((id) => (
              <SortablePanel key={id} id={id} title={PANELS[id].title} dragLabel={t('gm.dragHandle', { panel: PANELS[id].title })}>
                {PANELS[id].node}
              </SortablePanel>
            ))}
          </DroppableColumn>

          <DroppableColumn id="right" items={layout.right} className="gm-side">
            {layout.right.map((id) => (
              <SortablePanel key={id} id={id} title={PANELS[id].title} dragLabel={t('gm.dragHandle', { panel: PANELS[id].title })}>
                {PANELS[id].node}
              </SortablePanel>
            ))}
          </DroppableColumn>
        </div>
      </DndContext>
    </>
  );
}
