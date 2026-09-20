// Reine Wuerfel-Funktionen fuer Cairn. Kein DOM, kein State.

// Wuerfel-Notation fuer die Anzeige. Deutsch schreibt "W6", Englisch "d6" —
// `mark` kommt darum aus der Sprache (t('dice.die')). Ersetzt nur "d" vor einer
// Ziffer, nicht das "d" in "dagger" o.Ae.
export const toW = (s, mark = 'd') => String(s ?? '').replace(/d(?=\d)/g, mark);

export function rollDie(sides = 6) {
  return 1 + Math.floor(Math.random() * sides);
}

export function rollDice(count, sides = 6) {
  const dice = Array.from({ length: count }, () => rollDie(sides));
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
}

// Cairn-Attributwurf: 3W6 addieren (3-18).
export function rollAttribute() {
  const dice = [rollDie(6), rollDie(6), rollDie(6)];
  return { dice, value: dice.reduce((a, b) => a + b, 0) };
}

// Rettungswurf: W20. 1 ist immer Erfolg, 20 immer Fehlschlag, sonst Wurf <= Attribut.
// Kein Vorteil/Nachteil: Cairn kennt kein "zweimal wuerfeln" fuer Saves — laut
// Regelwerk regelt der Warden sowas ueber die Fiktion (angepasster Zielwert,
// erlassener Save o. Ae.), nicht ueber einen zusaetzlichen Wuerfelwurf.
export function rollSave(attrValue) {
  const d = rollDie(20);
  const ok = d === 1 ? true : d === 20 ? false : d <= attrValue;
  return { d, dice: [d], target: attrValue, ok, nat1: d === 1, nat20: d === 20 };
}

// Cairn-Waffenklassen. "d6+d6" = Doppelwaffe (beide werfen, hoeheren nehmen).
export const DAMAGE_DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];

function parseDamage(expr) {
  // Nur die Wuerfelgroesse nach jedem "d" nehmen ("d8+d8" -> [8, 8], "2d6" -> [6]).
  const faces = [...String(expr || 'd6').matchAll(/d(\d+)/gi)].map((m) => Number(m[1])).filter((n) => n > 0);
  return faces.length ? faces : [6];
}

// Schadenswurf.
//   expr        Waffen-Ausdruck ("d8", "d6+d6", ...)
//   mode        'normal' | 'impaired' (immer W4) | 'enhanced' (immer W12)
//   attackers   mehrere Angreifer auf dasselbe Ziel: alle werfen, hoechster zaehlt
//   armor       Ruestung des Ziels, wird vom Ergebnis abgezogen (min. 0)
export function rollDamage(expr, { mode = 'normal', attackers = 1, armor = 0 } = {}) {
  let faces;
  if (mode === 'impaired') faces = [4];
  else if (mode === 'enhanced') faces = [12];
  else faces = parseDamage(expr);

  const pool = [];
  for (let i = 0; i < Math.max(1, attackers); i += 1) {
    for (const f of faces) pool.push({ sides: f, roll: rollDie(f) });
  }
  const best = pool.reduce((m, r) => (r.roll > m.roll ? r : m), pool[0]);
  const raw = best.roll;
  const final = Math.max(0, raw - Math.max(0, armor));
  return { pool, raw, armor: Math.max(0, armor), final, mode, expr };
}

// NSC-Reaktion: 2W6 (Cairn 2e).
const REACTION = { 2: 'hostile', 3: 'wary', 4: 'wary', 5: 'wary', 6: 'curious', 7: 'curious', 8: 'curious', 9: 'kind', 10: 'kind', 11: 'kind', 12: 'helpful' };
export function rollReaction() {
  const dice = [rollDie(6), rollDie(6)];
  const total = dice[0] + dice[1];
  return { dice, total, key: REACTION[total] };
}

// Schicksalswuerfel: 1W6, 4+ beguenstigt die SC.
export function rollDieOfFate() {
  const d = rollDie(6);
  return { d, favorsPcs: d >= 4 };
}
