// Strukturierte Log-Eintraege -> lokalisierter Text. Jede Seite rendert in ihrer Sprache.

function formatEvent(ev, t) {
  if (!ev || typeof ev !== 'object') return '';
  switch (ev.kind) {
    case 'save': {
      const attr = t(`attr.${ev.attr}`);
      const cmp = ev.ok ? '≤' : '>';
      const verdict = ev.ok ? t('dice.success') : t('dice.fail');
      const reason = ev.reason ? `${ev.reason} · ` : '';
      return `${reason}${t('dice.saveVs', { attr })} — ${t('dice.die')}20 ${ev.roll} ${cmp} ${ev.target} · ${verdict}`;
    }
    case 'roll':
      return `${ev.label || t('dice.damage')} — ${ev.text}`;
    case 'damage':
      return `−${ev.amount} ${ev.target === 'hp' ? t('res.hp') : t(`attr.${ev.target}`)}${ev.note ? ` · ${ev.note}` : ''}`;
    case 'heal':
      return `+${ev.amount} ${ev.target === 'hp' ? t('res.hp') : t(`attr.${ev.target}`)}`;
    case 'rest':
      return `${t(`rest.${ev.restKind}`)} — ${ev.text || ''}`.trim();
    case 'scar':
      return `${t('sheet.scars')}: #${ev.index} ${ev.name}`;
    case 'fatigue':
      return t('inv.fatigueAdded');
    case 'note':
      return ev.text || '';
    default:
      return ev.text || '';
  }
}

export function formatLogEntry(entry, t) {
  if (!entry) return '';
  if (entry.kind === 'system') return t(entry.key, entry.vars);
  if (entry.kind === 'say') return `${entry.playerName}: ${entry.text}`;
  if (entry.kind === 'gm') return entry.text || t(entry.key || '', entry.vars);
  if (entry.kind === 'event') {
    const who = entry.playerName ? `${entry.playerName}: ` : '';
    return `${who}${formatEvent(entry.ev, t)}`;
  }
  return entry.text || '';
}

export function entryTone(entry) {
  if (entry.kind === 'gm') return entry.tone || 'gm';
  if (entry.kind === 'say') return 'say';
  if (entry.kind === 'system') return 'system';
  if (entry.kind === 'event') {
    const ev = entry.ev || {};
    if (ev.kind === 'save') return ev.ok ? 'ok' : 'bad';
    if (ev.kind === 'damage' || ev.kind === 'scar' || ev.kind === 'fatigue') return 'bad';
    if (ev.kind === 'heal' || ev.kind === 'rest') return 'ok';
  }
  return 'roll';
}
