// Nachrichten-Vertrag zwischen Warden (Host) und Spieler:innen.
// Alle Nachrichten haben ein Feld `t` (Typ). Freitext wird beim Rendern escaped.
// Muster aus coc-tool / Mausritter, auf Cairn Table angepasst.

export const ROOM_PREFIX = 'cairn-table-';
export const JOIN_TIMEOUT_MS = 20000;
export const MAX_RECONNECT_ATTEMPTS = 8;
export const SESSION_KEY = 'cairn-table-mp-session';
export const TURN_KEY = 'cairn-table-mp-turn';
export const PARTY_LOG_KEY = 'cairn-table-party-log-on';

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// Spieler:in -> Warden
export const T_STATE = 'state'; //  { character }
export const T_EVENT = 'event'; //  { ev } strukturiert, z.B. { kind:'save', attr, roll, ok }
export const T_SAY = 'say'; //      { text } Freitext an den Warden

// Warden -> Spieler:in
export const T_LOG = 'log'; //      { entry } | { entries } geteiltes Runden-Log
export const T_LOGCFG = 'logcfg'; //{ shared } Warden schaltet das Log an/aus
export const T_NPCS = 'npcs'; //    { npcs: [{ id, name }] } sichtbar geschaltete Gegner (nur Namen)
export const T_STASH = 'stash'; //  { items: [...] } geteilte Tischmitte (Warden ist Autoritaet)
export const T_PARTY = 'party'; //  { members: [{ id, name, hp, str, dex, wil, ... }] } Gruppenuebersicht
export const T_MAP = 'map'; //      { state, you } Kartenzustand (Warden -> Spieler:in, gefiltert)
export const T_MAP_IMG = 'mapImg'; //{ phase:'start'|'chunk'|'end', k, n?, i?, s? } Kartenbild in Stuecken
export const T_MAP_PORTRAITS = 'mapPortraits'; // { portraits: { figId: dataUrl } } Figurenbilder (getrennt vom Zustand)
export const T_GM = 'gmCommand'; // { cmd, ... }

// Spieler:in -> Warden (Tischmitte)
export const T_STASH_ADD = 'stashAdd'; //   { item }   Gegenstand ablegen
export const T_STASH_TAKE = 'stashTake'; // { itemId }  Gegenstand nehmen
export const T_MAP_MOVE = 'mapMove'; //     { id, x, y, propose? }  eigene Figur bewegen / vorschlagen

// Warden -> Spieler:in
export const T_MAP_MOVEFREE = 'mapMoveFree'; // { free }  Zuege ohne Bestaetigung erlaubt?

export const GM_DAMAGE = 'damage'; //   { amount, target: 'hp'|'str'|'dex'|'wil' }
export const GM_HEAL = 'heal'; //       { amount, target: 'hp'|'str'|'dex'|'wil' }
export const GM_GOLD = 'gold'; //       { amount }
export const GM_SAVE = 'save'; //       { attr, reason }
export const GM_FATIGUE = 'fatigue'; // {} eine Erschoepfung ins Inventar
export const GM_CONDITION = 'condition'; // { key } Zustand zuweisen
export const GM_DEPRIVED = 'deprived'; // { on }
export const GM_PANICKED = 'panicked'; // { on }
export const GM_REST = 'rest'; //       { kind: 'short'|'night'|'week' }
export const GM_GIVE = 'give'; //       { item }
export const GM_WHISPER = 'whisper'; // { text }
export const GM_BROADCAST = 'broadcast'; // { text }
export const GM_WEBHOOK = 'webhook'; // { url } Warden teilt seinen Discord-Webhook mit allen

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne I/O/0/1
  let code = '';
  for (let i = 0; i < 4; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function isMessage(m) {
  return m && typeof m === 'object' && typeof m.t === 'string';
}

export function getTurnServer() {
  try {
    const stored = JSON.parse(localStorage.getItem(TURN_KEY) || 'null');
    if (stored && stored.urls) return stored;
  } catch { /* ungueltig */ }
  return null;
}

export function setTurnServer(server) {
  try {
    if (server && server.urls) localStorage.setItem(TURN_KEY, JSON.stringify(server));
    else localStorage.removeItem(TURN_KEY);
  } catch { /* ignorieren */ }
}

export function peerConfig() {
  const iceServers = [...STUN_SERVERS];
  const turn = getTurnServer();
  if (turn) iceServers.push(turn);
  return { config: { iceServers } };
}
