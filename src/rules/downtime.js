// Downtime (Cairn 2e Player's Guide, Procedures -> Downtime, S. 80-83) als reine Funktionen.
//
// Zwischen den Sitzungen verfolgt eine Spielfigur Ziele (Recherche, Training,
// Bindungen staerken). Der Warden zerlegt ein Ziel in 1-5 Meilensteine; jeder
// Meilenstein kostet eine Downtime-Aktion plus Kosten (Gold, Ressourcen, Ruf,
// Verlust). Nur eine Downtime-Aktion auf einmal; nicht unter unsicheren
// Bedingungen oder waehrend der Genesung. Kosten lassen sich mit Fertigkeiten,
// Kontakten oder Willenskraft (WIL-Rettungswurf) senken oder erlassen.

import { newId, ATTR_KEYS } from './character.js';
import { rollSave } from './dice.js';

export const DOWNTIME_KINDS = ['research', 'training', 'ties', 'custom'];
export const MAX_MILESTONES = 5;

const GOLD_COST = /^(\d+)\s*(gp|gold|g)?$/i;

// Eine Zeile je Meilenstein: "Text" oder "Text | Kosten". Kosten wie "30", "30 gp"
// zaehlen als Gold (wird beim Abschluss abgebucht), alles andere ist Freitext
// (Ressource, Ruf, Verlust). Hoechstens 5 Meilensteine.
export function parseMilestones(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_MILESTONES)
    .map((line) => {
      const [label, ...rest] = line.split('|');
      const cost = rest.join('|').trim();
      const gold = cost.match(GOLD_COST);
      return {
        id: newId('m'),
        text: label.trim(),
        costGp: gold ? Number(gold[1]) : 0,
        costText: gold ? '' : cost,
        done: false,
      };
    });
}

export function newGoal({
  kind = 'custom', title = '', link = '', milestones = [],
} = {}) {
  const list = Array.isArray(milestones) ? milestones : parseMilestones(milestones);
  return {
    id: newId('g'),
    kind: DOWNTIME_KINDS.includes(kind) ? kind : 'custom',
    title: String(title || '').trim(),
    link: String(link || '').trim(),
    milestones: list.slice(0, MAX_MILESTONES),
  };
}

// Ziel aus einem Fremdbefehl (Warden) bereinigen: Ids, Obergrenze, Typen.
export function sanitizeGoal(raw) {
  const ms = Array.isArray(raw?.milestones) ? raw.milestones : [];
  return newGoal({
    kind: raw?.kind,
    title: raw?.title,
    link: raw?.link,
    milestones: ms.slice(0, MAX_MILESTONES).map((m) => ({
      id: newId('m'),
      text: String(m?.text || '').slice(0, 200),
      costGp: Number.isFinite(m?.costGp) && m.costGp > 0 ? Math.floor(m.costGp) : 0,
      costText: String(m?.costText || '').slice(0, 200),
      done: false,
    })),
  });
}

export function goalProgress(goal) {
  const total = goal.milestones.length;
  const done = goal.milestones.filter((m) => m.done).length;
  return { done, total, complete: total > 0 && done === total };
}

// Was verhindert Downtime? Kritisch verletzt, entbehrend oder in Genesung
// (ein Attribut unter Maximum). "Unsichere Lage" entscheidet der Warden.
export function downtimeBlockers(character) {
  const out = [];
  if (character.critical) out.push('critical');
  if (character.deprived) out.push('deprived');
  if (ATTR_KEYS.some((k) => character[k].current < character[k].max)) out.push('recovering');
  return out;
}

const mapGoal = (character, goalId, fn) => ({
  ...character,
  downtime: (character.downtime || []).map((g) => (g.id === goalId ? fn(g) : g)),
});

// Meilenstein per Downtime-Aktion abschliessen: zahlt das Gold, verbraucht die Aktion.
export function completeMilestone(character, goalId, milestoneId) {
  const goal = (character.downtime || []).find((g) => g.id === goalId);
  const ms = goal?.milestones.find((m) => m.id === milestoneId);
  if (!ms) return { ok: false, reason: 'unknown', character };
  if (ms.done) return { ok: false, reason: 'done', character };
  const blockers = downtimeBlockers(character);
  if (blockers.length) return { ok: false, reason: 'blocked', blockers, character };
  if (character.downtimeUsed) return { ok: false, reason: 'used', character };
  if ((character.gp || 0) < ms.costGp) return { ok: false, reason: 'gold', need: ms.costGp, character };
  let next = mapGoal(character, goalId, (g) => ({
    ...g, milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: true } : m)),
  }));
  next = { ...next, gp: (character.gp || 0) - ms.costGp, downtimeUsed: true };
  return { ok: true, character: next, paid: ms.costGp, goalComplete: goalProgress(next.downtime.find((g) => g.id === goalId)).complete };
}

// Kosten senken: WIL-Rettungswurf. Gelingt er, werden die Kosten erlassen
// (der Warden kann stattdessen auch nur senken — der Betrag bleibt editierbar).
export function reduceCost(character, goalId, milestoneId) {
  const goal = (character.downtime || []).find((g) => g.id === goalId);
  const ms = goal?.milestones.find((m) => m.id === milestoneId);
  if (!ms || ms.done) return { ok: false, character };
  const s = rollSave(character.wil.current);
  if (!s.ok) return { ok: false, save: s, character };
  const next = mapGoal(character, goalId, (g) => ({
    ...g, milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, costGp: 0, costText: '', waived: true } : m)),
  }));
  return { ok: true, save: s, character: next };
}

// Neue Downtime-Phase (naechste Pause zwischen Sitzungen): Aktion wieder frei.
export const newPhase = (character) => ({ ...character, downtimeUsed: false });
