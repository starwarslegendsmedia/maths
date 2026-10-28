// Today's session, about 15 minutes: mixed review, then one skill to learn or practise, then an optional
// one-minute sprint, then the day's story scene.
//   review    skills that are due come back mixed together, with look-alike skills side by side so she has
//             to tell them apart (interleaving: Rohrer et al. 2015, 2020; IES 2021 Rec. 1)
//   learn     one skill at a time, the earliest she is ready for; the two paths take turns day by day
//   sprint    only facts she already knows, and sprint skills she has learned (Maki et al. 2024)
//   compare   a second way beside hers, on a skill she has learned, at most one a session (engine/methods.js)
//   facts     her slowest known facts, filling about five minutes of fact practice with the day's other fact
//             problems and the sprint, while any fact is still slow (Gersten et al. 2009: "a minimum of 5 minutes a
//             session")

import { SKILLS, BY_ID, topoOrder, inRelease } from './skills.js';
import { isReady, isSolid, factMastered } from './mastery.js';
import { compareOffer } from './methods.js';
import { middle } from './speed.js';

export const REVIEW_ITEMS = 6;
export const NEW_FACTS_AT_ONCE = 4; // Burns et al. 2016: about four new facts, mixed among known ones
export const FACT_MS = 5 * 60 * 1000;
export const FACT_CAP = 40; // problems in the facts part at most, however quick she is
const SPRINT_MS = 60000;
const NO_TIME_MS = 5000;  // her time on a fact before she has any recorded: chosen here, not from the research
const BETWEEN_MS = 1500;  // the feedback and the screen change after each problem: chosen here, not from the research

export function learnTarget(st, lastPath = null, release = 1) {
  const order = topoOrder(inRelease(release).map((s) => s.id));
  const going = order.filter((id) => st[id].status === 'learning' || st[id].status === 'shaky');
  if (going.length) return going[0];
  const ready = order.filter((id) => st[id].status === 'new' && isReady(st, id));
  if (!ready.length) return null;
  const otherPath = ready.find((id) => BY_ID[id].path !== lastPath);
  return otherPath || ready[0];
}

// Which facts to teach next in a facts skill: a few unknown ones, mixed among facts she already knows,
// from this table group and earlier ones (incremental rehearsal: Burns et al. 2019). A skill that needs a refresh
// has no unknown facts, so a few of its own are practised again (again): the ones she has missed most, then the slowest.
export function factsToLearn(st, skillId, rng) {
  const s = st[skillId];
  const unknown = Object.keys(s.facts).filter((k) => !s.facts[k].known);
  const again = !unknown.length && s.status === 'shaky' ? weakest(s).slice(0, NEW_FACTS_AT_ONCE) : [];
  const known = [];
  for (const sk of SKILLS) {
    if (sk.kind !== 'facts') continue;
    for (const [k, f] of Object.entries(st[sk.id].facts)) if (f.known && !(sk.id === skillId && again.includes(k))) known.push({ skill: sk.id, key: k });
  }
  return {
    newFacts: unknown.slice(0, NEW_FACTS_AT_ONCE),
    again,
    mixIn: rng.shuffle(known).slice(0, NEW_FACTS_AT_ONCE * 2),
  };
}

function weakest(s) {
  const share = (f) => (f.tries ? f.right / f.tries : 1);
  return Object.keys(s.facts).sort((a, b) => share(s.facts[a]) - share(s.facts[b]) || (s.facts[b].lastMs ?? 0) - (s.facts[a].lastMs ?? 0));
}

export function reviewPicks(st, now, rng, target = null) {
  const due = [];
  const solid = [];
  for (const sk of SKILLS) {
    const s = st[sk.id];
    if (!isSolid(s)) continue;
    solid.push(sk.id);
    if (s.nextDue != null && s.nextDue <= now) due.push(sk.id);
  }
  // look-alikes of today's skill always (a due skill left out waits a day, which costs little; a look-alike only
  // matters on the day its skill is taught), then shaky, then the most overdue, then anything solid
  due.sort((a, b) => (st[a].status === 'shaky' ? -1 : 0) - (st[b].status === 'shaky' ? -1 : 0) || st[a].nextDue - st[b].nextDue);
  const alike = (target ? BY_ID[target].lookalikes || [] : []).filter((l) => solid.includes(l));
  const picks = [...due.filter((id) => !alike.includes(id)).slice(0, REVIEW_ITEMS - alike.length), ...alike];
  for (const id of rng.shuffle(solid)) if (picks.length < REVIEW_ITEMS && !picks.includes(id)) picks.push(id);
  const chosen = picks.slice(0, REVIEW_ITEMS);
  while (chosen.length && chosen.length < REVIEW_ITEMS) chosen.push(rng.pick(picks)); // few skills yet: repeat some
  return rng.shuffle(chosen).map((id) => ({ skill: id, key: st[id].facts ? slowFact(st[id], rng) : undefined }));
}

// For a facts skill in review: a fact not yet mastered, else any.
function slowFact(s, rng) {
  const keys = Object.keys(s.facts).filter((k) => s.facts[k].known);
  const notYet = keys.filter((k) => !factMastered(s.facts[k]));
  return rng.pick(notYet.length ? notYet : keys.length ? keys : Object.keys(s.facts));
}

// The tables she knows: every table of each facts skill learned (or placed, mastered, shaky), or null before any is.
// mult-tens, mult-1digit and eq-missing-mult take their one-digit factors from these (opts.factors) wherever a problem is
// made for her, so a skill learned before its prerequisites came to need the 9s and 7s (stage 5, NESA audit rows 12, 13
// and 22) never gives her a table she has not learned; with every table learned, nothing changes.
export const BY_TABLES = new Set(['mult-tens', 'mult-1digit', 'eq-missing-mult']);
export function knownTables(st) {
  const solid = SKILLS.filter((sk) => sk.kind === 'facts' && isSolid(st[sk.id]));
  return solid.length ? solid.flatMap((sk) => sk.tables).sort((a, b) => a - b) : null;
}

// What a sprint may hold: known facts from facts skills, and learned sprint skills.
export function sprintPool(st) {
  const facts = [];
  const skills = [];
  for (const sk of SKILLS) {
    const s = st[sk.id];
    if (sk.kind === 'facts') {
      for (const [k, f] of Object.entries(s.facts)) if (f.known) facts.push({ skill: sk.id, key: k });
    } else if (sk.sprint && isSolid(s)) skills.push({ skill: sk.id });
  }
  return { facts, skills, ready: facts.length >= 6 || skills.length > 0 };
}

// The facts part: what five minutes leaves after the plan's other fact problems (plannedFacts) and the sprint, at her
// time per problem. Slow facts are known ones not yet fast on three days; none slow, no facts part (the sprint alone).
// Facts with no time yet come first, then the slowest; past every slow fact twice, her fast facts once each.
export function factPractice(st, rng, { plannedFacts = 0, sprintReady = false } = {}) {
  const known = [];
  for (const sk of SKILLS) {
    if (sk.kind !== 'facts') continue;
    for (const [key, f] of Object.entries(st[sk.id].facts)) if (f.known) known.push({ skill: sk.id, key, f });
  }
  const slow = known.filter((x) => !factMastered(x.f));
  if (!slow.length) return [];
  const times = known.map((x) => x.f.lastMs).filter((ms) => ms != null);
  const itemMs = (times.length ? middle(times) : NO_TIME_MS) + BETWEEN_MS;
  const budget = FACT_MS - (sprintReady ? SPRINT_MS : 0) - plannedFacts * itemMs;
  const n = Math.min(FACT_CAP, Math.floor(budget / itemMs));
  if (n < 3) return [];
  const rank = (x) => x.f.lastMs ?? Infinity;
  slow.sort((a, b) => rank(b) - rank(a) || 0); // Infinity − Infinity is NaN: facts with no time keep their order
  let list;
  if (n <= slow.length) list = slow.slice(0, n);
  else if (n <= 2 * slow.length) list = [...slow, ...slow.slice(0, n - slow.length)];
  else list = [...slow, ...slow, ...rng.shuffle(known.filter((x) => factMastered(x.f))).slice(0, n - 2 * slow.length)];
  if (list.length < 3) return []; // one slow fact and none fast: it would only come twice running
  return spread(list.map(({ skill, key }) => ({ skill, key })), rng);
}

// Shuffled so the same fact never comes twice running where it can: each pick at random from the facts that leave
// the rest still able to be spread out.
function spread(list, rng) {
  const id = (x) => `${x.skill}:${x.key}`;
  const left = rng.shuffle(list);
  const out = [];
  while (left.length) {
    const last = out.length ? id(out.at(-1)) : null;
    const i = left.findIndex((x, j) => id(x) !== last && canSpread(left.filter((_, k) => k !== j), id(x), id));
    out.push(...left.splice(Math.max(i, 0), 1));
  }
  return out;
}

// Can these be put in a row with no fact twice running, not starting with `after`?
function canSpread(list, after, id) {
  const count = {};
  for (const x of list) count[id(x)] = (count[id(x)] || 0) + 1;
  return Object.entries(count).every(([k, c]) => c <= (k === after ? Math.floor(list.length / 2) : Math.ceil(list.length / 2)));
}

// The fact problems already in today's plan: warm-up picks with a fact, a facts skill's lesson as js/runner.js
// learnFacts asks it (each new fact as a worked example and a flash, then the practice queue), and a second way on a
// facts skill (the two ways side by side, then one worked her way).
function plannedFactCount(st, review, target, compare, rng) {
  let n = review.filter((p) => p.key).length + (compare && BY_ID[compare.skill].kind === 'facts' ? 2 : 0);
  if (target && BY_ID[target].kind === 'facts') {
    const { newFacts, again, mixIn } = factsToLearn(st, target, rng);
    n += newFacts.length * 2 + (newFacts.length + again.length) * 2 + mixIn.length;
  }
  return n;
}

// The game alone chooses what she learns next (decided 17 October 2026: no parent's corner). events: her history, for
// the ways she has chosen and how they are going.
export function planSession(st, now, rng, { lastPath = null, release = 1, events = [] } = {}) {
  const target = learnTarget(st, lastPath, release);
  const fresh = target ? st[target].status === 'new' : false;
  const review = reviewPicks(st, now, rng, target);
  const sprint = sprintPool(st);
  const compare = compareOffer(st, events, { rng, target, fresh });
  const plannedFacts = plannedFactCount(st, review, target, compare, rng);
  return {
    review,
    learn: target ? { skill: target, fresh } : null,
    sprint,
    compare,
    facts: factPractice(st, rng, { plannedFacts, sprintReady: sprint.ready }),
  };
}
