import { useState } from 'react';
import { Check, X, Dices } from 'lucide-react';
import { useLang } from '../i18n/index.jsx';
import { Field, TextInput } from './ui.jsx';
import {
  DOWNTIME_KINDS, MAX_MILESTONES, newGoal, goalProgress, downtimeBlockers,
  completeMilestone, reduceCost, newPhase,
} from '../rules/downtime.js';

// Downtime-Ziele auf dem Bogen (Cairn 2e, Downtime). Meilensteine kommen vom
// Warden (oder man traegt sie selbst ein); jeder kostet eine Downtime-Aktion.
export default function Downtime({ character, setCharacter, pushLog, onEvent }) {
  const { t } = useLang();
  const [draft, setDraft] = useState({ kind: 'research', title: '', link: '', milestones: '' });
  const goals = character.downtime || [];
  const blockers = downtimeBlockers(character);

  const say = (kind, text) => {
    pushLog({ kind, text });
    onEvent?.({ kind: 'note', text });
  };

  const addGoal = () => {
    if (!draft.title.trim()) return;
    const goal = newGoal(draft);
    setCharacter((c) => ({ ...c, downtime: [...(c.downtime || []), goal] }));
    setDraft({ kind: draft.kind, title: '', link: '', milestones: '' });
    say('ok', t('dt.log.goal', { title: goal.title }));
  };
  const removeGoal = (id) => setCharacter((c) => ({ ...c, downtime: c.downtime.filter((g) => g.id !== id) }));
  const editMilestone = (goalId, msId, patch) => setCharacter((c) => ({
    ...c,
    downtime: c.downtime.map((g) => (g.id === goalId
      ? { ...g, milestones: g.milestones.map((m) => (m.id === msId ? { ...m, ...patch } : m)) }
      : g)),
  }));

  // Wuerfe und Log ausserhalb der State-Updater (StrictMode ruft Updater doppelt auf).
  const act = (goal, ms) => {
    const r = completeMilestone(character, goal.id, ms.id);
    if (!r.ok) {
      const key = { blocked: 'dt.blocked', used: 'dt.used', gold: 'dt.noGold', done: 'dt.alreadyDone' }[r.reason];
      if (key) say('warn', t(key, { n: r.need ?? 0 }));
      return;
    }
    setCharacter(r.character);
    say('ok', t('dt.log.done', { goal: goal.title, milestone: ms.text, paid: r.paid ? ` (−${r.paid} ${t('res.gp')})` : '' }));
    if (r.goalComplete) say('ok', t('dt.log.complete', { title: goal.title }));
  };
  const tryReduce = (goal, ms) => {
    const r = reduceCost(character, goal.id, ms.id);
    if (!r.save) return;
    const roll = `${t('dice.die')}20 ${r.save.d} ${r.ok ? '≤' : '>'} ${r.save.target}`;
    if (r.ok) {
      setCharacter(r.character);
      say('ok', t('dt.log.reduced', { milestone: ms.text, roll }));
    } else {
      say('bad', t('dt.log.notReduced', { milestone: ms.text, roll }));
    }
  };
  const phase = () => { setCharacter((c) => newPhase(c)); say('info', t('dt.log.phase')); };

  return (
    <div className="downtime">
      <p className="combat-hint">{t('dt.rules')}</p>

      <div className="combat-bar">
        <span className={`badge${character.downtimeUsed ? ' badge-dmg' : ''}`}>
          {character.downtimeUsed ? t('dt.actionUsed') : t('dt.actionFree')}
        </span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={phase} disabled={!character.downtimeUsed}>{t('dt.newPhase')}</button>
      </div>
      {blockers.length ? (
        <p className="res-warn">{t('dt.blockedBy', { why: blockers.map((b) => t(`dt.blocker.${b}`)).join(', ') })}</p>
      ) : null}

      {goals.length === 0 ? <p className="gm-gen-empty">{t('dt.empty')}</p> : null}
      <ul className="combat-list">
        {goals.map((g) => {
          const p = goalProgress(g);
          return (
            <li key={g.id} className={`combat-foe${p.complete ? ' is-down' : ''}`}>
              <div className="combat-foe-head">
                <span className="badge">{t(`dt.kind.${g.kind}`)}</span>
                <strong>{g.title}</strong>
                <span className="badge">{p.done}/{p.total}</span>
                <button type="button" className="item-x" onClick={() => removeGoal(g.id)} aria-label={t('common.remove')}><X size={12} /></button>
              </div>
              {g.link ? <p className="combat-note">{t(`dt.link.${g.kind}`)}: {g.link}</p> : null}
              <ul className="dt-milestones">
                {g.milestones.map((m) => (
                  <li key={m.id} className={m.done ? 'dt-done' : ''}>
                    {m.done ? <Check size={13} /> : null}
                    <span className="dt-text">{m.text}</span>
                    {m.done ? null : (
                      <>
                        <label className="mini-num">{t('res.gp')}
                          <input type="number" min="0" value={m.costGp} onChange={(e) => editMilestone(g.id, m.id, { costGp: Math.max(0, Number(e.target.value) || 0) })} />
                        </label>
                        {m.costText ? <span className="badge">{m.costText}</span> : null}
                        {m.waived ? <span className="badge">{t('dt.waived')}</span> : null}
                        <button type="button" className="btn btn-sm" onClick={() => act(g, m)} disabled={character.downtimeUsed || blockers.length > 0}>{t('dt.act')}</button>
                        {m.costGp > 0 || m.costText ? (
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => tryReduce(g, m)} title={t('dt.reduceHint')}>
                            <Dices size={12} /> {t('dt.reduce')}
                          </button>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="custom-row">
        <select className="text-input" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))} aria-label={t('dt.kindLabel')}>
          {DOWNTIME_KINDS.map((k) => <option key={k} value={k}>{t(`dt.kind.${k}`)}</option>)}
        </select>
        <TextInput value={draft.title} onChange={(title) => setDraft((d) => ({ ...d, title }))} placeholder={t('dt.titlePlaceholder')} />
        <TextInput value={draft.link} onChange={(link) => setDraft((d) => ({ ...d, link }))} placeholder={t(`dt.link.${draft.kind}`)} />
      </div>
      <Field label={t('dt.milestonesLabel', { max: MAX_MILESTONES })} hint={t('dt.milestonesHint')}>
        <textarea className="notes" rows={3} value={draft.milestones} onChange={(e) => setDraft((d) => ({ ...d, milestones: e.target.value }))} />
      </Field>
      <button type="button" className="btn btn-sm btn-primary" disabled={!draft.title.trim()} onClick={addGoal}>{t('dt.addGoal')}</button>
    </div>
  );
}
