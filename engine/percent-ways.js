// The percentage ways (stage 6 strand 3, plans/2026-10-25-stage-6-plan.md "The ways"), each its own steps, picture,
// hint and words, kept apart from engine/methods.js, which takes them all into METHODS, as engine/fraction-ways.js is.
// A percentage sum is { op: 'pct', key, p, n?, d?, dec?, noun? } (pct-benchmarks: p the whole per cent, n/d the fraction
// where there is one, dec the decimal text of a per cent asked from a decimal, noun the whole of a rest); pct-of's 'pof'
// and pct-discount's 'poff' and 'pest' come with their own ways in later steps (engine/items/index.js). None of these
// ops is a whole-number one (engine/methods.js WHOLE_OPS), so no whole-number way takes them, and every way here names
// its own.
//
// Out of 100: "Recognise that the symbol % means percent and 100% is the whole amount" and "Represent common percentages
// of quantities and lengths as fractions and decimals" (Stage 3 Represents numbers B, saved copy 2026-10-10-1116-article-
// k-10-mathematics-k-10-syllabus-2022-fa0a18f458.md l.54, l.56), "25% means 25 out of 100 or 25/100 or 0.25" (its
// Example, Examples fa0a18f458 l.51), "'Per centum', the Latin origin of per cent means 'by the hundred'" (l.110). On a
// number line: "Recall commonly used equivalent percentages, decimals and fractions including 1/2, 1/4, and 3/4" (l.55),
// one-tenth among the benchmarks (Examples fa0a18f458 l.98-100), fractions over the line and percentages and decimals
// under it, "locate 3/4, 0.75, and 75% on it" (IES 2010 l.678). NSW Mathematics K–10 Syllabus (2022), 16 June 2026
// amendments, checked 28 October 2026. The line works only what is on its marks, the tenths, quarters and the half, and
// says why where it cannot (wayFor), naming the number as the question shows it, never the answer; it never works a rest
// (on a line of tenths the answer's own percentage would be drawn) nor a fraction whose numerator is 1, the line's
// whole-number label (plan P1, "Ways").

import { percentFraction, hundredthsText } from './percents.js';

// a per cent on the line's marks: a whole number of tens, a quarter or the half
const onMarks = (p) => percentFraction(p) !== null;
// the per cent or decimal a question asks from, as it shows it: '3/4', '0.75'
const asked = (sum) => sum.dec ?? `${sum.n}/${sum.d}`;
const fromDecimal = (sum) => sum.dec !== undefined;

// ---- the answer step, the same whichever way, in the question's order: "So 3/4 = ☐%" for "3/4 = ☐%", "So 75% = ☐/4"
// for "75% = ☐/4", "So 75% = ☐" for "75% as a decimal is ☐" (plan, "Rules every percentage generator keeps"); after a
// way's own word, "3 parts: so …" ----

export function percentAnswer(sum, lead = null) {
  const { key, p } = sum;
  if (key === 'shaded') return { text: lead ? `${lead}: so the shaded part is ☐% of the strip.` : 'So the shaded part is ☐% of the strip.', value: p, answer: true };
  if (key === 'rest') return { text: `So 100% − ${p}% = ☐%`, value: 100 - p, answer: true };
  if (key === 'to-percent') return { text: `So ${asked(sum)} = ☐%`, value: p, answer: true };
  if (key === 'from-percent') return { text: `So ${p}% = ☐/${sum.d}`, value: sum.n, answer: true };
  if (key !== 'as-decimal') throw new Error(`no percentage problem of kind ${key}`);
  return { text: `So ${p}% = ☐`, value: hundredthsText(p), answer: true };
}

// ---- Out of 100 (pct-benchmarks): per cent means out of 100, the whole is 100%; cut 100% into the parts, or read
// hundredths ----

// The strip filled in, each part its per cent, goes on the step that finds one part, not marked working, so where that
// step is hers it shows boxes as her question does (js/runner.js ownPicture, asked); the answer step after it carries it
// marked working, so the parts she has found stay filled in, as F6's tape does (engine/fraction-ways.js found, carried).
// A tenth's part, 32.4 px, is too narrow for "10%" even at 16 px, so a strip of tenths is marked 100% over the whole
// strip instead (strips' total), as the step says (the second replay's looker, round 2)
const filled = (d, n) => (d === 10 ? { type: 'strips', rows: [{ d, shaded: n }], total: '100%' } : { type: 'strips', rows: [{ d, shaded: n, value: `${100 / d}%` }] });
function hundredSteps(sum) {
  const { key, p, n, d } = sum;
  if (key === 'shaded') {
    if (n === 1) return [{ text: `The whole strip is 100%, cut into ${d} equal parts.` }, percentAnswer(sum)];
    const part = { text: `The whole strip is 100%: 100% ÷ ${d} = ☐% in each part`, value: 100 / d, picture: filled(d, n) };
    return [part, { ...percentAnswer(sum, `${n} parts`), picture: { ...part.picture, working: true } }];
  }
  if (key === 'rest') return [{ text: `The whole ${sum.noun} is 100%.` }, percentAnswer(sum)];
  if (key === 'to-percent' && fromDecimal(sum)) return [{ text: `Per cent means hundredths: write ${sum.dec} in hundredths.` }, percentAnswer(sum)];
  if (key === 'to-percent' && n === 1) return [{ text: `Cut 100% into ${d} equal parts.` }, percentAnswer(sum)];
  if (key === 'to-percent' || key === 'from-percent') return [{ text: `100% ÷ ${d} = ☐% in each part`, value: 100 / d }, percentAnswer(sum)];
  if (key !== 'as-decimal') throw new Error(`no percentage problem of kind ${key}`);
  return [{ text: 'Per cent means out of 100, and hundredths are the second place after the point.' }, percentAnswer(sum)];
}

// its hint asks about the parts, but where it reads hundredths (as-decimal, to-percent from a decimal) no parts are drawn,
// so there it asks about the hundredths (the looker's F4 on the step 3.2 replay)
const readsHundredths = (sum) => sum?.key === 'as-decimal' || (sum?.key === 'to-percent' && fromDecimal(sum));

const pctHundred = {
  op: 'pct', title: 'Out of 100',
  fits: (sum) => sum?.op === 'pct',
  steps: hundredSteps,
  picture: () => null,
  hint: (sum) => (readsHundredths(sum) ? 'Per cent means out of 100. How many hundredths is it?' : 'Per cent means out of 100. How many per cent is each part?'),
  words: () => ['per cent', 'percentage', 'benchmark'],
};

// ---- On a number line (pct-benchmarks): fractions over the line, percentages (and decimals) under it, one point and
// its names (IES 2010 l.678); every line marked working, so it shows only in the worked steps ----

// the point a question asks about, in the line's parts: the fraction it shows or asks for, else its per cent's
function pointOf(sum) {
  if (sum.d && !fromDecimal(sum)) return { n: sum.n, d: sum.d };
  return percentFraction(sum.p);
}
const lineOf = (d, more) => ({ type: 'fracline', wholes: 1, d, below: d, pct: true, ...more, working: true });
// the kinds of problem it works, each its own first step; any other is no percentage problem it knows (review 5)
const LINE_KEYS = ['shaded', 'to-percent', 'from-percent', 'as-decimal'];
function lineSteps(sum) {
  if (!LINE_KEYS.includes(sum.key)) throw new Error(`no percentage problem of kind ${sum.key}`);
  const { key, p } = sum, { n, d } = pointOf(sum);
  let first;
  if (key === 'shaded' || (key === 'to-percent' && !fromDecimal(sum))) {
    first = { text: 'Fractions over the line, percentages under it, at the same points.', picture: lineOf(d, { labels: 'all', point: { n, d, label: '', below: '?' } }) };
  } else if (key === 'to-percent') {
    first = { text: 'Percentages and decimals under the line, at the same points.', picture: lineOf(d, { labels: 'wholes', dec: true, point: { n, d, label: '', below: '?' } }) };
  } else if (key === 'from-percent') {
    first = { text: `Find ${p}% under the line, and count the parts over it from 0.`, picture: lineOf(d, { labels: 'wholes', point: { n, d, label: '' } }) };
  } else {
    first = { text: 'Percentages and decimals under the line, at the same points.', picture: lineOf(d, { labels: 'wholes', dec: true, point: { n, d, label: '', dec: '?' } }) };
  }
  // the answer step carries the same line, so the line she reads from stays in a worked example, as out of 100's
  // answer step carries its filled strip (the second replay's looker, round 2); the line is already marked working by
  // lineOf, so it stays off the question
  return [first, { ...percentAnswer(sum), picture: first.picture }];
}

// why the line cannot work a sum, or null: a rest, and a from-percent whose answer is 1, would have the answer drawn on
// it (70% under a line of tenths with its point at 30%; the whole-number label 1, engine/render/svg.js fracline); a
// decimal or per cent off its marks, named as the question shows it
function lineStops(sum) {
  if (sum?.op !== 'pct') return null;
  if (sum.key === 'rest' || (sum.key === 'from-percent' && sum.n === 1)) return 'it would give the answer away';
  if (sum.key === 'to-percent' && fromDecimal(sum) && !onMarks(sum.p)) return `${sum.dec} is between the line's marks`;
  if (sum.key === 'as-decimal' && !onMarks(sum.p)) return `${sum.p}% is between the line's marks`;
  return null;
}

const pctLine = {
  // its title read as a place, so where it stops it is named as a thing, as the fractions' line is (engine/fraction-ways.js)
  op: 'pct', title: 'On a number line', refusedAs: 'A number line',
  fits: (sum) => sum?.op === 'pct' && !lineStops(sum),
  stops: lineStops,
  steps: lineSteps,
  picture: () => null,
  hint: () => 'Find the point on the line. What is written under it, or what would be?',
  words: () => ['per cent', 'percentage', 'benchmark', 'number line'],
};

export const PERCENT_WAYS = { 'pct-hundred': pctHundred, 'pct-line': pctLine };
