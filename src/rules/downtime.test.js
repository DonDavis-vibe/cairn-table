import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankCharacter } from './character.js';
import {
  parseMilestones, newGoal, sanitizeGoal, goalProgress, downtimeBlockers,
  completeMilestone, reduceCost, newPhase,
} from './downtime.js';

afterEach(() => vi.restoreAllMocks());

function withGoal(over = {}) {
  const c = blankCharacter();
  c.gp = 50;
  const goal = newGoal({ kind: 'research', title: 'Verlorener Tempel', link: 'Kewr', milestones: 'Hinweise sammeln | 30 gp\nKarte kaufen | eine Flasche Wein\nTor finden' });
  c.downtime = [goal];
  return { c: { ...c, ...over }, goal };
}

describe('parseMilestones', () => {
  it('liest Text und Kosten je Zeile', () => {
    const [a, b, c] = parseMilestones('Hinweise | 30 gp\nKarte | Wein\nTor');
    expect(a).toMatchObject({ text: 'Hinweise', costGp: 30, costText: '' });
    expect(b).toMatchObject({ text: 'Karte', costGp: 0, costText: 'Wein' });
    expect(c).toMatchObject({ text: 'Tor', costGp: 0, costText: '' });
  });
  it('höchstens 5 Meilensteine, leere Zeilen weg', () => {
    expect(parseMilestones('a\n\nb\nc\nd\ne\nf\ng')).toHaveLength(5);
  });
  it('nackte Zahl zählt als Gold', () => {
    expect(parseMilestones('x | 12')[0].costGp).toBe(12);
  });
});

describe('sanitizeGoal', () => {
  it('begrenzt Meilensteine, vergibt neue Ids, setzt unbekannte Art auf custom', () => {
    const g = sanitizeGoal({ kind: 'bogus', title: 'T', milestones: Array.from({ length: 9 }, (_, i) => ({ id: 'x', text: `m${i}`, costGp: -5 })) });
    expect(g.kind).toBe('custom');
    expect(g.milestones).toHaveLength(5);
    expect(g.milestones[0].costGp).toBe(0);
    expect(g.milestones[0].id).not.toBe('x');
  });
});

describe('completeMilestone', () => {
  it('zahlt Gold, markiert erledigt, verbraucht die Aktion', () => {
    const { c, goal } = withGoal();
    const r = completeMilestone(c, goal.id, goal.milestones[0].id);
    expect(r.ok).toBe(true);
    expect(r.paid).toBe(30);
    expect(r.character.gp).toBe(20);
    expect(r.character.downtimeUsed).toBe(true);
    expect(goalProgress(r.character.downtime[0])).toMatchObject({ done: 1, total: 3, complete: false });
  });

  it('nur eine Aktion pro Phase, neue Phase gibt sie frei', () => {
    const { c, goal } = withGoal();
    const first = completeMilestone(c, goal.id, goal.milestones[0].id).character;
    const second = completeMilestone(first, goal.id, goal.milestones[1].id);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('used');
    expect(completeMilestone(newPhase(first), goal.id, goal.milestones[1].id).ok).toBe(true);
  });

  it('zu wenig Gold: keine Buchung', () => {
    const { c, goal } = withGoal({ gp: 10 });
    const r = completeMilestone(c, goal.id, goal.milestones[0].id);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('gold');
    expect(r.character.gp).toBe(10);
  });

  it('kritisch, entbehrend oder in Genesung: keine Downtime', () => {
    const { c, goal } = withGoal({ deprived: true });
    expect(downtimeBlockers(c)).toEqual(['deprived']);
    expect(completeMilestone(c, goal.id, goal.milestones[0].id).reason).toBe('blocked');
    const hurt = { ...c, deprived: false, str: { max: 12, current: 9 } };
    expect(downtimeBlockers(hurt)).toEqual(['recovering']);
  });

  it('letzter Meilenstein schließt das Ziel ab', () => {
    const { c, goal } = withGoal();
    let cur = c;
    goal.milestones.forEach((m) => { cur = newPhase(completeMilestone(cur, goal.id, m.id).character); });
    expect(goalProgress(cur.downtime[0]).complete).toBe(true);
  });
});

describe('reduceCost', () => {
  // Math.random: face aus sides
  const roll = (face, sides) => vi.spyOn(Math, 'random').mockReturnValueOnce((face - 0.5) / sides);

  it('gelungener WIL-Rettungswurf erlässt die Kosten', () => {
    const { c, goal } = withGoal();
    roll(5, 20);
    const r = reduceCost(c, goal.id, goal.milestones[0].id);
    expect(r.ok).toBe(true);
    expect(r.character.downtime[0].milestones[0]).toMatchObject({ costGp: 0, waived: true });
  });

  it('misslungen: Kosten bleiben', () => {
    const { c, goal } = withGoal();
    roll(19, 20);
    const r = reduceCost(c, goal.id, goal.milestones[0].id);
    expect(r.ok).toBe(false);
    expect(r.character.downtime[0].milestones[0].costGp).toBe(30);
  });
});
