// A session's work comes in short rounds: a few problems with a count she can see, and a reward straight
// away at the end of each round, whether her answers were right or not (research 1.3, 6.1, 6.5, 9.1:
// "try just five", a number of problems rather than minutes; 3.5: a wrong answer costs nothing).
// The reward changes from round to round, and none comes twice running (6.3, 6.6).

export const ROUND_MAX = 5;

// n problems as rounds of at most ROUND_MAX, as even as possible: 6 is 3 and 3, 8 is 4 and 4, never 5 and 1.
export function roundSizes(n, max = ROUND_MAX) {
  if (n <= 0) return [];
  const k = Math.ceil(n / max);
  const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}

export function inRounds(list, max = ROUND_MAX) {
  const out = [];
  let at = 0;
  for (const size of roundSizes(list.length, max)) {
    out.push(list.slice(at, at + size));
    at += size;
  }
  return out;
}

// i is the problem she is on, counting from 0.
export function countLabel(i, n) {
  return `${i + 1} of ${n}`;
}

// The end-of-round rewards: a picture, a short line of its own and a sound. Kept story-free until the storyboard is
// settled; the sounds are in js/sound.js. The line about what she did comes first (didLine).
export const REWARDS = [
  { id: 'star', icon: '⭐', line: 'That one is yours.', sound: 'rise' },
  { id: 'gem', icon: '💎', line: 'A gem for your pile.', sound: 'sparkle' },
  { id: 'lantern', icon: '🏮', line: 'Another light on.', sound: 'bells' },
  { id: 'rocket', icon: '🚀', line: 'Up and away.', sound: 'rise' },
  { id: 'strong', icon: '💪', line: 'Time for a stretch.', sound: 'drum' },
  { id: 'dance', icon: '💃', line: 'Time for a little dance.', sound: 'bells' },
];

// What she did in a round, or a whole session, said in words (research 7.1 and 15.12: name what she did, never an
// empty "good job"; 3.3: about the work, not her). A small fixed set, so every one is voiced (tools/voice-lines.mjs);
// her counts stay on the screen, unsaid.
export const DID = {
  all: 'Each one right first time.',
  allOwn: 'Each one right first time, your own way.',
  allSteps: 'Each one right first time, each step written down.',
  fixed: 'You fixed each one you missed on the second try.',
  rebuiltOne: 'You built the hard one again, step by step.',
  rebuiltMany: 'You built the hard ones again, step by step.',
  helpedOne: 'You asked for a step, then finished it yourself.',
  helpedMany: 'You asked for steps, then did the rest yourself.',
  factsFirst: 'You typed each new fact from memory.',
  factsAgain: 'You looked again when you needed to, then typed each one.',
};

// The day's line when she stopped part-way through a problem's steps, before any problem was finished (js/app.js
// summary): what she did, the steps she worked out herself.
export const PART_WAY = 'You made a start, one step at a time.';

// done: one entry a problem, { firstTry, correct, helped?, own?, boxes?, flash? } (js/runner.js): own, true if worked the
// way she chose (false if another, unset if she has not chosen one); boxes, the step boxes it had (unset for a skill
// without them); flash, a new fact shown and typed from memory. The most telling true thing comes first: a sum she
// built again after a second miss, then the misses she fixed, then the steps she asked for, then every one right
// first time. A session's new facts are left aside unless they are all it held. '' with nothing done.
export function didLine(done) {
  const own = done.filter((d) => !d.flash);
  if (!own.length) return !done.length ? '' : done.every((d) => d.firstTry) ? DID.factsFirst : DID.factsAgain;
  const count = (f) => own.filter(f).length;
  const rebuilt = count((d) => !d.correct);
  if (rebuilt) return rebuilt === 1 ? DID.rebuiltOne : DID.rebuiltMany;
  if (count((d) => !d.firstTry && !d.helped)) return DID.fixed;
  const helped = count((d) => d.helped);
  if (helped) return helped === 1 ? DID.helpedOne : DID.helpedMany;
  const all = (key, ok) => own.some((d) => ok(d[key])) && !own.some((d) => d[key] != null && !ok(d[key]));
  if (all('own', Boolean)) return DID.allOwn;
  if (all('boxes', (n) => n > 0)) return DID.allSteps;
  return DID.all;
}

// Her count for the screen, never said.
export function didCount(done) {
  return `${done.filter((d) => d.firstTry).length} of ${done.length} right first time.`;
}

// Any reward but the last two she was shown, across sessions, so the same one never comes twice running.
export function pickReward(events, rng, pool = REWARDS) {
  const recent = events.filter((e) => e.type === 'round' && pool.some((r) => r.id === e.reward)).slice(-2).map((e) => e.reward);
  const fresh = pool.filter((r) => !recent.includes(r.id));
  return rng.pick(fresh.length ? fresh : pool);
}
