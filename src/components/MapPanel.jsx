import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  Map as MapIcon, Image, Hand, Ruler, Pencil, Eraser, Users, Plus, Maximize,
  Eye, EyeOff, Grid3x3, Undo2, Check, Trash2, SquarePen,
} from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { BattleMap } from '../map/battleMap.js';

const MAP_OPEN_KEY = 'cairn-table-map-open';
const MAP_STATE_KEY = 'cairn-table-map-v1'; // Wardensicht: Karte ueber einen Reload retten

function colorFor(s) {
  let h = 0;
  for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 52% 56%)`;
}

const MARK_COLORS = ['#f0c069', '#6fa84a', '#4a90d4', '#c4569e', '#b8462f'];

// Anzeige-Punkt kraeftig, gezeichnet wird die halbdurchsichtige Linie.
const GRID_COLORS = [
  { dot: '#d4a24c', line: 'rgba(212,162,76,0.32)' },
  { dot: '#ffffff', line: 'rgba(255,255,255,0.42)' },
  { dot: '#111111', line: 'rgba(0,0,0,0.55)' },
  { dot: '#5aa0ff', line: 'rgba(90,160,255,0.48)' },
  { dot: '#5fcf5f', line: 'rgba(95,207,95,0.46)' },
  { dot: '#e65a5a', line: 'rgba(230,90,90,0.46)' },
];
const GRID_DEFAULT = {
  rasterGroesse: 50, rasterVersatzX: 0, rasterVersatzY: 0,
  rasterSichtbar: true, einrasten: true, rasterFarbe: GRID_COLORS[0].line,
};

const EMPTY_MAP_STATE = () => ({
  figuren: [], formen: [], nebel: { aktiv: false, aufgedeckt: [], entwurf: [] },
});
const newMapId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export default function MapPanel({ mp }) {
  const { t, lang } = useLang();
  const {
    role, players, partyNpcs,
    broadcastMap, sendMapImage, sendMapMove, sendMapPortraits, clearMapMoveEvent, setMapMoveFreeShared,
    mapState, mapYou, mapImage, mapPortraits, mapMoveEvent, mapMoveFree, peerJoinNonce,
  } = mp;
  const isGm = role === 'gm';

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(MAP_OPEN_KEY) === '1'; } catch { return false; }
  });
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const fileRef = useRef(null);
  const imgRef = useRef(null); // Wardensicht: aktuelle Hintergrund-dataURL
  const isGmRef = useRef(isGm);
  isGmRef.current = isGm;
  // Leinwand-Beschriftungen in der aktuellen Sprache. Als Ref, damit ein
  // Sprachwechsel bei offener Karte beim nächsten Zeichnen greift.
  const numFmt = (n) => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US');
  const sq = (n) => `${numFmt(n)} ${n === 1 ? t('map.canvas.square') : t('map.canvas.squares')}`;
  const canvasTexts = {
    leer: t('map.canvas.empty'),
    distanz: (felder, wert, einheit) => `${sq(felder)} · ${numFmt(wert)}${einheit}`,
    radius: (felder, wert, einheit) => `${t('map.canvas.radius')} ${sq(felder)} · ${numFmt(wert)}${einheit}`,
    flaeche: (b, h) => `${numFmt(b)} × ${numFmt(h)} ${t('map.canvas.squares')}`,
  };
  const canvasTextsRef = useRef(canvasTexts);
  useEffect(() => { canvasTextsRef.current = canvasTexts; });
  const pushTimer = useRef(null);
  const saveTimer = useRef(null);
  // Wardensicht: mehrere Karten. Die aktive liegt in der BattleMap-Instanz,
  // die uebrigen als { state, image, portraits } im store.
  const mapsRef = useRef({ list: [{ id: 'm0', name: '' }], activeId: 'm0', store: {} });

  const [tool, setTool] = useState('zeigen');
  const [ready, setReady] = useState(false);
  const [markColor, setMarkColor] = useState(MARK_COLORS[0]);
  const [pendingFog, setPendingFog] = useState(0);
  const [pendingMoves, setPendingMoves] = useState([]); // Wardensicht: offene Zugvorschlaege
  const [maps, setMaps] = useState([{ id: 'm0', name: '' }]);
  const [activeMapId, setActiveMapId] = useState('m0');
  const [grid, setGrid] = useState(GRID_DEFAULT);
  const [gridOpen, setGridOpen] = useState(false);
  const [status, setStatus] = useState('');

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      try { localStorage.setItem(MAP_OPEN_KEY, next ? '1' : '0'); } catch { /* */ }
      return next;
    });
  };

  // Warden: gefilterten Zustand an alle Spieler:innen (leicht entprellt)
  const pushMap = useCallback(() => {
    if (!isGmRef.current || !mapRef.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (mapRef.current) broadcastMap(mapRef.current.getStateFuerSpieler());
    }, 120);
  }, [broadcastMap]);

  const refreshFog = useCallback(() => {
    if (!mapRef.current) return;
    setPendingFog(mapRef.current.offeneNebelBereiche());
    if (isGmRef.current) setPendingMoves(mapRef.current.offeneZuege());
  }, []);

  // Aktuellen Leinwand-Stand in den store-Eintrag der aktiven Karte zurueckschreiben.
  const snapshotActive = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const m = mapsRef.current;
    m.store[m.activeId] = {
      state: map.getState(),
      image: imgRef.current || null,
      portraits: map.getFigurBilder(),
    };
  }, []);

  // Warden: alle Karten lokal sichern, damit ein Reload sie nicht verliert (entprellt)
  const persist = useCallback(() => {
    if (!isGmRef.current || !mapRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!mapRef.current) return;
      snapshotActive();
      try {
        localStorage.setItem(MAP_STATE_KEY, JSON.stringify({ v: 2, ...mapsRef.current }));
      } catch { /* Quota / privater Modus */ }
    }, 400);
  }, [snapshotActive]);

  // --- Karte erzeugen, wenn das Panel geoeffnet wird ---
  useEffect(() => {
    if (!open) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const map = BattleMap.create(canvas, {
      einheit: 1,
      einheitName: 'm',
      bestaetigungNoetig: false,
      texte: {
        leer: () => canvasTextsRef.current.leer,
        distanz: (...a) => canvasTextsRef.current.distanz(...a),
        radius: (...a) => canvasTextsRef.current.radius(...a),
        flaeche: (...a) => canvasTextsRef.current.flaeche(...a),
      },
      onChange: () => { if (isGmRef.current) { pushMap(); refreshFog(); persist(); } },
      onLokaleFigur: (f) => { if (!isGmRef.current) sendMapMove(f.id, f.x, f.y, false); },
      onZugVorschlag: (f) => { if (!isGmRef.current) sendMapMove(f.id, f.geplantX, f.geplantY, true); },
    });
    mapRef.current = map;
    map.setNebelDeckend(!isGmRef.current);
    if (!isGmRef.current) map.setBesitzer(null); // bis "you" bekannt ist: nichts bewegen
    map.setWerkzeug('zeigen');
    setTool('zeigen');

    // Warden: gesicherte Karten nach einem Reload wiederherstellen
    if (isGmRef.current) {
      try {
        const saved = JSON.parse(localStorage.getItem(MAP_STATE_KEY) || 'null');
        let coll = null;
        if (saved && saved.v === 2 && Array.isArray(saved.list) && saved.list.length) {
          coll = { list: saved.list, activeId: saved.activeId, store: saved.store || {} };
        } else if (saved && saved.state) {
          // altes Einzelkarten-Format -> in eine Sammlung migrieren
          const id = 'm0';
          coll = {
            list: [{ id, name: '' }],
            activeId: id,
            store: { [id]: { state: saved.state, image: saved.image || null, portraits: saved.portraits || {} } },
          };
        }
        if (coll) {
          mapsRef.current = coll;
          setMaps([...coll.list]);
          setActiveMapId(coll.activeId);
          const entry = coll.store[coll.activeId];
          if (entry && entry.state) {
            imgRef.current = entry.image || null;
            map.applyState(entry.state, entry.image || null);
            Object.entries(entry.portraits || {}).forEach(([id, url]) => map.setFigurBild(id, url));
            if (entry.portraits) sendMapPortraits(entry.portraits);
            setTimeout(() => { if (mapRef.current) mapRef.current.einpassen(); }, 90);
          }
        }
      } catch { /* */ }
    }

    syncGrid();
    setReady(true);
    setTimeout(() => map.zeichnen(), 40);

    return () => {
      clearTimeout(pushTimer.current);
      clearTimeout(saveTimer.current);
      map.zerstoeren?.();
      mapRef.current = null;
      setReady(false);
    };
  }, [open, pushMap, refreshFog, persist, sendMapMove, sendMapPortraits]);

  // --- Spielersicht: empfangenen Zustand / Bild / Kennung anwenden ---
  useEffect(() => {
    if (isGm || !ready || !mapRef.current || !mapState) return;
    mapRef.current.applyState(mapState);
  }, [mapState, ready, isGm]);

  useEffect(() => {
    if (isGm || !ready || !mapRef.current) return;
    mapRef.current.setBild(mapImage || null);
    if (mapImage) setTimeout(() => mapRef.current && mapRef.current.einpassen(), 60);
  }, [mapImage, ready, isGm]);

  useEffect(() => {
    if (isGm || !ready || !mapRef.current || !mapYou) return;
    mapRef.current.setBesitzer(mapYou);
    mapRef.current.setBestaetigung(!mapMoveFree);
  }, [mapYou, mapMoveFree, ready, isGm]);

  useEffect(() => {
    if (isGm || !ready || !mapRef.current) return;
    Object.entries(mapPortraits || {}).forEach(([id, url]) => mapRef.current.setFigurBild(id, url));
  }, [mapPortraits, ready, isGm]);

  // --- Wardensicht: Figurenzug einer Spielerin anwenden ---
  useEffect(() => {
    if (!isGm || !ready || !mapRef.current || !mapMoveEvent) return;
    const {
      id, x, y, peerId, propose,
    } = mapMoveEvent;
    const map = mapRef.current;
    const fig = map.figuren.find((f) => f.id === id);
    if (fig && fig.besitzer === `p:${peerId}`) {
      if (propose) {
        fig.geplantX = x;
        fig.geplantY = y;
        map.zeichnen();
      } else {
        map.addFigur({
          ...fig, x, y, geplantX: null, geplantY: null,
        });
      }
      setPendingMoves(map.offeneZuege());
      pushMap();
    }
    clearMapMoveEvent();
  }, [mapMoveEvent, ready, isGm, clearMapMoveEvent, pushMap]);

  // --- Wardensicht: neuer Beitritt -> Karte + Bild nachreichen ---
  useEffect(() => {
    if (!isGm || !ready || !peerJoinNonce) return;
    if (mapRef.current) broadcastMap(mapRef.current.getStateFuerSpieler());
    if (imgRef.current) sendMapImage(imgRef.current);
  }, [peerJoinNonce, ready, isGm, broadcastMap, sendMapImage]);

  // --- Warden-Aktionen ---
  const pickTool = (name) => {
    if (!mapRef.current) return;
    mapRef.current.setWerkzeug(name);
    setTool(name);
    setStatus(t(`map.hint.${name}`) || '');
  };

  const loadImage = (file) => {
    if (!file || !mapRef.current) return;
    setStatus(t('map.preparing'));
    BattleMap.bildVerkleinern(file).then((res) => {
      imgRef.current = res.dataUrl;
      mapRef.current.setBild(res.dataUrl);
      setTimeout(() => mapRef.current && mapRef.current.einpassen(), 50);
      sendMapImage(res.dataUrl);
      pushMap();
      persist();
      setStatus(`${res.breite}×${res.hoehe}`);
    }).catch(() => setStatus(t('map.imgError')));
  };

  const addPlayers = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.sichtbaresZentrum();
    Object.entries(players || {}).forEach(([pid, p], i) => {
      const id = `p:${pid}`;
      if (!map.figuren.find((f) => f.id === id)) {
        map.addFigur({
          id,
          name: p.character?.name || t('gm.unnamed'),
          farbe: colorFor(pid),
          besitzer: id,
          x: c.x + (i % 4),
          y: c.y + Math.floor(i / 4),
          groesse: 1,
        });
      }
      if (p.character?.portrait) map.setFigurBild(id, p.character.portrait);
    });
    sendMapPortraits(map.getFigurBilder());
  };

  const addFoes = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.sichtbaresZentrum();
    (partyNpcs || []).forEach((n, i) => {
      const id = `foe:${n.id}`;
      if (map.figuren.find((f) => f.id === id)) return;
      map.addFigur({
        id, name: loc(n.name, lang), farbe: '#9a3b1f', besitzer: 'sl', x: c.x + (i % 4), y: c.y - 1 - Math.floor(i / 4), groesse: 1,
      });
    });
  };

  const addMarker = () => {
    const map = mapRef.current;
    if (!map) return;
    const name = window.prompt(t('map.markerName'), t('map.marker'));
    if (!name) return;
    const c = map.sichtbaresZentrum();
    const n = map.figuren.length;
    map.addFigur({
      id: `m:${Date.now()}`, name, farbe: '#8c6a2e', besitzer: 'sl', x: c.x + (n % 3), y: c.y + Math.floor(n / 3), groesse: 1,
    });
  };

  const clearFigures = () => {
    if (mapRef.current && window.confirm(t('map.clearFiguresConfirm'))) mapRef.current.figurenLoeschen();
  };

  const resetMap = () => {
    const map = mapRef.current;
    if (!map || !window.confirm(t('map.resetConfirm'))) return;
    Object.keys(map.getFigurBilder()).forEach((fid) => map.setFigurBild(fid, null));
    imgRef.current = null;
    map.applyState(EMPTY_MAP_STATE(), null);
    sendMapImage(null);
    sendMapPortraits({});
    pushMap();
    refreshFog();
    persist();
    setStatus('');
  };

  // --- Mehrere Karten ---
  const applyMapEntry = (entry) => {
    const map = mapRef.current;
    const e = entry || { state: EMPTY_MAP_STATE(), image: null, portraits: {} };
    imgRef.current = e.image || null;
    map.applyState(e.state || EMPTY_MAP_STATE(), e.image || null);
    const union = new Set([
      ...Object.keys(map.getFigurBilder()),
      ...Object.keys(e.portraits || {}),
    ]);
    union.forEach((fid) => map.setFigurBild(fid, (e.portraits || {})[fid] || null));
    setTimeout(() => { if (mapRef.current) mapRef.current.einpassen(); }, 60);
    sendMapImage(e.image || null);
    sendMapPortraits(map.getFigurBilder());
    pushMap();
    refreshFog();
    syncGrid();
    persist();
  };

  function syncGrid() {
    const r = mapRef.current && mapRef.current.raster;
    if (r) {
      setGrid({
        rasterGroesse: r.rasterGroesse,
        rasterVersatzX: r.rasterVersatzX,
        rasterVersatzY: r.rasterVersatzY,
        rasterSichtbar: r.rasterSichtbar,
        einrasten: r.einrasten,
        rasterFarbe: r.rasterFarbe || GRID_COLORS[0].line,
      });
    }
  }

  const applyGrid = (partial) => {
    if (!mapRef.current) return;
    mapRef.current.setRaster(partial);
    setGrid((g) => ({ ...g, ...partial }));
  };
  const nudgeGrid = (key, delta, min, max) => {
    const cur = Number(grid[key]) || 0;
    const next = Math.max(min, Math.min(max, cur + delta));
    applyGrid({ [key]: next });
  };

  const switchMap = (id) => {
    const m = mapsRef.current;
    if (!mapRef.current || id === m.activeId || !m.list.find((x) => x.id === id)) return;
    snapshotActive();
    m.activeId = id;
    setActiveMapId(id);
    applyMapEntry(m.store[id]);
  };

  const addMap = () => {
    const m = mapsRef.current;
    const name = (window.prompt(t('map.mapNamePrompt'), `${t('map.mapDefault')} ${m.list.length + 1}`) || '').trim();
    if (!name) return;
    snapshotActive();
    const id = newMapId();
    m.list.push({ id, name });
    m.store[id] = { state: EMPTY_MAP_STATE(), image: null, portraits: {} };
    m.activeId = id;
    setMaps([...m.list]);
    setActiveMapId(id);
    applyMapEntry(m.store[id]);
  };

  const renameMap = () => {
    const m = mapsRef.current;
    const cur = m.list.find((x) => x.id === m.activeId);
    const name = (window.prompt(t('map.mapRenamePrompt'), cur?.name || '') || '').trim();
    if (!name) return;
    m.list = m.list.map((x) => (x.id === m.activeId ? { ...x, name } : x));
    setMaps([...m.list]);
    persist();
  };

  const deleteMap = () => {
    const m = mapsRef.current;
    if (m.list.length < 2 || !window.confirm(t('map.mapDeleteConfirm'))) return;
    const gone = m.activeId;
    const next = m.list.find((x) => x.id !== gone).id;
    m.list = m.list.filter((x) => x.id !== gone);
    delete m.store[gone];
    m.activeId = next;
    setMaps([...m.list]);
    setActiveMapId(next);
    applyMapEntry(m.store[next]);
  };

  const fogAllOn = () => { mapRef.current?.nebelAllesZudecken(); refreshFog(); };
  const fogAllOff = () => { mapRef.current?.nebelAllesAufdecken(); refreshFog(); };
  const fogReveal = () => { mapRef.current?.nebelFreigeben(); refreshFog(); };
  const undo = () => { mapRef.current?.rueckgaengig(); refreshFog(); };

  const confirmMove = (id) => { mapRef.current?.zugBestaetigen(id); refreshFog(); };
  const rejectMove = (id) => { mapRef.current?.zugVerwerfen(id); refreshFog(); };
  const toggleMoveFree = () => setMapMoveFreeShared(!mapMoveFree);
  const fit = () => mapRef.current?.einpassen();

  const wardenTool = (name, Icon, key) => (
    <button
      type="button"
      className={`map-tool${tool === name ? ' on' : ''}`}
      onClick={() => pickTool(name)}
      title={t(key)}
      aria-label={t(key)}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="mappanel">
      <button type="button" className="btn btn-ghost btn-sm map-toggle" onClick={toggleOpen}>
        <MapIcon size={15} /> {open ? t('map.hide') : t('map.show')}
      </button>

      {open ? (
        <div className="map-wrap">
          {isGm ? (
            <div className="map-tools map-maps">
              <span className="field-label">{t('map.activeMap')}</span>
              <select
                className="text-input map-map-sel"
                value={activeMapId}
                onChange={(e) => switchMap(e.target.value)}
              >
                {maps.map((mm, i) => (
                  <option key={mm.id} value={mm.id}>{mm.name || `${t('map.mapDefault')} ${i + 1}`}</option>
                ))}
              </select>
              <button type="button" className="btn btn-sm" onClick={addMap}><Plus size={13} /> {t('map.mapNew')}</button>
              <button type="button" className="map-tool" onClick={renameMap} title={t('map.mapRename')}><SquarePen size={13} /></button>
              <button type="button" className="map-tool" onClick={deleteMap} disabled={maps.length < 2} title={t('map.mapDelete')}><Trash2 size={13} /></button>
            </div>
          ) : null}

          {isGm ? (
            <div className="map-tools">
              <button type="button" className="btn btn-sm btn-primary" onClick={() => fileRef.current?.click()}>
                <Image size={14} /> {t('map.loadImage')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { loadImage(e.target.files?.[0]); e.target.value = ''; }}
              />
              <button type="button" className="btn btn-sm" onClick={addPlayers} title={t('map.addPlayers')}>
                <Users size={14} /> {t('map.players')}
              </button>
              {partyNpcs?.length ? (
                <button type="button" className="btn btn-sm" onClick={addFoes} title={t('map.addFoes')}>
                  <Plus size={14} /> {t('map.foes')}
                </button>
              ) : null}
              <button type="button" className="btn btn-sm" onClick={addMarker}>
                <Plus size={14} /> {t('map.marker')}
              </button>

              <span className="map-tool-group">
                {wardenTool('zeigen', Hand, 'map.tool.move')}
                {wardenTool('messen', Ruler, 'map.tool.measure')}
                {wardenTool('malen', Pencil, 'map.tool.draw')}
                {wardenTool('radieren', Eraser, 'map.tool.erase')}
                <button type="button" className="map-tool" onClick={undo} title={t('map.undo')}><Undo2 size={14} /></button>
              </span>

              {tool === 'malen' ? (
                <span className="map-tool-group">
                  {MARK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`map-swatch${markColor === c ? ' on' : ''}`}
                      style={{ background: c }}
                      onClick={() => { setMarkColor(c); mapRef.current?.setMalFarbe(c); }}
                      aria-label={c}
                    />
                  ))}
                </span>
              ) : null}

              <span className="map-tool-group">
                {wardenTool('nebel-auf', Eye, 'map.tool.fogOn')}
                {wardenTool('nebel-zu', EyeOff, 'map.tool.fogOff')}
                <button type="button" className="btn btn-sm btn-ghost" onClick={fogAllOn}>{t('map.fogAll')}</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={fogAllOff}>{t('map.fogNone')}</button>
              </span>

              <button
                type="button"
                className={`btn btn-sm${mapMoveFree ? ' btn-ghost' : ' map-tool on'}`}
                onClick={toggleMoveFree}
                title={t('map.moveFreeHint')}
              >
                {mapMoveFree ? `🔓 ${t('map.moveFree')}` : `🔒 ${t('map.moveCheck')}`}
              </button>
              <button
                type="button"
                className={`map-tool${gridOpen ? ' on' : ''}`}
                onClick={() => setGridOpen((v) => !v)}
                title={t('map.grid')}
                aria-label={t('map.grid')}
              >
                <Grid3x3 size={14} />
              </button>
              <button type="button" className="map-tool" onClick={fit} title={t('map.fit')}><Maximize size={14} /></button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={clearFigures}>{t('map.clearFigures')}</button>
              <button type="button" className="btn btn-sm btn-ghost map-danger" onClick={resetMap}>{t('map.reset')}</button>
            </div>
          ) : (
            <div className="map-tools">
              {wardenTool('zeigen', Hand, 'map.tool.move')}
              {wardenTool('messen', Ruler, 'map.tool.measure')}
              <button type="button" className="map-tool" onClick={fit} title={t('map.fit')}><Maximize size={14} /></button>
              <span className="hint">{t('map.playerHint')}</span>
            </div>
          )}

          {isGm && gridOpen ? (
            <div className="map-grid-panel">
              <label className="map-grid-row">
                <input
                  type="checkbox"
                  checked={grid.rasterSichtbar}
                  onChange={(e) => applyGrid({ rasterSichtbar: e.target.checked })}
                />
                {t('map.gridShow')}
              </label>
              <label className="map-grid-row">
                <input
                  type="checkbox"
                  checked={grid.einrasten}
                  onChange={(e) => applyGrid({ einrasten: e.target.checked })}
                />
                {t('map.gridSnap')}
              </label>

              <span className="map-grid-num">
                <span className="field-label">{t('map.gridSize')}</span>
                <button type="button" onClick={() => nudgeGrid('rasterGroesse', -1, 4, 400)}>−</button>
                <input
                  type="number"
                  min="4"
                  max="400"
                  value={grid.rasterGroesse}
                  onChange={(e) => applyGrid({ rasterGroesse: Math.max(4, Math.min(400, Number(e.target.value) || 4)) })}
                />
                <button type="button" onClick={() => nudgeGrid('rasterGroesse', 1, 4, 400)}>+</button>
              </span>

              <span className="map-grid-num">
                <span className="field-label">{t('map.gridOffX')}</span>
                <button type="button" onClick={() => nudgeGrid('rasterVersatzX', -1, -999, 999)}>−</button>
                <input
                  type="number"
                  value={grid.rasterVersatzX}
                  onChange={(e) => applyGrid({ rasterVersatzX: Number(e.target.value) || 0 })}
                />
                <button type="button" onClick={() => nudgeGrid('rasterVersatzX', 1, -999, 999)}>+</button>
              </span>

              <span className="map-grid-num">
                <span className="field-label">{t('map.gridOffY')}</span>
                <button type="button" onClick={() => nudgeGrid('rasterVersatzY', -1, -999, 999)}>−</button>
                <input
                  type="number"
                  value={grid.rasterVersatzY}
                  onChange={(e) => applyGrid({ rasterVersatzY: Number(e.target.value) || 0 })}
                />
                <button type="button" onClick={() => nudgeGrid('rasterVersatzY', 1, -999, 999)}>+</button>
              </span>

              <span className="map-grid-colors">
                {GRID_COLORS.map((gc) => (
                  <button
                    key={gc.line}
                    type="button"
                    className={`map-swatch${grid.rasterFarbe === gc.line ? ' on' : ''}`}
                    style={{ background: gc.dot }}
                    onClick={() => applyGrid({ rasterFarbe: gc.line })}
                    aria-label={gc.dot}
                  />
                ))}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => applyGrid({ ...GRID_DEFAULT })}
              >
                {t('common.reset')}
              </button>
            </div>
          ) : null}

          {isGm && pendingFog > 0 ? (
            <div className="map-fog-note">
              <span>{t('map.fogPending', { n: pendingFog })}</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={fogReveal}>
                <Check size={13} /> {t('map.fogReveal')}
              </button>
            </div>
          ) : null}

          {isGm && pendingMoves.length ? (
            <ul className="map-moves">
              {pendingMoves.map((z) => (
                <li key={z.id}>
                  <span>{t('map.moveProposed', { name: z.name, n: z.felder })}</span>
                  <span className="map-move-btns">
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => confirmMove(z.id)}>
                      <Check size={13} /> {t('map.moveConfirm')}
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost map-danger" onClick={() => rejectMove(z.id)}>
                      {t('map.moveReject')}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <canvas ref={canvasRef} className="map-canvas" />
          {status ? <p className="map-status">{status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
