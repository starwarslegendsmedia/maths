// What the game measures about her, kept in the copy of her progress she can save from Settings. There is no screen
// for a parent to read (decided 17 October 2026: schoolwork is the measure that counts); the game
// uses her answers itself to choose what to teach, and these are the plan's measures for anyone reading the file:
//   daysBack  the days she finished a session in the last 14 (research 6.11, 6.7: the game's job is to bring her back)
//   speed     her speed on each fact, first time against now (engine/speed.js; "at the start and after two weeks")
//   ratings   her last ten guesses at her score against the score (engine/rating.js; research 7.3)

import { computeState, dayOf } from './mastery.js';
import { factSpeeds, speedSummary } from './speed.js';
import { ratingSummary } from './rating.js';

const DAY = 24 * 60 * 60 * 1000;

export function daysBack(events, now, days = 14) {
  const from = now - days * DAY;
  return new Set(events.filter((e) => e.type === 'session' && e.phase === 'end' && e.t > from).map((e) => dayOf(e.t))).size;
}

export function measures(events, now) {
  return {
    daysBack: daysBack(events, now),
    speed: speedSummary(factSpeeds(computeState(events))),
    ratings: ratingSummary(events),
  };
}

// The saved file: when, the measures, and every event (so nothing is lost and the Mac and the iPhone can be compared).
export function progressFile(events, now) {
  return { saved: new Date(now).toISOString(), measures: measures(events, now), events };
}
