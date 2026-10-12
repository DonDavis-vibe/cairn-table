import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  rollWeather, travelPlan, rollLost, rollSupply, advanceWatch, weatherEffect,
} from './procedures.js';

// Math.random so scripten, dass nacheinander die gewuenschten Wuerfelaugen fallen.
function script(...pairs) {
  const spy = vi.spyOn(Math, 'random');
  pairs.forEach(([face, sides]) => spy.mockReturnValueOnce((face - 0.5) / sides));
}
afterEach(() => vi.restoreAllMocks());

describe('rollWeather', () => {
  it('liest die Jahreszeit-Spalte', () => {
    script([1, 6]);
    expect(rollWeather('spring').key).toBe('nice');
    script([5, 6]);
    expect(rollWeather('winter').key).toBe('extreme');
    script([2, 6]);
    expect(rollWeather('winter').key).toBe('unpleasant');
    script([3, 6]);
    expect(rollWeather('fall').key).toBe('unpleasant');
  });

  it('zweimal Extrem in Folge wird katastrophal', () => {
    script([6, 6]);
    expect(rollWeather('summer', 'extreme').key).toBe('catastrophic');
    script([6, 6]);
    expect(rollWeather('summer', 'inclement').key).toBe('extreme');
  });
});

describe('travelPlan', () => {
  it('kurze Straße, leichtes Gelände, schönes Wetter: 1 Wache', () => {
    const p = travelPlan({ path: 'road', distance: 'short', terrain: 'easy', weather: 'nice' });
    expect(p.watches).toBe(1);
    expect(p.lost).toBe(0);
  });

  it('Wildnis, mittlere Distanz, raues Gelände: 2 + 2 + 1 = 5 Wachen, 3-in-6 verirrt', () => {
    const p = travelPlan({ path: 'wilderness', distance: 'medium', terrain: 'tough', weather: 'fair' });
    expect(p.watches).toBe(5);
    expect(p.lost).toBe(3);
  });

  it('unfreundliches Wetter: Erschöpfung ODER +1 Wache', () => {
    const fatigue = travelPlan({ path: 'trail', distance: 'short', weather: 'unpleasant', weatherCost: 'fatigue' });
    expect(fatigue.watches).toBe(2);
    expect(fatigue.weatherFatigue).toBe(true);
    const watch = travelPlan({ path: 'trail', distance: 'short', weather: 'unpleasant', weatherCost: 'watch' });
    expect(watch.watches).toBe(3);
    expect(watch.weatherFatigue).toBe(false);
  });

  it('Extrem: Erschöpfung UND +1 Wache UND Gelände eine Stufe schwerer', () => {
    const p = travelPlan({ path: 'road', distance: 'short', terrain: 'easy', weather: 'extreme' });
    expect(p.watches).toBe(1 + 1 + 1);
    expect(p.terrain).toBe('tough');
    expect(p.weatherFatigue).toBe(true);
  });

  it('Gelände ist bei "gefährlich" gedeckelt; Schlafmangel hebt eine Stufe', () => {
    const p = travelPlan({ path: 'road', distance: 'short', terrain: 'perilous', weather: 'inclement', sleepDeprived: true });
    expect(p.terrain).toBe('perilous');
    const q = travelPlan({ path: 'road', distance: 'short', terrain: 'easy', weather: 'fair', sleepDeprived: true });
    expect(q.terrain).toBe('tough');
  });

  it('Katastrophe: keine Reise', () => {
    expect(travelPlan({ weather: 'catastrophic' }).blocked).toBe(true);
    expect(weatherEffect('catastrophic').blocked).toBe(true);
  });

  it('Tage = Wachen / 3', () => {
    expect(travelPlan({ path: 'trail', distance: 'long', terrain: 'tough', weather: 'fair' }).days).toBe(5 / 3);
  });
});

describe('rollLost', () => {
  it('würfelt W6 gegen x-in-6', () => {
    script([2, 6]);
    expect(rollLost(2).lost).toBe(true);
    script([3, 6]);
    expect(rollLost(2).lost).toBe(false);
  });
  it('Modifikator verschiebt die Chance, Straße verirrt nie', () => {
    script([3, 6]);
    expect(rollLost(3, -1).lost).toBe(false);
    script([1, 6]);
    expect(rollLost(0).lost).toBe(false);
  });
});

describe('rollSupply', () => {
  it('Würfel wächst mit Beteiligten bis W12', () => {
    script([1, 4]);
    expect(rollSupply(1).sides).toBe(4);
    script([1, 6]);
    expect(rollSupply(2).sides).toBe(6);
    script([1, 12]);
    expect(rollSupply(9, 2).sides).toBe(12);
  });
  it('Erfahrung hebt den Würfel', () => {
    script([1, 6]);
    expect(rollSupply(1, 1).sides).toBe(6);
  });
});

describe('advanceWatch', () => {
  it('Morgen -> Nachmittag -> Nacht -> nächster Tag', () => {
    expect(advanceWatch({ day: 1, watch: 0 })).toEqual({ day: 1, watch: 1 });
    expect(advanceWatch({ day: 1, watch: 2 })).toEqual({ day: 2, watch: 0 });
  });
});
