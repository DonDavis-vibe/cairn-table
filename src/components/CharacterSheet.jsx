import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { useLang, loc } from '../i18n/index.jsx';
import { Panel, Field, TextInput } from './ui.jsx';
import { ATTR_KEYS } from '../rules/character.js';
import { addItemAt, removeItem, pettyItems, tryMove, firstFreeFit } from '../rules/inventory.js';
import AddItemMenu from './AddItemMenu.jsx';
import { makeFatigue, makeCondition, makeItem } from '../data/items.js';
import { SPELL_BY_ID } from '../data/spells.js';
import { rollSave } from '../rules/dice.js';
import { applyRest } from '../rules/rest.js';
import { resolveDamage, resolveAttributeDamage, heal } from '../rules/combat.js';
import {
  GM_DAMAGE, GM_HEAL, GM_GOLD, GM_SAVE, GM_FATIGUE, GM_CONDITION, GM_DEPRIVED, GM_PANICKED, GM_REST,
  GM_GIVE, GM_WHISPER, GM_BROADCAST, GM_WEBHOOK,
} from '../multiplayer/protocol.js';
import { setWebhook, shareSave, shareEvent } from '../utils/discord.js';
import { TRAIT_KEYS, TRAIT_TABLES, traitSummary } from '../data/tables.js';
import AttributeBox from './AttributeBox.jsx';
import ResourceBar from './ResourceBar.jsx';
import DamagePanel from './DamagePanel.jsx';
import CombatPrompt from './CombatPrompt.jsx';
import Portrait from './Portrait.jsx';
import Stash from './Stash.jsx';
import PartyView from './PartyView.jsx';
import MapPanel from './MapPanel.jsx';
import InventoryGrid from './InventoryGrid.jsx';
import ItemCard from './ItemCard.jsx';
import DiceRoller from './DiceRoller.jsx';

let logSeq = 0;

export default function CharacterSheet({ character, setCharacter, mp = null, notify = () => {} }) {
  const { t, lang } = useLang();
  const [log, setLog] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [combatPrompt, setCombatPrompt] = useState(null); // null | {kind:'scar',hpLost} | {kind:'save',target}
  const lastCmdRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
  );

  const pushLog = useCallback((entry) => {
    logSeq += 1;
    setLog((l) => [{ id: `l${logSeq}`, ...entry }, ...l].slice(0, 40));
  }, []);

  const onEvent = mp?.role === 'player' ? mp.sendEvent : null;

  // --- Multiplayer: eigenen Bogen (debounced) an den Warden pushen ---
  const mpRole = mp?.role;
  const sendState = mp?.sendState;
  const resyncNonce = mp?.resyncNonce;
  useEffect(() => {
    if (mpRole !== 'player' || !sendState) return undefined;
    const id = setTimeout(() => sendState(character), 300);
    return () => clearTimeout(id);
  }, [character, mpRole, sendState, resyncNonce]);

  // --- Multiplayer: Befehle des Wardens anwenden ---
  const gmCommand = mp?.gmCommand;
  const clearGmCommand = mp?.clearGmCommand;
  useEffect(() => {
    if (!gmCommand || lastCmdRef.current === gmCommand.id) return;
    lastCmdRef.current = gmCommand.id;
    const cmd = gmCommand.cmd;
    const cn = character.name || t('app.title');
    const say = (text, kind = 'info', toDiscord = true) => {
      notify(text, kind);
      pushLog({ kind: kind === 'ok' ? 'ok' : kind === 'bad' ? 'bad' : 'roll', text });
      if (toDiscord) shareEvent(cn, text, kind === 'ok' ? 'ok' : kind === 'bad' ? 'bad' : kind === 'warn' ? 'warn' : 'info');
    };

    if (cmd === GM_WEBHOOK) {
      setWebhook(gmCommand.url || '');
      clearGmCommand?.();
      return;
    }
    if (cmd === GM_DAMAGE) {
      if (gmCommand.target === 'hp') {
        const r = resolveDamage(character, gmCommand.amount);
        setCharacter(r.character);
        let note = '';
        if (r.death) note = t('combat.dead');
        else if (r.scar) { note = t('combat.scarPending'); setCombatPrompt({ kind: 'scar', hpLost: r.scar.hpLost }); }
        else if (r.strSave) { note = t('combat.savePending'); setCombatPrompt({ kind: 'save', target: r.strSave.target }); }
        say(`−${gmCommand.amount} ${t('res.hp')}${note ? ` · ${note}` : ''}`, 'bad');
        onEvent?.({ kind: 'damage', amount: gmCommand.amount, target: 'hp', note });
      } else {
        const r = resolveAttributeDamage(character, gmCommand.target, gmCommand.amount);
        setCharacter(r.character);
        say(`−${gmCommand.amount} ${t(`attr.${gmCommand.target}`)}${r.zero ? ` · ${t(`combat.zero.${gmCommand.target}`)}` : ''}`, 'bad');
        onEvent?.({ kind: 'damage', amount: gmCommand.amount, target: gmCommand.target });
      }
    } else if (cmd === GM_HEAL) {
      setCharacter((c) => heal(c, gmCommand.target, gmCommand.amount));
      say(`+${gmCommand.amount} ${gmCommand.target === 'hp' ? t('res.hp') : t(`attr.${gmCommand.target}`)}`, 'ok');
      onEvent?.({ kind: 'heal', amount: gmCommand.amount, target: gmCommand.target });
    } else if (cmd === GM_GOLD) {
      setCharacter((c) => ({ ...c, gp: Math.max(0, (c.gp || 0) + gmCommand.amount) }));
      say(`${gmCommand.amount >= 0 ? '+' : ''}${gmCommand.amount} ${t('res.gp')}`, gmCommand.amount >= 0 ? 'ok' : 'warn');
    } else if (cmd === GM_SAVE) {
      const s = rollSave(character[gmCommand.attr].current);
      say(`${t('dice.saveVs', { attr: t(`attr.${gmCommand.attr}`) })} — ${t('dice.die')}20 ${s.d} ${s.ok ? '≤' : '>'} ${s.target} · ${s.ok ? t('dice.success') : t('dice.fail')}`, s.ok ? 'ok' : 'bad', false);
      shareSave(cn, t('dice.saveVs', { attr: t(`attr.${gmCommand.attr}`) }), s.d, s.target, s.ok);
      onEvent?.({ kind: 'save', attr: gmCommand.attr, roll: s.d, target: s.target, ok: s.ok, reason: t('gm.warden') });
    } else if (cmd === GM_FATIGUE) {
      setCharacter((c) => {
        if (!firstFreeFit(c.slots, 1)) { notify(t('inv.noRoomFatigue'), 'warn'); return c; }
        return addItemAt(c, makeFatigue(), 'pack_6').character || c;
      });
      say(t('inv.fatigueAdded'), 'bad');
      onEvent?.({ kind: 'fatigue' });
    } else if (cmd === GM_CONDITION && gmCommand.key) {
      setCharacter((c) => {
        if (!firstFreeFit(c.slots, 1)) { notify(t('inv.noRoom'), 'warn'); return c; }
        return addItemAt(c, makeCondition(gmCommand.key), 'pack_6').character || c;
      });
      say(t('inv.fatigueAdded'), 'bad');
    } else if (cmd === GM_DEPRIVED) {
      setCharacter((c) => ({ ...c, deprived: !!gmCommand.on }));
      say(gmCommand.on ? t('res.deprived') : `${t('res.deprived')} ✓`, gmCommand.on ? 'warn' : 'ok');
    } else if (cmd === GM_PANICKED) {
      setCharacter((c) => ({ ...c, panicked: !!gmCommand.on }));
      say(gmCommand.on ? t('res.panicked') : `${t('res.panicked')} ✓`, gmCommand.on ? 'bad' : 'ok');
    } else if (cmd === GM_REST) {
      const r = applyRest(character, gmCommand.kind);
      setCharacter(r.character);
      say(`${t(`rest.${gmCommand.kind}`)} — ${t(r.msg.key, r.msg.vars)}`, r.blocked ? 'warn' : 'ok');
      onEvent?.({ kind: 'rest', restKind: gmCommand.kind, text: t(r.msg.key, r.msg.vars) });
    } else if (cmd === GM_GIVE && gmCommand.item) {
      setCharacter((c) => {
        const it = gmCommand.item.itemId ? gmCommand.item : makeItem(gmCommand.item.key || null, gmCommand.item);
        const res = addItemAt(c, it, 'pack_6');
        return res.ok ? res.character : c;
      });
      say(t('player.gm.give', { item: loc(gmCommand.item.name, lang) }), 'ok');
    } else if (cmd === GM_WHISPER) {
      say(`${t('player.gm.whisper')}: ${gmCommand.text}`, 'info', false);
    } else if (cmd === GM_BROADCAST) {
      say(`${t('player.gm.broadcast')}: ${gmCommand.text}`, 'info');
    }
    clearGmCommand?.();
  }, [gmCommand, clearGmCommand, character, setCharacter, notify, pushLog, t, lang, onEvent]);

  const handleDragEnd = ({ active, over }) => {
    setDragId(null);
    if (!over || active.id === over.id) return;
    setCharacter((c) => {
      const res = tryMove(c.slots, c.items, active.id, over.id);
      return res.ok ? { ...c, slots: res.slots } : c;
    });
  };

  const patch = (p) => setCharacter((c) => ({ ...c, ...p }));
  const setAttr = (key, p) => setCharacter((c) => ({ ...c, [key]: { ...c[key], ...p } }));
  const setTrait = (key, value) => setCharacter((c) => ({ ...c, traits: { ...c.traits, [key]: value } }));

  const doSave = (attr) => {
    const r = rollSave(character[attr].current);
    pushLog({
      kind: r.ok ? 'ok' : 'bad',
      text: `${t('dice.saveVs', { attr: t(`attr.${attr}`) })} — ${t('dice.die')}20 ${r.d} ${r.ok ? '≤' : '>'} ${r.target} · ${r.ok ? t('dice.success') : t('dice.fail')}`,
    });
    shareSave(character.name || t('app.title'), t('dice.saveVs', { attr: t(`attr.${attr}`) }), r.d, r.target, r.ok);
    onEvent?.({ kind: 'save', attr, roll: r.d, target: r.target, ok: r.ok });
  };

  const onAddAt = (slot, item) => {
    const res = addItemAt(character, item, slot);
    if (!res.ok) { pushLog({ kind: 'warn', text: t('inv.noRoom') }); return; }
    setCharacter(res.character);
  };
  const onRemove = (itemId) => setCharacter((c) => removeItem(c, itemId));
  const onToggleUsage = (itemId, i) => setCharacter((c) => {
    const it = c.items[itemId];
    if (!it?.usage) return c;
    const current = i < it.usage.current ? i : i + 1;
    return { ...c, items: { ...c.items, [itemId]: { ...it, usage: { ...it.usage, current } } } };
  });
  const onToggleCleared = (itemId) => setCharacter((c) => {
    const it = c.items[itemId];
    return { ...c, items: { ...c.items, [itemId]: { ...it, cleared: !it.cleared } } };
  });
  const onAddFatigue = () => {
    const res = addItemAt(character, makeFatigue(), 'pack_6');
    if (!res.ok) { pushLog({ kind: 'warn', text: t('inv.noRoomFatigue') }); return; }
    pushLog({ kind: 'bad', text: t('inv.fatigueAdded') });
    setCharacter(res.character);
  };
  // Bewusst OHNE setCharacter-Updater: die Log-/Event-Nebenwirkungen sollen
  // nicht doppelt laufen (React StrictMode ruft Updater doppelt auf).
  const onCast = (itemId) => {
    const c = character;
    const it = c.items[itemId];
    if (!it) return;

    if (it.type === 'spellbook') {
      if (!firstFreeFit(c.slots, 1)) { pushLog({ kind: 'warn', text: t('inv.castNoRoom') }); return; }
      const res = addItemAt(c, makeFatigue(), 'pack_6');
      if (!res.ok) { pushLog({ kind: 'warn', text: t('inv.castNoRoom') }); return; }
      const sbName = SPELL_BY_ID[it.spellId]?.name;
      const text = t('inv.cast', { name: sbName ? loc(sbName, lang) : loc(it.name, lang) });
      pushLog({ kind: 'roll', text });
      onEvent?.({ kind: 'note', text });

      let next = res.character;
      // Entbehrt (oder in Gefahr): WIL-Rettungswurf gegen üble Nebenwirkungen.
      // Bei Misserfolg als mildeste Folge eine zusätzliche Erschöpfung.
      if (c.deprived) {
        const s = rollSave(c.wil.current);
        pushLog({
          kind: s.ok ? 'ok' : 'bad',
          text: `${t('inv.castDeprived')} — ${t('dice.die')}20 ${s.d} ${s.ok ? '≤' : '>'} ${s.target} · ${s.ok ? t('dice.success') : t('dice.fail')}`,
        });
        onEvent?.({ kind: 'save', attr: 'wil', roll: s.d, target: s.target, ok: s.ok, reason: t('inv.castDeprived') });
        if (!s.ok) {
          const res2 = addItemAt(next, makeFatigue(), 'pack_6');
          if (res2.ok) { pushLog({ kind: 'bad', text: t('inv.castMishap') }); next = res2.character; }
        }
      }
      setCharacter(next);
      return;
    }

    if (it.type === 'scroll') {
      const spellName = SPELL_BY_ID[it.spellId]?.name;
      const text = t('inv.scrollUsed', { name: spellName ? loc(spellName, lang) : loc(it.name, lang) });
      pushLog({ kind: 'roll', text });
      onEvent?.({ kind: 'note', text });
      setCharacter(removeItem(c, itemId));
    }
  };

  const rest = (kind) => {
    const r = applyRest(character, kind);
    setCharacter(r.character);
    pushLog({ kind: r.blocked ? 'warn' : 'ok', text: `${t(`rest.${kind}`)} — ${t(r.msg.key, r.msg.vars)}` });
    onEvent?.({ kind: 'rest', restKind: kind, text: t(r.msg.key, r.msg.vars) });
  };

  const petty = pettyItems(character);
  const [pettyMenu, setPettyMenu] = useState(false);
  const partyNpcs = mp?.role === 'player' ? (mp.partyNpcs || []) : [];

  return (
    <div className="sheet">
      {partyNpcs.length ? (
        <div className="npc-banner" role="status">
          <span className="npc-banner-label">{t('sheet.inFight')}</span>
          {partyNpcs.map((n) => <span key={n.id} className="npc-chip">{loc(n.name, lang)}</span>)}
        </div>
      ) : null}

      <Panel title={t('sheet.identity')}>
        <div className="id-row">
          <Portrait src={character.portrait} onChange={(v) => patch({ portrait: v })} editable size={110} />
          <div className="id-grid">
            <Field label={t('sheet.name')}><TextInput value={character.name} onChange={(v) => patch({ name: v })} /></Field>
            <Field label={t('sheet.player')}><TextInput value={character.playerName} onChange={(v) => patch({ playerName: v })} /></Field>
            <Field label={t('sheet.background')}><TextInput value={character.background} onChange={(v) => patch({ background: v })} /></Field>
            <Field label={t('sheet.age')}><TextInput type="number" value={character.age || ''} onChange={(v) => patch({ age: Number(v) || 0 })} /></Field>
          </div>
        </div>
        <details className="traits">
          <summary>{t('sheet.traits')}</summary>
          <div className="traits-grid">
            {TRAIT_KEYS.map((k) => (
              <Field key={k} label={loc(TRAIT_TABLES[k].label, lang)}>
                <TextInput value={character.traits[k]} onChange={(v) => setTrait(k, v)} />
              </Field>
            ))}
          </div>
          {traitSummary(character.traits, lang) ? (
            <p className="trait-summary">{traitSummary(character.traits, lang)}</p>
          ) : null}
          <Field label={t('sheet.bond')}><TextInput value={character.bond} onChange={(v) => patch({ bond: v })} /></Field>
          <Field label={t('sheet.omen')}><TextInput value={character.omen} onChange={(v) => patch({ omen: v })} /></Field>
        </details>
      </Panel>

      {/* Attribute bis Notizen als EIN Grid-Feld (linke Spalte), Schaden &
          Heilung + Würfel als eigenes Grid-Feld (rechte Spalte, siehe unten):
          zwei unabhängig fließende Spalten statt paarweiser Grid-Zeilen, sonst
          zwingt CSS Grid inhaltlich unabhängige Felder auf gleiche Zeilenhöhe
          und reißt Lücken (z. B. Rest-Knöpfe neben dem hohen Würfel-Feld). */}
      <div className="sheet-main">
        <Panel title={t('sheet.attributes')}>
          <div className="attr-row">
            {ATTR_KEYS.map((k) => (
              <AttributeBox key={k} attrKey={k} data={character[k]} onChange={(p) => setAttr(k, p)} onSave={() => doSave(k)} />
            ))}
          </div>
          <ResourceBar character={character} onChange={patch} />
          <div className="rest-row">
            <span>{t('sheet.rest')}:</span>
            <button type="button" className="btn btn-ghost" onClick={() => rest('short')}>{t('rest.short')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => rest('night')}>{t('rest.night')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => rest('week')}>{t('rest.week')}</button>
          </div>
        </Panel>

        <Panel title={t('sheet.inventory')}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setDragId(active.id)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDragId(null)}
          >
            <InventoryGrid
              character={character}
              onAddAt={onAddAt}
              onRemove={onRemove}
              onToggleUsage={onToggleUsage}
              onToggleCleared={onToggleCleared}
              onAddFatigue={onAddFatigue}
              onCast={onCast}
            />
            <DragOverlay>
              {dragId && character.items[dragId] ? (
                <ItemCard item={character.items[dragId]} span={character.items[dragId].size === 2 ? 2 : 1} />
              ) : null}
            </DragOverlay>
          </DndContext>
          <div className="petty-list">
            <div className="petty-head">
              <h3 className="inv-h">{t('inv.petty')}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPettyMenu(true)}>
                <Plus size={13} /> {t('inv.addPetty')}
              </button>
            </div>
            {petty.length ? (
              <ul>
                {petty.map((it) => (
                  <li key={it.itemId}>
                    {loc(it.name, lang)}
                    {it.type === 'scroll' ? (
                      <button type="button" className="chip chip-small chip-cast" onClick={() => onCast(it.itemId)}>{t('item.useScroll')}</button>
                    ) : null}
                    <button type="button" className="item-x" onClick={() => onRemove(it.itemId)} aria-label={t('common.remove')}><X size={12} /></button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {pettyMenu ? (
            <AddItemMenu petty onClose={() => setPettyMenu(false)} onPick={(item) => { onAddAt(null, item); setPettyMenu(false); }} />
          ) : null}
        </Panel>

        {mp?.role === 'player' ? (
          <Panel title={t('stash.title')}>
            <Stash mp={mp} character={character} setCharacter={setCharacter} pushLog={pushLog} />
          </Panel>
        ) : null}

        {mp?.role === 'player' ? (
          <Panel title={t('party.title')}>
            <PartyView mp={mp} />
          </Panel>
        ) : null}

        {mp?.role === 'player' ? (
          <Panel title={t('map.title')}>
            <MapPanel mp={mp} />
          </Panel>
        ) : null}

        {character.scars.length ? (
          <Panel title={t('sheet.scars')}>
            <ul className="scars-list">
              {character.scars.map((s, i) => (
                <li key={i}>
                  <span className="scar-idx">#{s.index}</span> {s.name}
                  <button type="button" className="item-x" onClick={() => setCharacter((c) => ({ ...c, scars: c.scars.filter((_, j) => j !== i) }))} aria-label={t('common.remove')}><X size={12} /></button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel title={t('sheet.notes')}>
          <textarea className="notes" value={character.notes} onChange={(e) => patch({ notes: e.target.value })} rows={5} />
        </Panel>
      </div>

      <div className="sheet-side">
        <Panel title={t('sheet.damage')}>
          <DamagePanel
            character={character}
            setCharacter={setCharacter}
            pushLog={pushLog}
            onEvent={onEvent}
            onPrompt={setCombatPrompt}
          />
          {combatPrompt ? (
            <CombatPrompt
              prompt={combatPrompt}
              setCharacter={setCharacter}
              pushLog={pushLog}
              onEvent={onEvent}
              onClose={() => setCombatPrompt(null)}
            />
          ) : null}
        </Panel>

        <Panel title={t('sheet.dice')}>
          <DiceRoller character={character} log={log} pushLog={pushLog} onEvent={onEvent} />
        </Panel>
      </div>
    </div>
  );
}
