// Where she is on every skill, worked out from her events.
//
// A skill moves through: not started → learning → learned → mastered, or is "placed" by the placement check.
//   learned   about 90% right on her last 10 first tries in learn and practice (at least 8 tries)
//             (IES 2021 and mastery learning: move on at 80–90%)
//   mastered  right first time in mixed review on 3 different days (spacing, Pashler et al. 2007)
//   shaky     a learned, mastered or placed skill missed first time in review three times in a row (research 6.14:
//             her level moves only after a run of three): it is taught again, and two right in a row clear it.
//             A single miss only brings it back the next day. A miss in the timed sprint brings it back the next day
//             too, but never counts towards shaky: that is judged on the untimed warm-up (research 3.5).
//   The game alone places, teaches again and confirms mastery (decided 17 October 2026: no parent's corner); an
//   old skill-setting event from release 1's parent's corner, if her history holds one, is ignored.
// Facts skills are tracked fact by fact (a fact is a pair like '7x8'):
//   known     answered right at least once untimed; only known facts go into sprints (Maki et al. 2024:
//             hard problems, not timing, drove anxiety)
//   fast      right first try within FAST_MS
//   mastered  fast on 3 different days; the skill is learned at 90% of its facts known, mastered at 90% mastered
//   speed     her first time right first time (firstMs, firstAt) and her latest (nowMs), for engine/speed.js; not the
//             answer asked straight after the fact's worked example (phase 'learn'), which is copying, not recall
//   flash     a new fact shown, hidden, then typed whole from memory (phase 'flash', js/runner.js): a try, and right
//             makes the fact known, but typing three numbers is slower than answering one, so it sets no fast day, no
//             time of any kind, and does not touch the skill's run of first tries or its review
//   helped    a problem she asked a step for ("Show me one step", phase 'helped'): a try only, so it makes no fact
//             known, keeps no time, and is not in the skill's run of first tries
// Review comes back after 1, 3, 7, 14, then 30 days; overshooting the gap costs little, too short a gap
// costs more (Pashler et al. 2007, p. 5).

import { SKILLS, BY_ID } from './skills.js';
import { factKeys } from './items/index.js';
import { pairGroup, parseKey, movedFrom } from './items/facts.js';
import { RUN } from './level.js';

export const FAST_MS = 3000;
export const INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY = 24 * 60 * 60 * 1000;

export function dayOf(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function blank(skill) {
  const s = {
    id: skill.id, status: 'new', tries: 0, right: 0, recent: [],
    reviewDays: new Set(), reviewStreak: 0, missRun: 0, interval: 0, nextDue: null, lastSeen: null, placed: null,
    everMastered: false, started: false,
  };
  if (skill.kind === 'facts') {
    s.facts = {};
    for (const k of factKeys(skill.id)) s.facts[k] = { known: false, fastDays: new Set(), tries: 0, right: 0, lastMs: null, bestMs: null, firstMs: null, firstAt: null, nowMs: null };
  }
  return s;
}

// A fact's record wherever it is now: the facts with 11 or 12 went to facts-11-12 on 25 October 2026, so an answer or a
// placement from before then, made in an older group, still counts for the fact itself, though not for facts-11-12's
// own progress, which she has not started.
function factRecord(st, skill, key) {
  const f = st[skill].facts;
  if (!f || f[key] || !/^\d+x\d+$/.test(key || '')) return f && f[key];
  return st[pairGroup(...parseKey(key))].facts[key];
}

export function computeState(events) {
  const st = {};
  for (const sk of SKILLS) st[sk.id] = blank(sk);

  for (const e of events) {
    if (e.type === 'placed' && st[e.skill]) {
      const s = st[e.skill];
      s.placed = e.result;
      // placement keeps her answers before it marks the skill, and a facts skill's right answer makes it 'learning'
      // (updateFactsStatus): a skill with only placement's answers is one she has not started
      if (e.result === 'known' && (s.status === 'new' || (s.status === 'learning' && !s.started))) {
        s.status = 'placed';
        s.nextDue = e.t + DAY; // confirm it soon, as ALEKS re-checks what it placed
      }
      if (e.result === 'known' && s.facts) for (const k of [...Object.keys(s.facts), ...movedFrom(e.skill)]) factRecord(st, e.skill, k).known = true;
    }
    if (e.type === 'learned' && st[e.skill]) promoteLearned(st[e.skill], e.t);
    if (e.type !== 'answer' || !st[e.skill]) continue;

    const s = st[e.skill];
    s.lastSeen = e.t;
    if (e.phase !== 'placement') s.started = true;
    if (e.phase === 'worked') continue; // filling in a worked example is not a try
    const right = e.correct && e.phase !== 'helped'; // one she asked a step for is a try, and nothing more
    s.tries++;
    if (right) s.right++;

    const f = factRecord(st, e.skill, e.key);
    if (f) {
      f.tries++;
      if (right) {
        f.right++;
        if (e.phase !== 'sprint') f.known = true;
        if (e.phase !== 'flash') {
          if (e.firstTry && e.ms != null && e.ms <= FAST_MS) f.fastDays.add(dayOf(e.t));
          f.lastMs = e.ms;
          if (e.ms != null && (f.bestMs == null || e.ms < f.bestMs)) f.bestMs = e.ms;
          if (e.firstTry && e.ms != null && e.phase !== 'learn') {
            if (f.firstMs == null) { f.firstMs = e.ms; f.firstAt = e.t; }
            f.nowMs = e.ms;
          }
        }
      }
    }

    if (e.phase === 'learn' || e.phase === 'practice') {
      if (s.status === 'new') s.status = 'learning';
      s.recent.push(Boolean(e.correct && e.firstTry));
      if (s.recent.length > 10) s.recent.shift();
      if (!s.facts && s.status === 'learning' && s.recent.length >= 8 && share(s.recent) >= 0.9) promoteLearned(s, e.t);
    }

    if (e.phase === 'review' || e.phase === 'sprint') {
      const ok = Boolean(e.correct && e.firstTry);
      if (ok) {
        const day = dayOf(e.t);
        // the gap grows once per day of review, not once per answer (a sprint holds many answers)
        if (!s.reviewDays.has(day)) s.interval = Math.min(s.interval + (s.reviewDays.size ? 1 : 0), INTERVALS_DAYS.length - 1);
        s.reviewDays.add(day);
        s.reviewStreak++;
        s.missRun = 0;
        if (s.status === 'shaky' && s.reviewStreak >= 2) s.status = 'learned';
      } else {
        s.reviewStreak = 0;
        s.interval = 0;
        if (e.phase === 'review') s.missRun++;
        if (s.missRun >= RUN && (s.status === 'mastered' || s.status === 'placed' || s.status === 'learned')) s.status = 'shaky';
      }
      s.nextDue = e.t + INTERVALS_DAYS[s.interval] * DAY;
    }

    if (s.facts) updateFactsStatus(s, e.t);
    else if ((s.status === 'learned' || s.status === 'placed') && s.reviewDays.size >= 3) s.status = 'mastered';
    if (s.status === 'mastered') s.everMastered = true;
  }
  return st;
}

// What she sees never goes backwards (research 3.5 and 8.1: no loss for a wrong answer, proof of progress).
// A miss still makes a skill shaky so it comes back sooner; on her screens a skill once mastered stays mastered.
// skills: the ones counted, every skill unless given (her home screen gives those of her release, engine/skills.js inRelease).
export function masteredCount(st, skills = SKILLS) {
  return skills.filter((sk) => st[sk.id].everMastered).length;
}

export function mapStatus(s) {
  if (s.everMastered && s.status !== 'mastered') return 'mastered-refresh';
  return s.status;
}

function share(list) {
  return list.length ? list.filter(Boolean).length / list.length : 0;
}

function promoteLearned(s, t) {
  if (s.status === 'new' || s.status === 'learning') {
    s.status = 'learned';
    s.interval = 0;
    s.nextDue = t + DAY;
  }
}

function updateFactsStatus(s, t) {
  const all = Object.values(s.facts);
  const known = all.filter((f) => f.known).length / all.length;
  const mastered = all.filter((f) => f.fastDays.size >= 3).length / all.length;
  if (s.status === 'shaky') return;
  if (mastered >= 0.9) s.status = 'mastered';
  else if (known >= 0.9 && (s.status === 'new' || s.status === 'learning')) promoteLearned(s, t);
  else if (s.status === 'new' && known > 0) s.status = 'learning';
}

// Can she start this skill? Everything it depends on is learned, placed or mastered.
const SOLID = new Set(['learned', 'mastered', 'placed', 'shaky']);
export function isSolid(s) {
  return SOLID.has(s.status);
}

export function isReady(st, id) {
  return BY_ID[id].prereqs.every((p) => isSolid(st[p]));
}

export function factMastered(f) {
  return f.fastDays.size >= 3;
}
