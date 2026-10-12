// Macht aus einer Narbeneffekt-Notiz ({ key, vars }, siehe rules/scars.js) Text.
import { loc } from '../i18n/index.jsx';

export function scarNoteText(note, t, lang) {
  const vars = { ...note.vars };
  if (vars.attr) vars.attr = t(`attr.${vars.attr}`);
  if (vars.where && typeof vars.where === 'object') vars.where = loc(vars.where, lang);
  if (vars.what) vars.what = t(`scar.pending.${vars.what}`);
  return t(note.key, vars);
}
