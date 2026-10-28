// Step boxes in practice of the long methods (teaching audit, ranked change 4): she types each working step of the
// written method into a box of its own before the answer, so the partial products, carries and remainders stay in front
// of her, not in her head or on scrap paper (research 2.3: "use strategies that externalize the information", Rief 3.6;
// "gradually fade the use of visual guides", IES 2021 p. 43; 2.4: one step at a time; L l.45: where she loses her place
// and her columns go astray). The boxes fade across days, never within a lesson: what she has today rests only on the
// days before it.
//   working steps   every step with a value but the last, which is the answer and goes in the question itself
//   all             her first days with a way on a skill: every working step a box
//   fewer           after a good day: the first half of them (rounded up), the rest hers to do
//   none            after two: the answer box alone
// Her days with the way are replayed in order, as engine/flash.js replays her flashes: a good day (at least 4 in 5 of
// her own answers right first time; research 15.2, move on at 80 to 90%) fades the boxes one step, and a day under that
// brings one step back. A problem she asked a step for counts neither way, as in engine/mastery.js. Each way has its
// own days: a way new to her starts with every box again; her answers from before a skill had ways (no method) are the
// way she learned's (plans/2026-10-25-two-ways-plan.md). Practice and the warm-up both give the boxes, since a skill
// learned in a day or two goes on in her warm-ups and would otherwise lose every box at once (chosen here, not from the
// research); the sprint and the placement check never do.

import { dayOf } from './mastery.js';
import { wayOf } from './methods.js';

// The written methods of Whole numbers: column adding and subtracting (and partitioning, counting up), the area model,
// written multiplication, chunking and short division. A skill of one or two steps (a fact, × 10s, a remainder) has
// nothing to keep in her head; word problems name their type first and get their bar model later (audit change 10).
// Adding and subtracting decimals by columns, the longest thing in the decimals strand, is one too (stage 6, plan D6
// "Attention"); the other decimal skills are 2 to 4 short steps.
export const LONG = new Set(['addsub-written', 'addsub-multi', 'mult-1digit', 'mult-2digit', 'div-chunk', 'div-short', 'dec-addsub']);
export const GOOD = 0.8;
const OWN = new Set(['learn', 'practice', 'review']);
const FADED = 2; // all, fewer, none

// Where a problem's steps with a value are (the ones she can fill in), in order.
export function valuedSteps(item) {
  return item.steps.map((s, i) => ('value' in s ? i : -1)).filter((i) => i >= 0);
}

export function workingSteps(item) {
  return valuedSteps(item).slice(0, -1);
}

// How far the boxes have faded on a skill worked a way: 0 all, 1 fewer, 2 none. memo, a Map kept for a session, saves
// reading her whole history again for each problem: the answer only changes from one day to the next. method null:
// every way of the skill; max: how far it can fade (a word problem's help has three levels, js/runner.js wordFade).
export function fade(events, skill, method, now = Date.now(), memo = null, { max = FADED } = {}) {
  const today = dayOf(now);
  const key = `${today} ${skill} ${method ?? '*'} ${max}`;
  if (memo?.has(key)) return memo.get(key);
  const days = new Map();
  for (const e of events) {
    if (e.type !== 'answer' || e.skill !== skill || (method != null && wayOf(e) !== method) || !OWN.has(e.phase)) continue;
    const d = dayOf(e.t);
    if (d >= today) continue;
    const x = days.get(d) ?? { n: 0, right: 0 };
    x.n++;
    if (e.correct && e.firstTry) x.right++;
    days.set(d, x);
  }
  let at = 0;
  for (const d of [...days.keys()].sort()) {
    const { n, right } = days.get(d);
    at = right / n >= GOOD ? Math.min(max, at + 1) : Math.max(0, at - 1);
  }
  memo?.set(key, at);
  return at;
}

// How many of this problem's working steps she fills in as boxes today, from the first; null for a skill without them.
export function stepBoxes(events, item, now = Date.now(), memo = null) {
  if (!LONG.has(item.skill)) return null;
  const n = workingSteps(item).length;
  return [n, Math.ceil(n / 2), 0][fade(events, item.skill, item.method, now, memo)];
}
