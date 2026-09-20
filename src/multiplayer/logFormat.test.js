import { describe, expect, it } from 'vitest';
import { formatLogEntry, entryTone } from './logFormat.js';

const tt = (key, vars) => {
  const map = {
    'attr.str': 'STR', 'dice.saveVs': '{attr} save', 'dice.success': 'ok', 'dice.fail': 'fail',
    'res.hp': 'HP', 'sheet.scars': 'Scars', 'inv.fatigueAdded': 'Fatigue added',
    'rest.short': 'Short rest',
  };
  let s = map[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return s;
};

describe('formatLogEntry', () => {
  it('system-Eintrag laeuft durch t(key, vars)', () => {
    const spy = (key, vars) => `${key}|${vars?.name ?? ''}`;
    expect(formatLogEntry({ kind: 'system', key: 'mp.log.joined', vars: { name: 'Alba' } }, spy))
      .toBe('mp.log.joined|Alba');
  });

  it('say-Eintrag: Name + Text', () => {
    expect(formatLogEntry({ kind: 'say', playerName: 'Alba', text: 'hallo' }, tt)).toBe('Alba: hallo');
  });

  it('gm-Eintrag nutzt text direkt', () => {
    expect(formatLogEntry({ kind: 'gm', text: 'Warden: boo' }, tt)).toBe('Warden: boo');
  });

  it('event save: formatiert Wurf gegen Zielwert', () => {
    const out = formatLogEntry({
      kind: 'event', playerName: 'Alba', ev: { kind: 'save', attr: 'str', roll: 7, target: 10, ok: true },
    }, tt);
    expect(out).toContain('Alba:');
    expect(out).toContain('7');
    expect(out).toContain('≤');
  });

  it('event damage: Vorzeichen und Ziel', () => {
    const out = formatLogEntry({ kind: 'event', ev: { kind: 'damage', amount: 3, target: 'hp' } }, tt);
    expect(out).toContain('−3');
    expect(out).toContain('HP');
  });

  it('event note: reiner Text', () => {
    expect(formatLogEntry({ kind: 'event', ev: { kind: 'note', text: 'x' } }, tt)).toBe('x');
  });
});

describe('entryTone', () => {
  it('gelungener/misslungener Save', () => {
    expect(entryTone({ kind: 'event', ev: { kind: 'save', ok: true } })).toBe('ok');
    expect(entryTone({ kind: 'event', ev: { kind: 'save', ok: false } })).toBe('bad');
  });

  it('Schaden ist bad, Heilung ist ok', () => {
    expect(entryTone({ kind: 'event', ev: { kind: 'damage' } })).toBe('bad');
    expect(entryTone({ kind: 'event', ev: { kind: 'heal' } })).toBe('ok');
  });

  it('say/system/gm', () => {
    expect(entryTone({ kind: 'say' })).toBe('say');
    expect(entryTone({ kind: 'system' })).toBe('system');
    expect(entryTone({ kind: 'gm', tone: 'bad' })).toBe('bad');
  });
});
