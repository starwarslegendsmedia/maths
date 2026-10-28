// Percentages (stage 6 strand 3, plans/2026-10-25-stage-6-plan.md "Strand 3: percentages"): the generator of the
// percentage skills, pct-benchmarks today, with pct-of and pct-discount to come in their own steps (3.3 to 3.5), each a
// list of keys, its classes in classesOf and its question in problem. A per cent is always a whole number; a fraction is
// text 'n/d' and a decimal the game's text ('0.75'), never a float; the ways that work them are in
// engine/percent-ways.js.
//
// pct-benchmarks, MA3-RN-03, "determines percentages of quantities, and finds equivalent fractions and decimals for
// benchmark percentage values" (Outcomes, saved copy 2026-10-10-1116-article-k-10-mathematics-k-10-syllabus-2022-
// outcomes.md l.246-248): "Recognise that the symbol % means percent and 100% is the whole amount" (l.54), "Recall
// commonly used equivalent percentages, decimals and fractions including 1/2, 1/4, and 3/4" (l.55) and "Represent common
// percentages of quantities and lengths as fractions and decimals" (l.56) (Stage 3 Represents numbers B, saved copy
// 2026-10-10-1116-article-k-10-mathematics-k-10-syllabus-2022-fa0a18f458.md, .../stage-3/fa0a18f458), its Examples and
// teaching advice read live 28 October 2026 ("Such as 75%, 0.75", "Such as 25% means 25 out of 100 or 25/100 or 0.25",
// the bar shaded to a quarter of its length, and one-tenth (10%, 0.1) among the benchmarks: Examples fa0a18f458 l.47,
// l.51, l.53-55, l.98-100). NSW Mathematics K–10 Syllabus (2022), 16 June 2026 amendments, checked 28 October 2026.
//
// Chosen for this game, not a syllabus requirement: the conversions between hundredths and whole per cents from 1% to
// 99% beyond the benchmarks (37%, 0.05), as practice of l.56's "common percentages ... as fractions and decimals"; the
// wholes a rest is told of (REST); the release 4 gate (engine/skills.js). Every problem is drawn from a list made once of
// every one the plan allows (plan, "Rules every percentage generator keeps"): the key first, each as often as the others;
// then its class by its weight; then a problem, each in its class as often as the others, and with opts.also only one
// both ways fit. A problem is left out where the answer's number is in the text before the answer step: a rest of 50%,
// whose answer is the per cent the question gives.

import { METHODS, wayFor } from '../methods.js';
import { hundredthsText } from '../percents.js';
import { drawSum } from './fractions.js';
import { decimalText } from './decimals.js';
import { thousandths } from '../check.js';
import { FRACTION_NAMES, namesOf } from '../fractions.js';

// the kinds of problem (plan P1, "Keys and asks"), and those of the easy level ("Sizes"), which the worked examples come
// from; a key asked for (opts.key) that the easy level has not is made with its usual numbers
export const KEYS = {
  'pct-benchmarks': ['shaded', 'rest', 'to-percent', 'from-percent', 'as-decimal'],
};
export const EASY = {
  'pct-benchmarks': ['shaded', 'to-percent'],
};

// The wholes a rest is told of (plan, "Rules every percentage generator keeps"), chosen for this game: one whole with one
// part done, never two parts of one thing. No digits here: every number in a question is one the problem draws. The sum
// keeps the noun, which its way says ("The whole fence is 100%.").
export const REST = [
  { id: 'fence', noun: 'fence', the: 'the fence', been: 'painted' },
  { id: 'garden', noun: 'garden bed', the: 'the garden bed', been: 'planted' },
  { id: 'book', noun: 'book', the: 'the book', been: 'read' },
  { id: 'puzzle', noun: 'puzzle', the: 'the puzzle', been: 'finished' },
  { id: 'pizza', noun: 'pizza', the: 'the pizza', been: 'eaten' },
  { id: 'cake', noun: 'cake', the: 'the cake', been: 'eaten' },
  { id: 'chocolate', noun: 'block of chocolate', the: 'the block of chocolate', been: 'eaten' },
];
const restOf = (sum) => REST.find((c) => c.noun === sum.noun);

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
// the per cents on a line's marks (the tens, the quarters and the half), and those off them: a single digit, and the rest
const ON_MARKS = [50, 25, 75, 10, 20, 30, 40, 60, 70, 80, 90];
const UNDER_TEN = range(1, 9);
const OFF_MARKS = range(11, 99).filter((p) => p % 10 !== 0 && p !== 25 && p !== 75);
// the benchmark fractions as per cents (l.55; one-tenth and its multiples, Examples fa0a18f458 l.100), never 5/10, which
// is the half
const FRACTIONS = [[1, 2], [1, 4], [3, 4], [1, 10], ...[2, 3, 4, 6, 7, 8, 9].map((k) => [k, 10])];

// P1's problems (plan P1, "Sizes"): shaded, a strip of 2, 4 or 10 parts, 1 to d − 1 shaded; rest, a ten half the time and
// a five that is not a ten half the time, never 50; to-percent, a fraction half the time, else a decimal on the line's
// marks two thirds of the time and one in hundredths off them one third, half of those under 0.1; from-percent, 50% in
// halves, 25% and 75% in quarters, the tens in tenths; as-decimal, the per cents on the marks two thirds of the time, one
// off them one third, half of those a single digit. No answer is more than a third of a key's problems or of the easy
// level's (the step's review, finding 1, a plan error: the plan's sizes made 50 half of them): the strips weighted 1 : 2 :
// 3 by their number of problems, so 50 is a third of shaded; the answers of 1 in from-percent (50% = ☐/2, 25% = ☐/4,
// 10% = ☐/10) a sixth of it (finding 2); at the easy level shaded in halves or quarters but never 2/4, and to-percent
// from 1/4 and 3/4 a third each, from 1/2 and 0.5 a sixth each, so 50 is a third of the level
function benchmarkClasses(key, easy) {
  const pct = (more) => ({ op: 'pct', key, ...more });
  const one = (sums) => [{ name: key, weight: 1, sums }];
  const fraction = ([n, d]) => pct({ p: (100 * n) / d, n, d });
  const decimal = (p) => pct({ p, dec: hundredthsText(p) });
  if (key === 'shaded') {
    const strip = (d) => range(1, d - 1).map((n) => fraction([n, d]));
    return easy ? one([2, 4].flatMap(strip).filter((x) => x.n * 2 !== x.d || x.d === 2))
      : [[2, 1], [4, 2], [10, 3]].map(([d, weight]) => ({ name: `in ${d}`, weight, sums: strip(d) }));
  }
  if (key === 'rest') {
    return [{ name: 'a ten', weight: 1, sums: ON_MARKS.filter((p) => p % 10 === 0 && p !== 50).sort((a, b) => a - b).map((p) => pct({ p })) },
      { name: 'a five', weight: 1, sums: range(0, 9).map((k) => pct({ p: 10 * k + 5 })) }];
  }
  if (key === 'to-percent') {
    if (easy) return [{ name: 'a quarter', weight: 2, sums: FRACTIONS.slice(1, 3).map(fraction) }, { name: 'a half', weight: 1, sums: [fraction([1, 2]), decimal(50)] }];
    return [{ name: 'a fraction', weight: 6, sums: FRACTIONS.map(fraction) }, { name: 'a decimal on the marks', weight: 4, sums: ON_MARKS.map(decimal) },
      { name: 'hundredths under 0.1', weight: 1, sums: UNDER_TEN.map(decimal) }, { name: 'other hundredths', weight: 1, sums: OFF_MARKS.map(decimal) }];
  }
  if (key === 'from-percent') {
    return [{ name: 'an answer of 1', weight: 2, sums: [[1, 2], [1, 4], [1, 10]].map(fraction) },
      { name: 'more than 1', weight: 10, sums: [[3, 4], ...range(2, 9).map((k) => [k, 10])].map(fraction) }];
  }
  if (key !== 'as-decimal') throw new Error(`no percentage problem of kind ${key}`);
  return [{ name: 'on the marks', weight: 4, sums: ON_MARKS.map((p) => pct({ p })) }, { name: 'a single digit', weight: 1, sums: UNDER_TEN.map((p) => pct({ p })) },
    { name: 'other per cents', weight: 1, sums: OFF_MARKS.map((p) => pct({ p })) }];
}

// every problem of a skill's key at a level, in its classes: [{ name, weight, sums }]
function classesOf(skillId, key, easy) {
  if (skillId === 'pct-benchmarks') return benchmarkClasses(key, easy);
  throw new Error(`${skillId} has no percentage problems`);
}
const MEMO = new Map(), KEPT = new Map();
export function problemsOf(skillId, key, easy) {
  if (!KEYS[skillId]?.includes(key)) throw new Error(`${skillId} has no kind of problem ${key}`);
  const at = `${skillId}:${key}:${Boolean(easy)}`;
  if (!MEMO.has(at)) MEMO.set(at, classesOf(skillId, key, Boolean(easy)));
  return MEMO.get(at);
}

// every way a problem can be told, for the voice tools (tools/voice-lines.mjs every): a rest in each of its wholes
export const tellings = (sum) => (sum.key === 'rest' && !sum.noun ? REST.map((c) => ({ ...sum, noun: c.noun })) : [sum]);
// a rest's whole, drawn after its numbers
const toldOf = (sum, rng) => (sum.key === 'rest' && !sum.noun ? { ...sum, noun: rng.pick(REST).noun } : sum);

// a problem: drawn as the fractions' are (engine/items/fractions.js drawSum: the key, its class by weight, a problem the
// ways fit), then a rest's whole
function sumFor(skillId, rng, easy, opts) {
  if (opts.sum) return toldOf(opts.sum, rng);
  return toldOf(drawSum(skillId, rng, easy, opts, { levelKeys: (easy ? EASY : KEYS)[skillId], problemsOf, kept: KEPT }).sum, rng);
}

// the question, its words, its answer and its picture, from the sum alone, so the same sum makes the same problem
// whichever way works it. No question ends on a fraction name, so a fraction's is said "Write 3/4 as a percentage." and
// a fraction asked for "75% is how many quarters of 100%?" (plan P1, "Keys and asks"); "%" is printed after her box, never
// typed (plan "The percentage answer, exactly")
function problem(sum) {
  const { key, p, n, d } = sum;
  if (key === 'shaded') {
    const ask = 'The shaded part is ☐% of the strip.';
    return { ask, say: ask, answer: { kind: 'number', value: p }, picture: { type: 'strips', rows: [{ d, shaded: n }] } };
  }
  if (key === 'rest') {
    // said as a question, its second sentence with a capital, never "what per cent of it …" from the box
    const c = restOf(sum), told = `${p}% of ${c.the} is ${c.been}.`;
    return { ask: `${told} ☐% of it is not ${c.been} yet.`, say: `${told} What per cent of it is not ${c.been} yet?`, answer: { kind: 'number', value: 100 - p } };
  }
  if (key === 'to-percent') {
    const ask = `${sum.dec ?? `${n}/${d}`} = ☐%`;
    return { ask, say: sum.dec ? ask : `Write ${n}/${d} as a percentage.`, answer: { kind: 'number', value: p } };
  }
  if (key === 'from-percent') return { ask: `${p}% = ☐/${d}`, say: `${p}% is how many ${namesOf(d)} of 100%?`, answer: { kind: 'number', value: n } };
  if (key !== 'as-decimal') throw new Error(`no percentage problem of kind ${key}`);
  const ask = `${p}% as a decimal is ☐`;
  return { ask, say: ask, answer: { kind: 'decimal', value: hundredthsText(p) } };
}

// A hint for her actual mistake (plan, "Rules every percentage generator keeps"), each a question, else none (the way's):
// the fixed ones, HINTS (hints, tools/voice-lines.mjs), and the rest built from the problem's numbers, each listed for its
// problem by hintLines(item) so the tools that voice them have every one
export const HINTS = {
  // a decimal place slipped: 5% as 0.5, 0.05 as 50% ("Students should know that 0.5 = 1/2 and 0.5 is not 1/5", Examples
  // fa0a18f458 l.104)
  PLACE: 'Per cent means out of 100: are these tenths or hundredths?',
  // a rest: the part done given for the part left, and the part done added to the whole
  DONE: 'That is the part done. The whole is 100%: how much is left?',
  MORE: 'Is the rest more or less than the whole, 100%?',
};
// a fraction's digits read as the per cent: 3/4 as 34, looked for only where the digits make a per cent of 1 to 99 (1/2,
// 1/4, 3/4), never tenths' 710, a slip she would hardly make (the step's review, finding 6; no other hint, R12)
const digitsOf = ({ n, d }) => Number(`${n}${d}`);
const digitsSlip = (sum) => sum.key === 'to-percent' && !sum.dec && digitsOf(sum) <= 99;
// the answer with its point slipped one place either way, in thousandths: 0.05 as 0.5 or 0.005, 5% from 0.05 as 50% (a
// whole per cent only)
function placeSlips({ sum, answer }) {
  if (sum.key === 'as-decimal') {
    const a = thousandths(answer.value);
    return [a * 10n, ...(a % 10n === 0n ? [a / 10n] : [])];
  }
  if (sum.key === 'to-percent' && sum.dec) return [BigInt(sum.p) * 10000n, ...(sum.p % 10 === 0 ? [BigInt(sum.p) * 100n] : [])];
  return [];
}
function hintFor(item, given) {
  const { sum } = item;
  if (sum?.op !== 'pct') return null;
  const g = Array.isArray(given) ? given[0] : given;
  const th = g == null ? null : thousandths(String(g));
  if (digitsSlip(sum) && th === BigInt(digitsOf(sum)) * 1000n) {
    return `Is ${sum.n}/${sum.d} the same as ${digitsOf(sum)} out of 100? How many per cent is each ${FRACTION_NAMES[sum.d][0]} of the whole?`;
  }
  if (th !== null && placeSlips(item).includes(th)) return HINTS.PLACE;
  if (sum.key === 'rest' && th === BigInt(sum.p) * 1000n) return HINTS.DONE;
  if (sum.key === 'rest' && th === BigInt(100 + sum.p) * 1000n) return HINTS.MORE;
  return null;
}

// every hint text hintFor gives for a problem, each misconception's mistake worked out from the problem, for the tools
// that list the lines to voice
export function hintLines(item) {
  const { sum } = item;
  if (sum?.op !== 'pct') return [];
  const givens = placeSlips(item).map((th) => decimalText(Number(th)));
  if (digitsSlip(sum)) givens.push(String(digitsOf(sum)));
  if (sum.key === 'rest') givens.push(String(sum.p), String(100 + sum.p));
  return [...new Set(givens.map((g) => hintFor(item, g)).filter(Boolean))];
}

export default {
  skills: ['pct-benchmarks'],
  // opts.key makes that kind, opts.sum that very problem, opts.method works it that way where it fits (else the first
  // way that does, saying why first: wayFor), opts.also draws only a problem that way fits too, opts.op only a kind of
  // that sum, opts.easy the easy level
  make(skillId, rng, opts = {}) {
    const sum = sumFor(skillId, rng, Boolean(opts.easy), opts);
    const { method, steps } = wayFor(skillId, sum, opts.method);
    const way = METHODS[method];
    const { picture, ...question } = problem(sum);
    return { skill: skillId, key: sum.key, sum, method, ...question, steps, picture: picture ?? way.picture(sum), hint: way.hint(sum), words: way.words(sum) };
  },
  hintFor,
  hints: Object.values(HINTS),
  // every problem of a kind, every way it is told, and every hint for a mistake, for the voice tools
  // (tools/voice-lines.mjs every, linesFor), which list a generator's problems whole wherever its default export has
  // problemsOf
  problemsOf,
  tellings,
  hintLines,
};
