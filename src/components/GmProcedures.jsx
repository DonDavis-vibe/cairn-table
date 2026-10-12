import { useState } from 'react';
import { Dices, ChevronRight } from 'lucide-react';
import { useLang, loc } from '../i18n/index.jsx';
import { DUNGEON_EVENTS, WILDERNESS_EVENTS } from '../data/procedures.js';
import {
  SEASONS, WATCHES, PATHS, DISTANCES, TERRAINS, rollEvent, rollWeather, weatherEffect,
  travelPlan, rollLost, rollSupply, advanceWatch,
} from '../rules/procedures.js';
import { GM_CAMP, GM_FATIGUE, GM_DEPRIVED } from '../multiplayer/protocol.js';
import { makeItem } from '../data/items.js';

const SELECT = 'text-input';

// Dungeon- und Wildnis-Ablauf (Cairn 2e Player's Guide, Procedures): Zug- und
// Wachenzaehler, Ereignistabellen, Wetter, Reiseplaner, Verirren, Vorraete, Lager.
// Alles landet im geteilten Runden-Log des Wardens.
export default function GmProcedures({ mp }) {
  const { t, lang } = useLang();
  const [mode, setMode] = useState('wild');

  // Dungeon
  const [turn, setTurn] = useState(0);
  const [dungeonEvent, setDungeonEvent] = useState(null);

  // Wildnis: Zeit, Ereignis, Wetter
  const [time, setTime] = useState({ day: 1, watch: 0 });
  const [night, setNight] = useState(false);
  const [wildEvents, setWildEvents] = useState(null);
  const [season, setSeason] = useState('spring');
  const [weather, setWeather] = useState(null); // { key, d }

  // Reiseplaner
  const [plan, setPlan] = useState({
    path: 'trail', distance: 'short', terrain: 'easy', extra: 0, weatherCost: 'fatigue', sleepDeprived: false,
  });
  const [lostMod, setLostMod] = useState(0);
  const [lostResult, setLostResult] = useState(null);

  // Vorraete
  const [supplyPeople, setSupplyPeople] = useState(1);
  const [supplyBonus, setSupplyBonus] = useState(0);
  const [supplyResult, setSupplyResult] = useState(null);
  const [supplyStashed, setSupplyStashed] = useState(false);

  const log = (text, tone = 'gm') => mp.logGmAction({ text: `${t('gm.warden')}: ${text}`, tone, cmd: 'gm' });
  const die = t('dice.die');

  // --- Dungeon ---
  const nextTurn = () => { setTurn((n) => n + 1); };
  const rollDungeonEvent = () => {
    const d = rollEvent();
    const ev = DUNGEON_EVENTS[d - 1];
    setDungeonEvent({ d, ev });
    log(`${t('proc.dungeonEvent')} ${d} — ${loc(ev.name, lang)}: ${loc(ev.text, lang)}`, d === 1 ? 'bad' : 'gm');
  };

  // --- Wildnis ---
  const nextWatch = () => {
    const next = advanceWatch(time);
    setTime(next);
    log(t('proc.time', { day: next.day, watch: t(`proc.watch.${WATCHES[next.watch]}`) }));
  };
  const rollWildEvent = () => {
    const rolls = Array.from({ length: night ? 2 : 1 }, () => rollEvent());
    const results = rolls.map((d) => ({ d, ev: WILDERNESS_EVENTS[d - 1] }));
    setWildEvents(results);
    results.forEach(({ d, ev }) => log(`${t('proc.wildEvent')} ${d} — ${loc(ev.name, lang)}: ${loc(ev.text, lang)}`, d === 1 ? 'bad' : 'gm'));
  };
  const doRollWeather = () => {
    const w = rollWeather(season, weather?.key);
    setWeather(w);
    log(`${t('proc.weather')} (${t(`proc.season.${season}`)}): ${t(`proc.weather.${w.key}`)} — ${weatherText(w.key)}`, w.key === 'extreme' || w.key === 'catastrophic' ? 'bad' : 'gm');
  };

  const weatherText = (key) => {
    const eff = weatherEffect(key);
    if (eff.blocked) return t('proc.fx.blocked');
    const parts = [];
    if (eff.fatigue === 'choice') parts.push(t('proc.fx.choice'));
    if (eff.fatigue === 'forced') parts.push(t('proc.fx.forced'));
    if (eff.terrainStep) parts.push(t('proc.fx.terrain'));
    return parts.length ? parts.join(' · ') : t('proc.fx.good');
  };

  // --- Reiseplaner ---
  const weatherKey = weather?.key || 'fair';
  const eff = weatherEffect(weatherKey);
  const result = travelPlan({ ...plan, weather: weatherKey });
  const setP = (patch) => { setPlan((p) => ({ ...p, ...patch })); setLostResult(null); };
  const watchesLabel = result.blocked ? '' : `${result.watches} ${t('proc.watches')} (≈ ${Math.round(result.days * 10) / 10} ${t('proc.days')})`;
  const doRollLost = () => {
    const r = rollLost(result.lost, Number(lostMod) || 0);
    setLostResult(r);
    log(t('proc.lostLog', { die, d: r.d, odds: r.odds, verdict: r.lost ? t('proc.lost') : t('proc.onCourse') }), r.lost ? 'bad' : 'gm');
  };
  const logPlan = () => {
    if (result.blocked) { log(`${t('proc.planner')}: ${t('proc.resultBlocked')}`, 'bad'); return; }
    log(`${t('proc.planner')}: ${watchesLabel}${result.weatherFatigue ? ` · ${t('proc.fatigueDue')}` : ''}`);
  };

  // --- Vorraete ---
  const doRollSupply = () => {
    const r = rollSupply(Number(supplyPeople) || 1, Number(supplyBonus) || 0);
    setSupplyResult(r);
    setSupplyStashed(false);
    log(t('proc.supplyLog', { die: `${die}${r.sides}`, n: r.rations }), 'ok');
  };

  // Gefundene Rationen in die Tischmitte legen (je eine Ration = 3 Nutzungen).
  const stashSupply = () => {
    for (let i = 0; i < supplyResult.rations; i += 1) mp.stashAdd(makeItem('rations'));
    setSupplyStashed(true);
    log(t('proc.stashedLog', { n: supplyResult.rations }), 'ok');
  };

  // --- Lager ---
  const makeCamp = () => {
    mp.sendGmCommand(null, { cmd: GM_CAMP });
    log(t('proc.campLog'), 'ok');
    setP({ sleepDeprived: false });
  };
  const skipCamp = () => {
    // Zwei Befehle nacheinander mit etwas Abstand — der Bogen verarbeitet je einen pro Render.
    mp.sendGmCommand(null, { cmd: GM_FATIGUE });
    setTimeout(() => mp.sendGmCommand(null, { cmd: GM_DEPRIVED, on: true }), 300);
    log(t('proc.skipLog'), 'bad');
    setP({ sleepDeprived: true });
  };

  return (
    <div className="combat gm-proc">
      <div className="combat-bar">
        <button type="button" className={`btn btn-sm${mode === 'dungeon' ? ' btn-primary' : ''}`} onClick={() => setMode('dungeon')}>{t('proc.tab.dungeon')}</button>
        <button type="button" className={`btn btn-sm${mode === 'wild' ? ' btn-primary' : ''}`} onClick={() => setMode('wild')}>{t('proc.tab.wild')}</button>
      </div>

      {mode === 'dungeon' ? (
        <>
          <div className="combat-bar">
            <span className="combat-round">{t('proc.turn', { n: turn })}</span>
            <button type="button" className="btn btn-sm" onClick={nextTurn}><ChevronRight size={14} /> {t('proc.nextTurn')}</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={rollDungeonEvent}><Dices size={13} /> {t('proc.dungeonEvent')} ({die}6)</button>
          </div>
          <p className="combat-hint">{t('proc.dungeonWhen')}</p>
          {dungeonEvent ? (
            <p className="combat-note"><strong>{dungeonEvent.d} — {loc(dungeonEvent.ev.name, lang)}:</strong> {loc(dungeonEvent.ev.text, lang)}</p>
          ) : null}
          <p className="combat-note">{t('proc.dungeonRest')}</p>
        </>
      ) : (
        <>
          <div className="combat-bar">
            <span className="combat-round">{t('proc.time', { day: time.day, watch: t(`proc.watch.${WATCHES[time.watch]}`) })}</span>
            <button type="button" className="btn btn-sm" onClick={nextWatch}><ChevronRight size={14} /> {t('proc.nextWatch')}</button>
          </div>

          <div className="combat-bar">
            <button type="button" className="btn btn-sm btn-primary" onClick={rollWildEvent}><Dices size={13} /> {t('proc.wildEvent')} ({die}6)</button>
            <label className="radio-line">
              <input type="checkbox" checked={night} onChange={(e) => setNight(e.target.checked)} />
              {t('proc.nightTwice')}
            </label>
          </div>
          {wildEvents ? wildEvents.map(({ d, ev }, i) => (
            <p key={i} className="combat-note"><strong>{d} — {loc(ev.name, lang)}:</strong> {loc(ev.text, lang)}</p>
          )) : null}

          <div className="combat-bar">
            <span className="field-label">{t('proc.weather')}</span>
            <select className={SELECT} value={season} onChange={(e) => setSeason(e.target.value)} aria-label={t('proc.season')}>
              {SEASONS.map((s) => <option key={s} value={s}>{t(`proc.season.${s}`)}</option>)}
            </select>
            <button type="button" className="btn btn-sm" onClick={doRollWeather}><Dices size={13} /> {t('proc.rollWeather')}</button>
          </div>
          {weather ? (
            <p className="combat-note"><strong>{t(`proc.weather.${weather.key}`)}</strong> — {weatherText(weather.key)}</p>
          ) : null}

          <div className="custom-row">
            <span className="field-label">{t('proc.planner')}</span>
            <label className="mini-num">{t('proc.path')}
              <select className={SELECT} value={plan.path} onChange={(e) => setP({ path: e.target.value })}>
                {Object.keys(PATHS).map((k) => <option key={k} value={k}>{t(`proc.path.${k}`)}</option>)}
              </select>
            </label>
            <label className="mini-num">{t('proc.distance')}
              <select className={SELECT} value={plan.distance} onChange={(e) => setP({ distance: e.target.value })}>
                {Object.keys(DISTANCES).map((k) => <option key={k} value={k}>{t(`proc.distance.${k}`)}</option>)}
              </select>
            </label>
            <label className="mini-num">{t('proc.terrain')}
              <select className={SELECT} value={plan.terrain} onChange={(e) => setP({ terrain: e.target.value })}>
                {TERRAINS.map((k) => <option key={k} value={k}>{t(`proc.terrain.${k}`)}</option>)}
              </select>
            </label>
            <label className="mini-num">{t('proc.extra')}
              <input type="number" min="0" max="2" value={plan.extra} onChange={(e) => setP({ extra: Number(e.target.value) || 0 })} />
            </label>
            {eff.fatigue === 'choice' ? (
              <label className="mini-num">{t('proc.weatherCost')}
                <select className={SELECT} value={plan.weatherCost} onChange={(e) => setP({ weatherCost: e.target.value })}>
                  <option value="fatigue">{t('proc.cost.fatigue')}</option>
                  <option value="watch">{t('proc.cost.watch')}</option>
                </select>
              </label>
            ) : null}
            <label className="radio-line">
              <input type="checkbox" checked={plan.sleepDeprived} onChange={(e) => setP({ sleepDeprived: e.target.checked })} />
              {t('proc.sleepDeprived')}
            </label>
          </div>
          <p className="combat-note">
            {result.blocked
              ? t('proc.resultBlocked')
              : (
                <>
                  <strong>{watchesLabel}</strong>
                  {' · '}{t('proc.terrainNow', { terrain: t(`proc.terrain.${result.terrain}`) })}
                  {result.weatherFatigue ? ` · ${t('proc.fatigueDue')}` : ''}
                  {' · '}{result.lost > 0 ? t('proc.lostOdds', { n: result.lost }) : t('proc.lostNone')}
                </>
              )}
          </p>
          <div className="combat-bar">
            <button type="button" className="btn btn-sm" onClick={logPlan}>{t('proc.logPlan')}</button>
            {result.lost > 0 ? (
              <>
                <label className="mini-num">{t('proc.lostMod')}
                  <input type="number" min="-6" max="6" value={lostMod} onChange={(e) => { setLostMod(e.target.value); setLostResult(null); }} />
                </label>
                <button type="button" className="btn btn-sm" onClick={doRollLost}><Dices size={13} /> {t('proc.rollLost')}</button>
                {lostResult ? <strong>{die}6 {lostResult.d} — {lostResult.lost ? t('proc.lost') : t('proc.onCourse')}</strong> : null}
              </>
            ) : null}
          </div>

          <div className="combat-bar">
            <span className="field-label">{t('proc.supply')}</span>
            <label className="mini-num">{t('proc.participants')}
              <input type="number" min="1" max="12" value={supplyPeople} onChange={(e) => setSupplyPeople(e.target.value)} />
            </label>
            <label className="mini-num">{t('proc.bonusSteps')}
              <input type="number" min="0" max="4" value={supplyBonus} onChange={(e) => setSupplyBonus(e.target.value)} />
            </label>
            <button type="button" className="btn btn-sm" onClick={doRollSupply}><Dices size={13} /> {t('proc.rollSupply')}</button>
            {supplyResult ? <strong>{die}{supplyResult.sides}: {t('proc.rations', { n: supplyResult.rations })}</strong> : null}
            {supplyResult ? (
              <button type="button" className="btn btn-sm btn-ghost" onClick={stashSupply} disabled={supplyStashed}>
                {supplyStashed ? t('proc.stashed') : t('proc.toStash')}
              </button>
            ) : null}
          </div>

          <div className="combat-bar">
            <span className="field-label">{t('proc.camp')}</span>
            <button type="button" className="btn btn-sm btn-ok" onClick={makeCamp}>{t('proc.makeCamp')}</button>
            <button type="button" className="btn btn-sm btn-bad" onClick={skipCamp}>{t('proc.skipCamp')}</button>
          </div>
          <p className="combat-hint">{t('proc.campHint')}</p>
        </>
      )}
    </div>
  );
}
