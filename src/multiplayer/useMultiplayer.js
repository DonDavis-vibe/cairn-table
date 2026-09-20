import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import {
  ROOM_PREFIX, JOIN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, SESSION_KEY, PARTY_LOG_KEY,
  T_STATE, T_EVENT, T_SAY, T_GM, T_LOG, T_LOGCFG, T_NPCS, T_STASH, T_STASH_ADD, T_STASH_TAKE, T_PARTY,
  T_MAP, T_MAP_IMG, T_MAP_MOVE, T_MAP_MOVEFREE, T_MAP_PORTRAITS,
  generateRoomCode, isMessage, peerConfig,
} from './protocol.js';

const MAP_CHUNK = 48 * 1024; // Kartenbild in Stuecken — ein DataChannel vertraegt keine MB am Stueck
import { readJSON, writeJSON } from '../utils/storage.js';

// Gruppen-Roster fuer die Spieler:innen — nur Vitalwerte, kein Inventar/Notizen.
function rosterEntry(pid, character) {
  const c = character || {};
  return {
    id: pid,
    name: c.name || '',
    background: c.background || '',
    hp: { current: c.hp?.current ?? 0, max: c.hp?.max ?? 0 },
    str: { current: c.str?.current ?? 0, max: c.str?.max ?? 0 },
    dex: { current: c.dex?.current ?? 0, max: c.dex?.max ?? 0 },
    wil: { current: c.wil?.current ?? 0, max: c.wil?.max ?? 0 },
    deprived: !!c.deprived,
    critical: !!c.critical,
    panicked: !!c.panicked,
    conditions: Object.values(c.items || {}).filter((i) => i.type === 'condition').map((i) => i.name),
  };
}

// Serverloses Multiplayer ueber WebRTC (PeerJS). Der Warden ist Host & Autoritaet:
// feste Peer-ID = Raum-Code, Spieler:innen verbinden sich direkt.

const saveSession = (role, code) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, roomCode: code })); } catch { /* */ }
};
const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
};
const loadSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

let uidSeq = 0;
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${(uidSeq += 1)}`;

// Was der Host an die Spieler:innen spiegelt: Ereignisse und GM-Aktionen (kein Fluestern).
const isShareable = (e) =>
  e.kind === 'event'
  || e.kind === 'say'
  || (e.kind === 'gm' && e.cmd !== 'whisper')
  || (e.kind === 'system' && ['mp.log.joined', 'mp.log.left'].includes(e.key));

export function useMultiplayer() {
  const [role, setRole] = useState(null); // null | 'gm' | 'player'
  const [roomCode, setRoomCode] = useState('');
  const [roomOnline, setRoomOnline] = useState(false);
  const [connectionState, setConnectionState] = useState('idle'); // idle|connecting|connected|error
  const [statusMessage, setStatusMessage] = useState('');
  const [players, setPlayers] = useState({}); // peerId -> { character, lastSeen }
  const [liveLog, setLiveLog] = useState([]);
  const [gmCommand, setGmCommand] = useState(null);
  const [partyLog, setPartyLog] = useState(() => readJSON(PARTY_LOG_KEY, true) !== false);
  const [partyNpcs, setPartyNpcs] = useState([]); // [{ id, name }] — nur Namen
  const [stash, setStash] = useState([]); // Tischmitte — Array von Item-Objekten (Warden ist Autoritaet)
  const [stashEvent, setStashEvent] = useState(null); // { id, kind:'add'|'take', playerName, item }
  const [partyMembers, setPartyMembers] = useState([]); // Spielersicht: die anderen SC (nur Vitalwerte)
  const [mapState, setMapState] = useState(null); // Spielersicht: gefilterter Kartenzustand
  const [mapYou, setMapYou] = useState(null); // Spielersicht: Besitzer-Kennung der eigenen Figur
  const [mapImage, setMapImage] = useState(null); // Spielersicht: Karten-Hintergrundbild (dataURL)
  const [mapPortraits, setMapPortraits] = useState({}); // Spielersicht: { figId: dataUrl }
  const [mapMoveEvent, setMapMoveEvent] = useState(null); // Wardensicht: { id, x, y, peerId, propose, at }
  const [mapMoveFree, setMapMoveFree] = useState(true); // duerfen Spieler:innen ihre Figur ohne Bestaetigung ziehen?
  const [peerJoinNonce, setPeerJoinNonce] = useState(0); // hochgezaehlt bei jedem neuen Beitritt
  const [resyncNonce, setResyncNonce] = useState(0);

  const playersRef = useRef({});
  playersRef.current = players;
  const roleRef = useRef(null);
  roleRef.current = role;
  const partyLogRef = useRef(true);
  partyLogRef.current = partyLog;
  const knownPeersRef = useRef(new Set());
  const liveLogRef = useRef([]);
  liveLogRef.current = liveLog;
  const partyNpcsRef = useRef([]);
  partyNpcsRef.current = partyNpcs;
  const stashRef = useRef([]);
  stashRef.current = stash;
  const mapImgRecvRef = useRef({}); // { k: string[] } — Bildstuecke im Empfang (Spielerseite)
  const mapMoveFreeRef = useRef(true);
  mapMoveFreeRef.current = mapMoveFree;

  const peerRef = useRef(null);
  const hostConnRef = useRef(null);
  const clientConnsRef = useRef({});
  const joinTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectPendingRef = useRef(false);
  const retryJoinAttemptsRef = useRef(0);
  const retryJoinPendingRef = useRef(false);
  const wireHostRef = useRef(null);
  const autoRestoreRef = useRef(false);
  const seenEidsRef = useRef(new Set());

  const pushLog = useCallback((entry) => {
    const full = { id: uid(), time: Date.now(), ...entry };
    setLiveLog((prev) => [full, ...prev].slice(0, 200));
    if (roleRef.current === 'gm' && partyLogRef.current && isShareable(full)) {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) { try { conn.send({ t: T_LOG, eid: uid(), entry: full }); } catch { /* */ } }
      });
    }
  }, []);

  const setPartyLogShared = useCallback((on) => {
    setPartyLog(on);
    writeJSON(PARTY_LOG_KEY, on);
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) { try { conn.send({ t: T_LOGCFG, eid: uid(), shared: on }); } catch { /* */ } }
      });
    }
  }, []);

  // Warden schaltet Gegner fuer die Spieler:innen sichtbar — bewusst NUR die Namen,
  // keine Werte/TP: die Spieler:innen sollen nur wissen, WER da ist.
  const shareNpcs = useCallback((list) => {
    const safe = (list || []).map((n) => ({ id: n.id, name: n.name }));
    setPartyNpcs(safe);
    partyNpcsRef.current = safe;
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) { try { conn.send({ t: T_NPCS, eid: uid(), npcs: safe }); } catch { /* */ } }
      });
    }
  }, []);

  // --- Tischmitte (geteilter Loot) ---
  const broadcastStash = useCallback((items) => {
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) { try { conn.send({ t: T_STASH, eid: uid(), items }); } catch { /* */ } }
    });
  }, []);

  const applyStash = useCallback((next) => {
    setStash(next);
    stashRef.current = next;
    if (roleRef.current === 'gm') broadcastStash(next);
  }, [broadcastStash]);

  // Warden legt gefundenen Loot in die Tischmitte.
  const stashAdd = useCallback((item) => {
    if (item) applyStash([...stashRef.current, item]);
  }, [applyStash]);

  // Warden entfernt einen Gegenstand aus der Tischmitte (verworfen).
  const stashRemove = useCallback((itemId) => {
    applyStash(stashRef.current.filter((it) => it.itemId !== itemId));
  }, [applyStash]);

  // Warden reicht einen Tischmitte-Gegenstand an eine:n Spieler:in.
  const stashGive = useCallback((peerId, itemId) => {
    const item = stashRef.current.find((it) => it.itemId === itemId);
    if (!item) return;
    applyStash(stashRef.current.filter((it) => it.itemId !== itemId));
    const conn = clientConnsRef.current[peerId];
    if (conn && conn.open) { try { conn.send({ t: T_GM, eid: uid(), cmd: 'give', item }); } catch { /* */ } }
  }, [applyStash]);

  // Spieler:in legt einen eigenen Gegenstand ab / nimmt einen aus der Tischmitte.
  const stashDrop = useCallback((item) => {
    const conn = hostConnRef.current;
    if (conn && conn.open && item) conn.send({ t: T_STASH_ADD, eid: uid(), item });
  }, []);
  const stashTake = useCallback((itemId) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_STASH_TAKE, eid: uid(), itemId });
  }, []);
  const clearStashEvent = useCallback(() => setStashEvent(null), []);

  // --- Karte (Warden ist Autoritaet) ---
  // Gefilterter Kartenzustand an alle Spieler:innen; jede bekommt ihre eigene
  // Figur-Kennung mit ("p:<peerId>"), damit sie nur die eigene Figur zieht.
  const broadcastMap = useCallback((safeState) => {
    Object.entries(clientConnsRef.current).forEach(([pid, conn]) => {
      if (conn && conn.open) {
        try { conn.send({ t: T_MAP, eid: uid(), state: safeState, you: `p:${pid}` }); } catch { /* */ }
      }
    });
  }, []);

  const sendMapImageTo = useCallback((conn, dataUrl) => {
    if (!conn || !conn.open) return;
    const k = uid();
    const chunks = [];
    for (let i = 0; i < dataUrl.length; i += MAP_CHUNK) chunks.push(dataUrl.slice(i, i + MAP_CHUNK));
    try {
      conn.send({ t: T_MAP_IMG, phase: 'start', k, n: chunks.length });
      chunks.forEach((s, i) => conn.send({ t: T_MAP_IMG, phase: 'chunk', k, i, s }));
      conn.send({ t: T_MAP_IMG, phase: 'end', k });
    } catch { /* */ }
  }, []);

  const sendMapImage = useCallback((dataUrl) => {
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (dataUrl) sendMapImageTo(conn, dataUrl);
      else if (conn && conn.open) { try { conn.send({ t: T_MAP_IMG, phase: 'clear' }); } catch { /* */ } }
    });
  }, [sendMapImageTo]);

  const mapPortraitsRef = useRef({});
  const sendMapPortraits = useCallback((portraits) => {
    const safe = portraits && typeof portraits === 'object' ? portraits : {};
    mapPortraitsRef.current = safe;
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) { try { conn.send({ t: T_MAP_PORTRAITS, eid: uid(), portraits: safe }); } catch { /* */ } }
    });
  }, []);

  const sendMapMove = useCallback((id, x, y, propose = false) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_MAP_MOVE, eid: uid(), id, x, y, propose });
  }, []);
  const clearMapMoveEvent = useCallback(() => setMapMoveEvent(null), []);

  // Warden schaltet um, ob Spieler:innen ihre Figur frei ziehen duerfen.
  const setMapMoveFreeShared = useCallback((free) => {
    setMapMoveFree(free);
    if (roleRef.current === 'gm') {
      Object.values(clientConnsRef.current).forEach((conn) => {
        if (conn && conn.open) { try { conn.send({ t: T_MAP_MOVEFREE, eid: uid(), free }); } catch { /* */ } }
      });
    }
  }, []);

  // Warden -> Spieler:innen: Gruppenuebersicht (jede:r bekommt die Liste OHNE sich selbst).
  const broadcastParty = useCallback(() => {
    const roster = Object.entries(playersRef.current).map(([pid, p]) => rosterEntry(pid, p.character));
    Object.entries(clientConnsRef.current).forEach(([pid, conn]) => {
      if (conn && conn.open) {
        try { conn.send({ t: T_PARTY, eid: uid(), members: roster.filter((m) => m.id !== pid) }); } catch { /* */ }
      }
    });
  }, []);

  const cleanupPeer = useCallback(() => {
    clearTimeout(joinTimeoutRef.current);
    if (peerRef.current) { try { peerRef.current.destroy(); } catch { /* */ } }
    peerRef.current = null;
    hostConnRef.current = null;
    clientConnsRef.current = {};
    reconnectAttemptsRef.current = 0;
    reconnectPendingRef.current = false;
    retryJoinAttemptsRef.current = 0;
    retryJoinPendingRef.current = false;
  }, []);

  const leaveSession = useCallback(() => {
    cleanupPeer();
    clearSession();
    roleRef.current = null;
    setRole(null);
    setRoomCode('');
    setRoomOnline(false);
    setConnectionState('idle');
    setStatusMessage('');
    setPlayers({});
    setLiveLog([]);
    setGmCommand(null);
    setPartyNpcs([]);
    setStash([]);
    stashRef.current = [];
    setStashEvent(null);
    setPartyMembers([]);
    setMapState(null);
    setMapYou(null);
    setMapImage(null);
    setMapPortraits({});
    mapPortraitsRef.current = {};
    setMapMoveEvent(null);
    setMapMoveFree(true);
    mapImgRecvRef.current = {};
    knownPeersRef.current = new Set();
  }, [cleanupPeer]);

  const reconnectHost = useCallback(() => {
    const peer = peerRef.current;
    if (!peer || peer.destroyed || peer.open || reconnectPendingRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      pushLog({ kind: 'system', key: 'mp.log.serverLost' });
      return;
    }
    const delay = Math.min(2000 * 2 ** reconnectAttemptsRef.current, 30000);
    reconnectAttemptsRef.current += 1;
    reconnectPendingRef.current = true;
    setTimeout(() => {
      if (!peerRef.current || peerRef.current.destroyed || peerRef.current.open) {
        reconnectPendingRef.current = false;
        return;
      }
      try { peerRef.current.reconnect(); } catch { /* */ }
      setTimeout(() => {
        reconnectPendingRef.current = false;
        if (!peerRef.current || peerRef.current.destroyed) return;
        if (peerRef.current.open) {
          reconnectAttemptsRef.current = 0;
          setRoomOnline(true);
          pushLog({ kind: 'system', key: 'mp.log.serverBack' });
        } else reconnectHost();
      }, 3000);
    }, delay);
  }, [pushLog]);

  const handleIncoming = useCallback((peerId, payload) => {
    if (!isMessage(payload)) return;
    if (payload.eid != null) {
      if (seenEidsRef.current.has(payload.eid)) return;
      seenEidsRef.current.add(payload.eid);
      if (seenEidsRef.current.size > 400) {
        seenEidsRef.current = new Set([...seenEidsRef.current].slice(-200));
      }
    }
    const name = playersRef.current[peerId]?.character?.name || '?';

    if (payload.t === T_STATE) {
      setPlayers((prev) => ({ ...prev, [peerId]: { character: payload.character, lastSeen: Date.now() } }));
      if (roleRef.current === 'gm' && !knownPeersRef.current.has(peerId) && payload.character?.name?.trim()) {
        knownPeersRef.current.add(peerId);
        pushLog({ kind: 'system', key: 'mp.log.joined', vars: { name: payload.character.name } });
      }
    } else if (payload.t === T_EVENT) {
      pushLog({ kind: 'event', playerId: peerId, playerName: name, ev: payload.ev });
    } else if (payload.t === T_SAY) {
      pushLog({ kind: 'say', playerId: peerId, playerName: name, text: String(payload.text || '') });
    } else if (payload.t === T_STASH_ADD && payload.item) {
      const next = [...stashRef.current, payload.item];
      setStash(next); stashRef.current = next; broadcastStash(next);
      setStashEvent({ id: uid(), kind: 'add', playerName: name, item: payload.item });
    } else if (payload.t === T_STASH_TAKE && payload.itemId) {
      const item = stashRef.current.find((it) => it.itemId === payload.itemId);
      if (!item) return;
      const next = stashRef.current.filter((it) => it.itemId !== payload.itemId);
      setStash(next); stashRef.current = next; broadcastStash(next);
      const conn = clientConnsRef.current[peerId];
      if (conn && conn.open) { try { conn.send({ t: T_GM, eid: uid(), cmd: 'give', item }); } catch { /* */ } }
      setStashEvent({ id: uid(), kind: 'take', playerName: name, item });
    } else if (payload.t === T_MAP_MOVE) {
      setMapMoveEvent({
        id: payload.id,
        x: payload.x,
        y: payload.y,
        peerId,
        propose: !!payload.propose && !mapMoveFreeRef.current,
        at: Date.now(),
      });
    }
  }, [pushLog, broadcastStash]);

  const hostSession = useCallback((preferredCodeArg) => {
    const preferredCode = typeof preferredCodeArg === 'string' ? preferredCodeArg : undefined;
    cleanupPeer();
    setConnectionState('connecting');
    setStatusMessage(preferredCode ? 'restore' : 'creating');
    setPlayers({});
    setLiveLog([]);

    const code = preferredCode || generateRoomCode();
    const peer = new Peer(ROOM_PREFIX + code, peerConfig());
    peerRef.current = peer;
    let opened = false;

    peer.on('open', () => {
      if (opened) return;
      opened = true;
      reconnectAttemptsRef.current = 0;
      roleRef.current = 'gm';
      setRoomCode(code);
      setRoomOnline(true);
      setRole('gm');
      setConnectionState('connected');
      setStatusMessage('');
      pushLog({ kind: 'system', key: 'mp.log.started', vars: { code } });
      saveSession('gm', code);
    });

    peer.on('disconnected', () => { setRoomOnline(false); reconnectHost(); });

    peer.on('connection', (conn) => {
      const old = clientConnsRef.current[conn.peer];
      if (old && old !== conn) { try { old.close(); } catch { /* */ } }
      conn.on('open', () => {
        try {
          conn.send({ t: T_LOGCFG, eid: uid(), shared: partyLogRef.current });
          if (partyLogRef.current) {
            const backlog = liveLogRef.current.filter(isShareable).slice(0, 40);
            if (backlog.length) conn.send({ t: T_LOG, eid: uid(), entries: backlog });
          }
          if (partyNpcsRef.current.length) conn.send({ t: T_NPCS, eid: uid(), npcs: partyNpcsRef.current });
          if (stashRef.current.length) conn.send({ t: T_STASH, eid: uid(), items: stashRef.current });
          conn.send({ t: T_MAP_MOVEFREE, eid: uid(), free: mapMoveFreeRef.current });
          if (Object.keys(mapPortraitsRef.current).length) {
            conn.send({ t: T_MAP_PORTRAITS, eid: uid(), portraits: mapPortraitsRef.current });
          }
          setTimeout(broadcastParty, 300);
          setPeerJoinNonce((n) => n + 1); // MapPanel schickt der neuen Verbindung die Karte nach
        } catch { /* */ }
      });
      conn.on('data', (data) => handleIncoming(conn.peer, data));
      conn.on('close', () => {
        if (clientConnsRef.current[conn.peer] !== conn) return;
        delete clientConnsRef.current[conn.peer];
        knownPeersRef.current.delete(conn.peer);
        const nm = playersRef.current[conn.peer]?.character?.name;
        if (nm) pushLog({ kind: 'system', key: 'mp.log.left', vars: { name: nm } });
        setPlayers((prev) => { const next = { ...prev }; delete next[conn.peer]; return next; });
      });
      clientConnsRef.current[conn.peer] = conn;
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        clearSession();
        setStatusMessage(preferredCode ? 'idTakenRetry' : 'idTaken');
      } else setStatusMessage(`error:${err.type}`);
      setConnectionState('error');
      setRole(null);
    });
  }, [cleanupPeer, handleIncoming, pushLog, reconnectHost, broadcastParty]);

  const attemptReconnectToHost = useCallback((code) => {
    const peer = peerRef.current;
    if (!peer || peer.destroyed || retryJoinPendingRef.current) return;
    if (retryJoinAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatusMessage('hostGone');
      setConnectionState('error');
      return;
    }
    const delay = Math.min(2000 * 2 ** retryJoinAttemptsRef.current, 30000);
    retryJoinAttemptsRef.current += 1;
    retryJoinPendingRef.current = true;
    setTimeout(() => {
      retryJoinPendingRef.current = false;
      if (!peerRef.current || peerRef.current.destroyed) return;
      const conn = peerRef.current.connect(ROOM_PREFIX + code, { reliable: true });
      wireHostRef.current(conn, code);
    }, delay);
  }, []);

  const wireHostConnection = useCallback((conn, code) => {
    const prev = hostConnRef.current;
    if (prev && prev !== conn) { try { prev.close(); } catch { /* */ } }
    hostConnRef.current = conn;

    conn.on('open', () => {
      clearTimeout(joinTimeoutRef.current);
      retryJoinAttemptsRef.current = 0;
      setRole('player');
      setRoomCode(code);
      setConnectionState('connected');
      setStatusMessage('');
      saveSession('player', code);
      setResyncNonce((n) => n + 1);
    });

    conn.on('data', (payload) => {
      if (!isMessage(payload)) return;
      if (payload.t === T_GM) {
        setGmCommand({ ...payload, id: payload.eid ?? Date.now() + Math.random() });
      } else if (payload.t === T_LOGCFG) {
        setPartyLog(!!payload.shared);
      } else if (payload.t === T_NPCS) {
        setPartyNpcs(Array.isArray(payload.npcs) ? payload.npcs : []);
      } else if (payload.t === T_STASH) {
        setStash(Array.isArray(payload.items) ? payload.items : []);
      } else if (payload.t === T_PARTY) {
        setPartyMembers(Array.isArray(payload.members) ? payload.members : []);
      } else if (payload.t === T_MAP) {
        setMapState(payload.state || null);
        if (payload.you) setMapYou(payload.you);
      } else if (payload.t === T_MAP_MOVEFREE) {
        setMapMoveFree(!!payload.free);
      } else if (payload.t === T_MAP_PORTRAITS) {
        setMapPortraits(payload.portraits && typeof payload.portraits === 'object' ? payload.portraits : {});
      } else if (payload.t === T_MAP_IMG) {
        if (payload.phase === 'clear') {
          setMapImage(null);
        } else if (payload.phase === 'start') {
          mapImgRecvRef.current[payload.k] = Array.from({ length: payload.n }, () => null);
        } else if (payload.phase === 'chunk') {
          const buf = mapImgRecvRef.current[payload.k];
          if (buf) buf[payload.i] = payload.s;
        } else if (payload.phase === 'end') {
          const buf = mapImgRecvRef.current[payload.k];
          delete mapImgRecvRef.current[payload.k];
          if (buf && buf.every((c) => c !== null)) setMapImage(buf.join(''));
        }
      } else if (payload.t === T_LOG) {
        const incoming = payload.entries || (payload.entry ? [payload.entry] : []);
        if (incoming.length) {
          setLiveLog((prev) => {
            const seen = new Set(prev.map((e) => e.id));
            const add = incoming.filter((e) => e && e.id && !seen.has(e.id));
            return add.length ? [...add, ...prev].sort((a, b) => b.time - a.time).slice(0, 200) : prev;
          });
        }
      }
    });

    conn.on('close', () => {
      if (hostConnRef.current !== conn) return;
      hostConnRef.current = null;
      setConnectionState('connecting');
      setStatusMessage('hostInterrupted');
      attemptReconnectToHost(code);
    });

    conn.on('error', () => clearTimeout(joinTimeoutRef.current));
  }, [attemptReconnectToHost]);

  wireHostRef.current = wireHostConnection;

  const joinSession = useCallback((codeInput) => {
    const code = (codeInput || '').trim().toUpperCase();
    if (!code) { setStatusMessage('needCode'); return; }
    cleanupPeer();
    setConnectionState('connecting');
    setStatusMessage('connecting');

    const peer = new Peer(peerConfig());
    peerRef.current = peer;
    let connected = false;

    peer.on('open', () => {
      if (connected) return;
      connected = true;
      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });
      joinTimeoutRef.current = setTimeout(() => {
        if (conn.open) return;
        setStatusMessage('joinFailed');
        setConnectionState('error');
        clearSession();
        conn.close();
      }, JOIN_TIMEOUT_MS);
      wireHostConnection(conn, code);
    });

    peer.on('error', (err) => {
      clearTimeout(joinTimeoutRef.current);
      setConnectionState('error');
      clearSession();
      if (err.type === 'peer-unavailable') setStatusMessage('roomNotFound');
      else if (['network', 'server-error', 'socket-error'].includes(err.type)) setStatusMessage('serverUnreachable');
      else setStatusMessage(`error:${err.type}`);
    });
  }, [cleanupPeer, wireHostConnection]);

  const sendState = useCallback((character) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_STATE, character });
  }, []);

  const sendEvent = useCallback((ev) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_EVENT, ev, eid: uid() });
  }, []);

  const sendSay = useCallback((text) => {
    const conn = hostConnRef.current;
    if (conn && conn.open) conn.send({ t: T_SAY, text, eid: uid() });
  }, []);

  const sendGmCommand = useCallback((peerId, cmd) => {
    const payload = { t: T_GM, eid: uid(), ...cmd };
    if (peerId) {
      const conn = clientConnsRef.current[peerId];
      if (conn && conn.open) conn.send(payload);
      return;
    }
    Object.values(clientConnsRef.current).forEach((conn) => {
      if (conn && conn.open) conn.send(payload);
    });
  }, []);

  const logGmAction = useCallback((entry) => pushLog({ kind: 'gm', ...entry }), [pushLog]);
  const clearGmCommand = useCallback(() => setGmCommand(null), []);

  // Warden spiegelt die Gruppenuebersicht, sobald sich ein Bogen aendert (leicht entprellt).
  useEffect(() => {
    if (roleRef.current !== 'gm') return undefined;
    const id = setTimeout(broadcastParty, 250);
    return () => clearTimeout(id);
  }, [players, broadcastParty]);

  useEffect(() => {
    if (autoRestoreRef.current) return;
    autoRestoreRef.current = true;

    const stored = loadSession();
    if (stored?.role === 'gm' && stored.roomCode) { hostSession(stored.roomCode); return; }
    if (stored?.role === 'player' && stored.roomCode) { joinSession(stored.roomCode); return; }
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url);
      joinSession(joinParam);
    }
  }, [hostSession, joinSession]);

  return {
    role, roomCode, roomOnline, connectionState, statusMessage,
    players, liveLog, partyLog, setPartyLogShared, partyNpcs, shareNpcs, resyncNonce, gmCommand,
    stash, stashEvent, stashAdd, stashRemove, stashGive, stashDrop, stashTake, clearStashEvent,
    partyMembers,
    mapState, mapYou, mapImage, mapPortraits, mapMoveEvent, mapMoveFree, peerJoinNonce,
    broadcastMap, sendMapImage, sendMapMove, sendMapPortraits, clearMapMoveEvent, setMapMoveFreeShared,
    hostSession, joinSession, leaveSession,
    sendState, sendEvent, sendSay, sendGmCommand, logGmAction, clearGmCommand,
  };
}
