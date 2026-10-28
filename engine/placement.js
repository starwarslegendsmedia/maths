// The placement check: finding where she is before teaching anything, in the way ALEKS does it
// (knowledge space theory: probe a skill; if she has it she very likely has what it rests on; if she
// hasn't, she very likely hasn't got what rests on it). Each probe is a few problems of one skill.
// It chooses the skill that settles the most of what is still unknown either way, so the check is short,
// and it runs as several short sittings of about five minutes, picking up where it stopped.

import { SKILLS, ancestors, descendants } from './skills.js';

export const PROBE_ITEMS = 3;      // problems per probe
export const PROBE_PASS = 2;       // right first time to pass
export const SITTING_PROBES = 4;   // probes in one sitting, about five minutes

export function newPlacement(skillIds = SKILLS.map((s) => s.id)) {
  return { pool: skillIds.slice(), known: new Set(), unknown: new Set(), probes: [] };
}

// Rebuild a placement from 'placed' events (so a sitting can stop and resume on any device).
export function placementFromEvents(events, skillIds) {
  const p = newPlacement(skillIds);
  for (const e of events) if (e.type === 'placed') record(p, e.skill, e.result === 'known');
  return p;
}

function undetermined(p) {
  return p.pool.filter((id) => !p.known.has(id) && !p.unknown.has(id));
}

export function isDone(p) {
  return undetermined(p).length === 0;
}

// The next skill to probe: the one whose result settles the most skills in the worse case.
export function nextProbe(p) {
  const open = new Set(undetermined(p));
  if (!open.size) return null;
  let best = null;
  let bestScore = -1;
  for (const id of open) {
    const below = [...ancestors(id)].filter((a) => open.has(a)).length;
    const above = [...descendants(id)].filter((d) => open.has(d)).length;
    const score = Math.min(below, above) * 100 + below + above; // balanced first, then most settled
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

function record(p, id, passed) {
  p.probes.push({ skill: id, passed });
  if (passed) {
    p.known.add(id);
    for (const a of ancestors(id)) if (p.pool.includes(a) && !p.unknown.has(a)) p.known.add(a);
  } else {
    p.unknown.add(id);
    for (const d of descendants(id)) if (p.pool.includes(d) && !p.known.has(d)) p.unknown.add(d);
  }
}

// Apply a finished probe. Returns the skills it settled, for 'placed' events.
export function applyProbe(p, id, rightFirstTime) {
  const passed = rightFirstTime >= PROBE_PASS;
  const before = new Set([...p.known, ...p.unknown]);
  record(p, id, passed);
  const settled = [];
  for (const k of p.known) if (!before.has(k)) settled.push({ skill: k, result: 'known' });
  for (const u of p.unknown) if (!before.has(u)) settled.push({ skill: u, result: 'unknown' });
  return { passed, settled };
}
