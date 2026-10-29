// The measurement ways (stage 6 strand 4, plans/2026-10-25-stage-6-plan.md "The ways"), each its own steps, picture,
// hint and words, kept apart from engine/methods.js, which takes them all into METHODS, as engine/percent-ways.js is.
// A measurement sum is { op: 'mread', key, device, unit, marks, parts, start, end, ask, name } (read a scale: marks its
// labelled values as text, consecutive whole numbers of unit; parts the small spaces between two of them; start and end
// whole numbers of small spaces from the first mark; ask the unit of her box; name what is measured, "the pencil") or
// { op: 'mconv', key, form, value, from, to } (change units: value the amount in from, decimal text; to the unit of her
// box; form 'to-larger' "2600 m = ☐ km", 'to-smaller' "2.6 km = ☐ m", 'split' "2.6 km = 2 km ☐ m" or 'join' "2 km
// 600 m = ☐ km", the join's value the whole amount in the smaller unit, 2600), { op: 'mtotal', key, parts: [{ value,
// unit }], to } (lengths added: each part's amount as written and its unit; to the unit of her box, one part's own) or
// { op: 'mper', key, kind, sides, unit, name? } (a perimeter: kind 'rect' { l, w }, 'square' or 'rhombus' { s }, 'tri'
// { a, b, c }, 'lshape' { W, H, cw, ch }, every side a whole number of unit; name the place a large rectangle in metres
// is, "the playground") or { op: 'marea', key, kind: 'rect', sides: { l, w }, unit, name?, unknown? } (an area: a
// rectangle's in unit², its length l the longer side; unknown the side a missing side's question boxes, 'l' or 'w'; name
// the place a large one is, "the netball court") or { op: 'marea', key: 'hectare', form, value, from, to } (a change
// between square metres and hectares, its form 'to-larger' "25 000 m² = ☐ ha" or 'to-smaller' "3.5 ha = ☐ m²", as a
// change of length's) or { op: 'marea', key: 'hectare', form: 'field', sides: { l, w }, unit: 'm', from: 'm²', to: 'ha',
// name } (a field's area in hectares, "A field is a rectangle 250 m long and 100 m wide."). None of these ops is a
// whole-number one
// (engine/methods.js WHOLE_OPS), so no whole-number way takes them, and every way here names its own. Every amount is
// worked in BigInt thousandths of its kind's smallest unit (engine/units.js), never a float, and shown with a no-break
// space before its unit, "2.6 km", as the page records it (Stage 3 Geometric measure A, saved copy 2026-10-28-2213-
// article-k-10-mathematics-k-10-syllabus-2022-fa35c41b81.md l.150).
//
// Reading a scale, each space first and in the smaller unit: "Select and use an appropriate scaled instrument to measure
// lengths and distances", "A tape measure, ruler or trundle wheel." (Stage 2 Geometric measure B, saved copy …fa620a8f93.md
// l.67-69), "Interpret decimal notation for lengths and distances", "Such as 13.5 cm is 13 centimetres and 5 millimetres"
// (Stage 3 Geometric measure B, saved copy …fae314fde1.md l.43-45), "Such as 53 mm or 6 cm 2 mm." (Stage 2 Geometric
// measure A, saved copy …fae78c0853.md l.67). Changing units by moving the digits, or whole units first: "Use decimal
// place value system to convert between metres and kilometres", "Such as 2600 m is 2.6 km because there are 1000 m in
// one kilometre.", "to convert from kilometres to metres, I need to multiply by 1000" (S3 GM B l.53-55, l.61-63), its
// teaching advice's tape of places, "10 times" to the left and "1/10" to the right (l.142-148); "Such as 1 km 200 m."
// (S3 GM A l.57). Adding lengths in different units, each changed to the unit asked first: "Solve a variety of problems
// involving length and perimeter, including problems involving different units of length", "Find the total length of 3
// items measuring 5 mm, 20 cm and 1.2 m." (S3 GM B l.71-73). Perimeters, every side added or equal sides together:
// "Calculate perimeters of common two-dimensional shapes, including squares, rectangles and triangles", "Determine which
// side lengths are needed to find the perimeter of a shape", "To calculate the perimeter of a rhombus, only one side
// length is required." (S3 GM A l.63-71), and its hexagon with 5 right angles, "The unmarked horizontal lines must add to
// 5 cm with the unmarked vertical lines adding to 4 cm." (l.122-126). Areas of rectangles, by rows of squares or NESA's
// words, and hectares, MA3-2DS-02 (Outcomes l.288): "Equate one hectare to the area of a square with side lengths of 100
// m, ie 10 000 square metres = 1 hectare (ha)", "Record areas using square kilometres and hectares" (Stage 3
// Two-dimensional spatial structure A, saved copy …fad7c142c4.md l.61-63), "Record, using words, the method for finding
// the area of any rectangle", "Area of rectangle = number of units of length × number of units of width.", "Calculate
// areas of rectangles in square centimetres (cm²), square metres (m²) and square kilometres (km²)", "Find the dimensions
// of different rectangles with an area of 24 cm²." (l.71-79), its teaching advice's "how many squares fit in one row and
// multiply this by the number of rows that make up the width" and its 6 cm by 4 cm rectangle with a row and a column of
// 1 cm squares (l.98-100); "Create the array structure of area using squares (1 cm × 1 cm) in rows and columns" (Stage
// 2 Two-dimensional spatial structure A, saved copy …fae82874e2.md l.95). NSW Mathematics K–10 Syllabus (2022), 16 June
// 2026 amendments, checked 28 October 2026 (the totals and perimeters, and the areas, 29 October 2026). Chosen for this
// game, not a syllabus requirement: a ruler or tape measure read from a picture in place of a real device (S3 GM A l.59,
// "Use a variety of measuring devices"), and the split and join forms with one box (plan "What is outside NESA in the
// measurement strand"). "Moves to the right" means into smaller places, the number getting smaller, as dec-x10's way says
// it, and "right" or "left" is always beside "places" (plan M1, "Ways").

import { UNITS, amountText, inBase, fromBase } from './units.js';
import { thousandths } from './check.js';
import { so, keptOf } from './fraction-ways.js';

const NB = ' ';
const cap = (t) => t[0].toUpperCase() + t.slice(1);
// an amount as shown, "2.6 km"
const shown = (text, unit) => amountText(text, unit);
// a value for her box: in the smaller unit a whole number, in the larger decimal text, its point key showing even where
// whole (plan, "Settled for the whole strand")
const boxed = (text, small) => (small ? Number(text) : text);

// ---- reading a scale (mread): a ruler in centimetres or a tape measure in metres, its smaller unit millimetres or
// centimetres ----

// the unit one small space is named in where it is a whole number of it: a ruler's millimetres, a tape's centimetres
export const SMALLER = { cm: 'mm', m: 'cm' };
// the scale's numbers in thousandths of its unit: the first mark, one labelled step, one small space, where the object
// starts and ends, the labelled mark before the end and how many spaces past it the end is (the generator's hints too,
// engine/items/measurement.js)
export function scaleOf(sum) {
  const first = thousandths(sum.marks[0]), step = thousandths(sum.marks[1]) - first, parts = BigInt(sum.parts);
  const space = step / parts, before = Math.floor(sum.end / sum.parts);
  return {
    first, step, space, before, past: sum.end - before * sum.parts,
    start: first + (step * BigInt(sum.start)) / parts, end: first + space * BigInt(sum.end), mark: first + step * BigInt(before),
  };
}
// thousandths of a unit back to its shortest text, in that unit or in another of its kind
const asText = (th, unit, as = unit) => fromBase(th * UNITS[unit].base, as);
// the reading: the length (the end less the start) in the unit her box asks, as text ('4.5', '45')
export const readValue = (sum) => {
  const s = scaleOf(sum);
  return asText(s.end - s.start, sum.unit, sum.ask);
};
// one small space in the smaller unit, where whole: a ruler's halves 5 mm, fifths 2 mm; a tape's 50, 25 or 20 cm
const smallSpace = (sum) => {
  const s = scaleOf(sum), small = SMALLER[sum.unit], th = s.space * UNITS[sum.unit].base;
  return th % (UNITS[small].base * 1000n) ? null : asText(s.space, sum.unit, small);
};
const spaces = (n) => `${n} space${n === 1 ? '' : 's'}`;
// where the object starts, past 0 or at it
const fromZero = (sum) => scaleOf(sum).start === 0n;

// the answer step in the question's order, "So the pencil is ☐ cm long", after a way's own word ("4 cm and 5 mm: so …")
function readAnswer(sum, lead) {
  return { text: so(lead, `${sum.name} is ☐${NB}${sum.ask} long`), value: boxed(readValue(sum), sum.ask !== sum.unit), answer: true };
}

// Each space first: what one small space is worth (one labelled step ÷ the spaces between), then count on from the
// labelled mark before the end; from a start past 0, the end's reading, then the start taken away
function spaceSteps(sum) {
  const s = scaleOf(sum), u = sum.unit, mark = asText(s.mark, u), next = asText(s.mark + s.step, u);
  const worth = { text: `From ${mark} to ${next} is ${shown(asText(s.step, u), u)}, cut into ${sum.parts} equal spaces: each space is ☐${NB}${u}`, value: asText(s.space, u) };
  const ends = `${cap(sum.name)} ends ${spaces(s.past)} past ${shown(mark, u)}`, at = asText(s.end, u);
  if (!fromZero(sum)) {
    const start = asText(s.start, u);
    return [worth, { text: `${ends}: it ends at ☐${NB}${u}`, value: at },
      { text: so(`It starts at ${shown(start, u)}`, `${sum.name} is ${shown(at, u)} − ${shown(start, u)} = ☐${NB}${u} long`), value: readValue(sum), answer: true }];
  }
  if (sum.ask === u) return [worth, readAnswer(sum, ends)];
  return [worth, { text: `${ends}: it ends at ☐${NB}${u}`, value: at }, readAnswer(sum, `${shown(at, u)} in ${UNITS[sum.ask].many}`)];
}

// Use the smaller unit: one space named in it, then the spaces past the mark counted in it, then the reading in the unit
// her box asks ("4 cm and 7 mm is 4.7 cm"); only from 0, and only where one space is a whole number of the smaller unit
function smallSteps(sum) {
  const s = scaleOf(sum), u = sum.unit, small = SMALLER[u], mark = asText(s.mark, u), each = smallSpace(sum);
  const over = asText(s.space * BigInt(s.past), u, small);
  return [{ text: `${shown('1', u)} is ${shown(asText(1000n, u, small), small)}, cut into ${sum.parts} equal spaces: each space is ☐${NB}${small}`, value: Number(each) },
    { text: `${cap(sum.name)} ends ${spaces(s.past)} past ${shown(mark, u)}: ${shown(mark, u)} and ☐${NB}${small}`, value: Number(over) },
    readAnswer(sum, `${shown(mark, u)} and ${shown(over, small)}`)];
}
// why the smaller unit cannot read it, true of the scale as shown: the object starts past 0, or a ruler's quarter of a
// centimetre is 2.5 mm (the only space of a ruler or tape that is not a whole number of the smaller unit)
function smallStops(sum) {
  if (sum?.op !== 'mread') return null;
  // "at 0" kept on one line by a no-break space, so no line begins "0. Here is …", which reads as a decimal (the looker's
  // finding 11, step 4.2); said the same
  if (!fromZero(sum)) return `${sum.name} starts at ${shown(asText(scaleOf(sum).start, sum.unit), sum.unit)}, not at${NB}0`;
  return smallSpace(sum) === null ? `a quarter of a ${UNITS[sum.unit].one} is not a whole number of ${UNITS[SMALLER[sum.unit]].many}` : null;
}

const unitsOf = (sum) => [UNITS[sum.unit].one, UNITS[SMALLER[sum.unit]].one];

const scaleSpace = {
  op: 'mread', title: 'Each space first',
  fits: (sum) => sum?.op === 'mread',
  steps: (sum) => keptOf(spaceSteps(sum)),
  picture: () => null,
  hint: () => 'How much is one small space worth? Count on from the number before it.',
  words: (sum) => ['scale', 'measure', ...unitsOf(sum)],
};

const scaleSmall = {
  op: 'mread', title: 'Use the smaller unit', refusedAs: 'The smaller unit',
  fits: (sum) => sum?.op === 'mread' && !smallStops(sum),
  stops: smallStops,
  steps: (sum) => keptOf(smallSteps(sum)),
  picture: () => null,
  hint: () => 'How many of the smaller unit is one space?',
  words: (sum) => ['scale', 'measure', ...unitsOf(sum)],
};

// ---- changing units (mconv): millimetres and centimetres, centimetres and metres, metres and kilometres ----

// the pair a sum changes between, the smaller unit first, and how many of it make one of the larger: { small, large,
// factor, places }, factor a BigInt (10, 100, 1000), places the places every digit moves (1, 2, 3)
export function pairOf(sum) {
  const [small, large] = UNITS[sum.from].base < UNITS[sum.to].base ? [sum.from, sum.to] : [sum.to, sum.from];
  const factor = UNITS[large].base / UNITS[small].base;
  return { small, large, factor, places: String(factor).length - 1 };
}
// the amount's numbers: the whole of it in thousandths of the smaller unit, the whole larger units in it, and the part
// left in the smaller unit
function amountsOf(sum) {
  const { small, large } = pairOf(sum), base = inBase(sum.value, sum.from), one = UNITS[large].base * 1000n;
  const whole = base / one, part = base - whole * one;
  return { base, whole: String(whole), part: fromBase(part, small), partLarge: fromBase(part, large), small, large };
}
// the answer, as text: the amount in the larger unit (to-larger, join), in the smaller (to-smaller), or the part left in
// the smaller unit (split)
export function convertValue(sum) {
  const a = amountsOf(sum);
  if (sum.form === 'split') return a.part;
  return fromBase(a.base, sum.to);
}
// the question as shown, "2600 m = ☐ km", "2.6 km = 2 km ☐ m", "2 km 600 m = ☐ km"; the generator's ask and every
// answer step ("So …") alike
export function convertAsk(sum) {
  const a = amountsOf(sum);
  if (sum.form === 'split') return `${shown(sum.value, sum.from)} = ${shown(a.whole, a.large)} ☐${NB}${a.small}`;
  if (sum.form === 'join') return `${shown(a.whole, a.large)} ${shown(a.part, a.small)} = ☐${NB}${a.large}`;
  if (sum.form !== 'to-larger' && sum.form !== 'to-smaller') throw new Error(`no measurement problem of form ${sum.form}`);
  return `${shown(sum.value, sum.from)} = ☐${NB}${sum.to}`;
}
const convertAnswer = (sum) => ({ text: so(null, convertAsk(sum)), value: boxed(convertValue(sum), sum.to === pairOf(sum).small), answer: true });
// "1 km is 1000 m", and how far every digit moves: "3 places to the right" into the larger unit, "to the left" into the
// smaller
const isFactor = ({ small, large, factor }) => `${shown('1', large)} is ${shown(String(factor), small)}`;
const moves = ({ places }, into) => `${places} place${places === 1 ? '' : 's'} to the ${into === 'larger' ? 'right' : 'left'}`;
// The narrowest a step card gives a picture at 390 × 844, measured in WebKit through the game's own Runner (step 4.2,
// pt76): "Another way"'s card 300 px, a worked example's 318, "Show me one step"'s 330. A picture wider than its card is
// drawn at the card's width, its text shrunk with it
const CARD = 300;
// A chart of one number as engine/render/svg.js decimalChart lays it out, copied here as engine/fraction-ways.js copies
// the strips' (narrowest), since this file may not import svg.js: svg.js imports placevalue.js, which imports methods.js,
// which imports this file (step 4.2's code review 2, finding 2); tests/stage6-measurement.test.js checks the copy against
// svg.js for every convert problem's chart. Its places named in full where they fit 340 px less its padding, else by
// letters with a key under it; its width (as the viewBox, whole px) and its smallest text, in px as drawn. One row only,
// as chartOf makes it: a picture's rows are left out. Its columns and decimals clamped as svg.js does (whole), so one
// left out is taken as 0
const PHONE = 340, PAD = 8, POINT = 14, SMALL = 16;
const WHOLE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'], DEC_NAMES = ['tenths', 'hundredths', 'thousandths'];
const WHOLE_SHORT = ['O', 'T', 'H', 'Th', 'TTh', 'HTh'], DEC_SHORT = ['t', 'h', 'th'];
// a text's width, estimated in ems as svg.js estimates it (em, plainWidth)
const em = (c) => {
  if (c >= '0' && c <= '9') return 0.6;
  if (c === ' ' || c === NB) return 0.3;
  if (c === '%') return 0.9;
  if ('+−×÷=<>'.includes(c)) return 0.64;
  if ('.,:;\'!|()[]ijlrtf'.includes(c)) return 0.34;
  if ('mwMW'.includes(c)) return 0.88;
  if (c >= 'A' && c <= 'Z') return 0.7;
  return 0.56;
};
const sumOf = (xs) => xs.reduce((a, b) => a + b, 0);
const whole = (v, top) => {
  const n = typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : 0;
  return Math.min(top, Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)));
};
const widthOf = (t, size) => sumOf([...String(t)].map(em)) * size;
const keyLines = (items, maxW) => items.reduce((lines, it) => {
  const last = lines.at(-1);
  if (last && widthOf(`${last} · ${it}`, SMALL) <= maxW) lines[lines.length - 1] = `${last} · ${it}`;
  else lines.push(it);
  return lines;
}, []);
export function chartSize({ value, columns, decimals }) {
  // its digits as decimalChart counts them (items/decimals.js splitDecimal): spaces and commas gone, a '?' a digit drawn
  // as a box
  const text = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : String(value ?? '');
  const [w0, f0 = ''] = text.replace(/[\s,]/g, '').split('.'), digits = (t) => t.split('').filter((c) => /[0-9?☐]/.test(c));
  const nd = Math.max(1, Math.min(3, Math.max(whole(decimals, 3), digits(f0).slice(0, 3).length)));
  const nw = Math.max(1, Math.min(6, Math.max(whole(columns, 6), digits(w0).slice(-6).length))), nc = nw + nd;
  const nameOf = (k) => (k < nw ? WHOLE_NAMES[nw - 1 - k] : DEC_NAMES[k - nw]);
  const fullHeads = Array.from({ length: nc }, (_, k) => {
    const ws = (nameOf(k)[0].toUpperCase() + nameOf(k).slice(1)).split(' ');
    return ws.length > 1 ? [ws[0], ws.slice(1).join(' ')] : ws;
  });
  const fullW = fullHeads.map((x) => Math.max(46, ...x.map((t) => widthOf(t, SMALL) + 6)));
  const full = sumOf(fullW) + POINT <= PHONE - 2 * PAD;
  const heads = full ? fullHeads : Array.from({ length: nc }, (_, k) => [k < nw ? WHOLE_SHORT[nw - 1 - k] : DEC_SHORT[k - nw]]);
  const share = Math.floor((PHONE - 2 * PAD - POINT) / nc);
  const colW = full ? fullW : heads.map(([t]) => Math.max(Math.min(40, share), widthOf(t, SMALL) + 6));
  const w = sumOf(colW) + POINT + 2 * PAD;
  const key = (ks) => keyLines(ks.map((k) => `${heads[k][0]} ${nameOf(k)}`), w - 2 * PAD);
  const keys = full ? [] : [...key(Array.from({ length: nw }, (_, k) => k)), ...key(Array.from({ length: nd }, (_, j) => nw + j))];
  const headH = full ? (heads.some((x) => x.length > 1) ? 48 : 30) : 26, keyH = keys.length ? keys.length * 22 + 6 : 0;
  const rowH = Math.min(50, Math.floor(258 - 2 * PAD - headH - keyH));
  return { width: Math.ceil(w), least: Math.min(SMALL, Math.min(30, rowH - 10)) };
}
// whether every text of a chart is 16 px or more as she sees it in that card (plan, fact 9: no text under 16 px): its
// smallest text, shrunk where the chart is wider than the card
function readable(picture) {
  const { width, least } = chartSize(picture);
  return (least * Math.min(width, CARD)) / width >= 16;
}
// The place-value chart of the number that moves (strand 1's decimalChart), its columns wide enough for the number it
// becomes too, marked working, so it shows in the worked steps only (plan M1, "Picture"). Where one of its digits is the
// answer's number, a part that becomes a single digit ("13.5 cm = 13 cm ☐ mm", whose chart of 0.5 shows the 5), there is
// no chart and the words are the same, as fact 9's branch gives a number the chart cannot draw (step 4.2, R12: the rule
// "The answer's number is in no earlier text" would otherwise take every split of millimetres and centimetres, NESA's
// own 13.5 cm among them); and none where its text would be under 16 px as she sees it, fact 9's own branch (the
// looker's finding 4, step 4.2: the 8 columns of 20.001 km, their headers about 14 px), its words the same
function chartOf(moving, becomes, answer) {
  const wholeOf = (t) => t.split('.')[0].length, placesOf = (t) => (t.split('.')[1] ?? '').length;
  if (moving.replace('.', '').split('').some((c) => BigInt(c) * 1000n === thousandths(String(answer)))) return {};
  const picture = { type: 'placevalue', value: moving, columns: Math.max(wholeOf(moving), wholeOf(becomes)), decimals: Math.max(1, placesOf(moving), placesOf(becomes)), working: true };
  return readable(picture) ? { picture } : {};
}

// Move the digits: name how many of the smaller unit make one of the larger, then every digit moves that many places,
// left into the smaller unit, right into the larger
function placeSteps(sum) {
  const pair = pairOf(sum), a = amountsOf(sum), answer = convertAnswer(sum);
  if (sum.form === 'to-larger' || sum.form === 'to-smaller') {
    const into = sum.form === 'to-larger' ? 'larger' : 'smaller';
    return [{ text: `${isFactor(pair)}, so every digit moves ${moves(pair, into)}.`, ...chartOf(sum.value, convertValue(sum), answer.value) }, answer];
  }
  if (sum.form === 'split') {
    return [{ text: `The ${shown(a.whole, a.large)} stays. ${shown(a.partLarge, a.large)} moves into ${UNITS[a.small].many}: every digit ${moves(pair, 'smaller')}.`, ...chartOf(a.partLarge, a.part, answer.value) }, answer];
  }
  const part = { text: `${shown(a.part, a.small)} is changed to ${UNITS[a.large].many}, every digit ${moves(pair, 'larger')}: ${shown(a.part, a.small)} = ☐${NB}${a.large}`, value: a.partLarge };
  return [{ ...part, ...chartOf(a.part, a.partLarge, answer.value) }, answer];
}

// Whole units first: split it into whole units and the part left, change each, then put them together; only where the
// whole part is at least 1 of the larger unit
function splitSteps(sum) {
  const a = amountsOf(sum), answer = convertAnswer(sum), { factor } = pairOf(sum);
  const wholeSmall = fromBase(BigInt(a.whole) * UNITS[a.large].base * 1000n, a.small);
  if (sum.form === 'to-larger') {
    return [{ text: `${shown(sum.value, a.small)} is ${shown(wholeSmall, a.small)} and ${shown(a.part, a.small)}.` },
      { text: `${shown(wholeSmall, a.small)} = ☐${NB}${a.large}`, value: a.whole }, { text: `${shown(a.part, a.small)} = ☐${NB}${a.large}`, value: a.partLarge }, answer];
  }
  if (sum.form === 'to-smaller') {
    return [{ text: `${shown(sum.value, a.large)} is ${shown(a.whole, a.large)} and ${shown(a.partLarge, a.large)}.` },
      { text: `${shown(a.whole, a.large)} = ☐${NB}${a.small}`, value: Number(BigInt(a.whole) * factor) }, { text: `${shown(a.partLarge, a.large)} = ☐${NB}${a.small}`, value: Number(a.part) }, answer];
  }
  if (sum.form === 'split') return [{ text: `${shown(sum.value, a.large)} is ${shown(a.whole, a.large)} and ${shown(a.partLarge, a.large)}.` }, answer];
  return [{ text: `The whole ${UNITS[a.large].many} stay, and ${shown(a.part, a.small)} = ☐${NB}${a.large}`, value: a.partLarge }, answer];
}
// why whole units first cannot work it: the amount, as the question shows it, is less than 1 of the larger unit
function splitStops(sum) {
  if (sum?.op === 'mtotal') return totalSplitStops(sum);
  if (hectares(sum)) return splitStops(asConvert(sum));
  if (sum?.op !== 'mconv') return null;
  const a = amountsOf(sum);
  return a.whole === '0' ? `${shown(sum.value, sum.from)} is less than ${shown('1', a.large)}` : null;
}

// ---- adding lengths in different units (mtotal): every part changed to the unit asked, then added ----

// the parts not in the unit asked, in the question's order
const toChange = (sum) => sum.parts.filter((p) => p.unit !== sum.to);
// a part as an amount of the unit asked, as text ("5 mm" in centimetres '0.5')
const inUnit = (p, to) => fromBase(inBase(p.value, p.unit), to);
// the total in thousandths of the kind's smallest unit, every part exactly, never a float sum; and in the unit asked as
// text, null where it would need a fourth place (the generator refuses that sum)
export const totalBase = (sum) => sum.parts.reduce((t, p) => t + inBase(p.value, p.unit), 0n);
export const totalValue = (sum) => fromBase(totalBase(sum), sum.to);
// whether the unit asked is the smallest of the parts', so the answer is a whole number of it
export const totalWhole = (sum) => sum.parts.every((p) => UNITS[p.unit].base >= UNITS[sum.to].base);
// the question as shown, "5 mm + 20 cm + 1.2 m = ☐ cm"
export const totalAsk = (sum) => `${sum.parts.map((p) => shown(p.value, p.unit)).join(' + ')} = ☐${NB}${sum.to}`;
// the answer step, the question's parts in its order, each in the unit asked, the unit once, after the box, as a
// perimeter's: "So 0.5 + 20 + 120 = ☐ cm" (the lead's ruling, step 4.3: with a unit on every part, "So 40 mm + 2000 mm
// + 400 mm = ☐ mm", a worked card shrinks it under 16 px); amounts the numbers in the unit asked, as text
const totalAnswer = (sum, amounts) => ({ text: so(null, `${amounts.join(' + ')} = ☐${NB}${sum.to}`), value: boxed(totalValue(sum), totalWhole(sum)), answer: true });
// a number as an amount shows it, grouped as amountText groups it, with no unit
const bare = (text, unit) => shown(text, unit).slice(0, -(unit.length + 1));

// Move the digits, on a total: each part not in the unit asked changed in its own step, in the question's order, "1 cm
// is 10 mm: every digit 1 place to the right. 5 mm = ☐ cm", its picture the chart of the part that moves, as a
// conversion's (chartOf: none where a digit of it is the answer's number or its text would be too small), then every
// part added in the unit asked
function totalPlaceSteps(sum) {
  const steps = toChange(sum).map((p) => {
    const pair = pairOf({ from: p.unit, to: sum.to }), into = UNITS[sum.to].base > UNITS[p.unit].base ? 'larger' : 'smaller';
    return { text: `${isFactor(pair)}: every digit ${moves(pair, into)}. ${shown(p.value, p.unit)} = ☐${NB}${sum.to}`, value: boxed(inUnit(p, sum.to), into === 'smaller'),
      ...chartOf(p.value, inUnit(p, sum.to), totalValue(sum)) };
  });
  return [...steps, totalAnswer(sum, sum.parts.map((p) => bare(inUnit(p, sum.to), sum.to)))];
}

// Whole units first, on a total with one part to change: that part split into whole units of the larger of its two
// units and the part left, each in the unit asked, "1.2 m is 1 m and 0.2 m: 100 cm and ☐ cm", then the answer step with
// that part written as its two pieces, "So 20 + 100 + 20 = ☐ cm"
function totalSplitSteps(sum) {
  const [p] = toChange(sum), { small, large } = pairOf({ from: p.unit, to: sum.to }), one = UNITS[large].base * 1000n;
  const base = inBase(p.value, p.unit), whole = (base / one) * one, part = base - whole;
  const [wholeTo, partTo] = [fromBase(whole, sum.to), fromBase(part, sum.to)];
  const step = { text: `${shown(p.value, p.unit)} is ${shown(fromBase(whole, p.unit), p.unit)} and ${shown(fromBase(part, p.unit), p.unit)}: ${shown(wholeTo, sum.to)} and ☐${NB}${sum.to}`,
    value: boxed(partTo, sum.to === small) };
  return [step, totalAnswer(sum, sum.parts.flatMap((q) => (q === p ? [bare(wholeTo, sum.to), bare(partTo, sum.to)] : [bare(inUnit(q, sum.to), sum.to)])))];
}
// why whole units first cannot work a total, true of the question as shown: two parts need changing, or its one part is
// less than 1 of the larger of its unit and the unit asked ("5 mm is less than 1 cm"). M1's "5 mm and 1.2 m both need
// changing" names the parts, but with two of two places ("0.75 m", said "0 point 7 5 metres") the line is 26 or 27 words
// as said, past R11's 25, so one wording for every such total names no amount (step 4.3, the lead's ruling, R12)
function totalSplitStops(sum) {
  const change = toChange(sum);
  if (change.length > 1) return 'two parts need changing';
  const [p] = change, { large } = pairOf({ from: p.unit, to: sum.to });
  return inBase(p.value, p.unit) < UNITS[large].base * 1000n ? `${shown(p.value, p.unit)} is less than ${shown('1', large)}` : null;
}

// ---- hectares (marea, the hectare key): square metres and hectares changed as a length's units are; a field's area
// found first, in square metres, then changed ----

// a hectare sum, and the change of units it is: a field's its area in square metres to hectares
const hectares = (sum) => sum?.op === 'marea' && sum.key === 'hectare';
export const asConvert = (sum) => ({ op: 'mconv', ...(sum.form === 'field' ? { form: 'to-larger', value: String(sum.sides.l * sum.sides.w) } : { form: sum.form, value: sum.value }), from: sum.from, to: sum.to });
// a field's area step, "250 × 100 = ☐ m²", the unit only after the box; and its answer step in the question's order,
// "So its area is ☐ ha"
const fieldArea = (sum) => ({ text: `${sum.sides.l} × ${sum.sides.w} = ☐${NB}m²`, value: sum.sides.l * sum.sides.w });
const fieldAnswer = (sum) => ({ text: so(null, `its area is ☐${NB}ha`), value: convertValue(asConvert(sum)), answer: true });
// a field by moving the digits or by whole units first: its area, then the change of its area's steps, then the answer
const fieldPlaceSteps = (sum) => [fieldArea(sum), ...placeSteps(asConvert(sum)).slice(0, -1), fieldAnswer(sum)];
const fieldSplitSteps = (sum) => [fieldArea(sum), ...splitSteps(asConvert(sum)).slice(0, -1), fieldAnswer(sum)];

const unitsOfPair = (sum) => {
  if (hectares(sum)) return unitsOfPair(asConvert(sum));
  if (sum.op === 'mtotal') return [...new Set([...sum.parts.map((p) => p.unit), sum.to])].sort((a, b) => (UNITS[a].base < UNITS[b].base ? -1 : 1)).map((u) => UNITS[u].one);
  const { small, large } = pairOf(sum);
  return [UNITS[small].one, UNITS[large].one];
};

const changes = (sum) => sum?.op === 'mconv' || sum?.op === 'mtotal' || hectares(sum);
// A hectare under 1 ha has no chart, its words the same: whole units first is refused there, and on its refused card
// (the refusal, the chart, the step that moves the digits, the answer step and the pad) the chart's top is 858 px from
// the pad's bottom in WebKit at 390 × 844, so no scroll keeps the chart whole while she types; it went 14 px off the
// top. Fact 9's own branch (step 4.4's code review finding 1, the lead's ruling, pt80)
const unchartedIf = (sum, steps) => (hectares(sum) && splitStops(sum) ? steps.map(({ picture, ...st }) => st) : steps);

const unitPlace = {
  op: 'mconv', title: 'Move the digits',
  fits: changes,
  steps: (sum) => keptOf(sum.op === 'mtotal' ? totalPlaceSteps(sum) : sum.form === 'field' ? fieldPlaceSteps(sum) : unchartedIf(sum, placeSteps(sum))),
  picture: () => null,
  hint: () => 'How many of the smaller unit make one of the bigger unit? Which way do the digits move?',
  words: (sum) => ['measure', ...unitsOfPair(sum)],
};

const unitSplit = {
  op: 'mconv', title: 'Whole units first', refusedAs: 'Whole units first',
  fits: (sum) => changes(sum) && !splitStops(sum),
  stops: splitStops,
  steps: (sum) => keptOf(sum.op === 'mtotal' ? totalSplitSteps(sum) : sum.form === 'field' ? fieldSplitSteps(sum) : splitSteps(sum)),
  picture: () => null,
  hint: () => 'How many whole units are there? What is left over?',
  words: (sum) => ['measure', ...unitsOfPair(sum)],
};

// ---- perimeter (mper): every side added, or the equal sides together ----

const SHAPE_NAMES = { rect: 'rectangle', square: 'square', rhombus: 'rhombus', tri: 'triangle', lshape: 'L-shape' };
// what the perimeter is of: the place a large rectangle is, "the playground", else the shape, "the rectangle"
export const shapeName = (sum) => sum.name ?? `the ${SHAPE_NAMES[sum.kind]}`;
// a triangle's sides, shortest first; how many lengths it has (1 equilateral, 2 isosceles, 3 scalene); and an isosceles
// triangle's equal side and its base, the odd one
const triSides = ({ a, b, c }) => [a, b, c].sort((x, y) => x - y);
export const triLengths = (sides) => new Set(triSides(sides)).size;
const isoOf = (sides) => {
  const [x, y, z] = triSides(sides);
  return x === y ? { equal: x, base: z } : { equal: y, base: x };
};
// the perimeter, a whole number of the unit: an L-shape's is its outer rectangle's, the short sides across adding to its
// width and those up to its height (S3 GM A l.126)
export function perimeterValue({ kind, sides: s }) {
  if (kind === 'rect') return 2 * (s.l + s.w);
  if (kind === 'square' || kind === 'rhombus') return 4 * s.s;
  if (kind === 'lshape') return 2 * (s.W + s.H);
  return s.a + s.b + s.c;
}
// the answer step in the question's order, "So the perimeter of the rectangle is 6 + 4 + 6 + 4 = ☐ cm", after a way's
// own words ("Each twice: so …")
const perAnswer = (sum, lead, claim) => ({ text: so(lead, `the perimeter of ${shapeName(sum)} is ${claim} = ☐${NB}${sum.unit}`), value: perimeterValue(sum), answer: true });

// Add every side: every side written, the unmarked ones too, then added
function addSteps(sum) {
  const s = sum.sides, at = (n) => shown(String(n), sum.unit), add = (ns) => perAnswer(sum, null, ns.join(' + '));
  if (sum.kind === 'rect') return [{ text: `The sides are ${at(s.l)}, ${at(s.w)}, ${at(s.l)} and ${at(s.w)}.` }, add([s.l, s.w, s.l, s.w])];
  if (sum.kind === 'square') return [{ text: `All 4 sides are ${at(s.s)}.` }, add([s.s, s.s, s.s, s.s])];
  if (sum.kind === 'rhombus') return [{ text: `A rhombus has 4 equal sides, each ${at(s.s)}.` }, add([s.s, s.s, s.s, s.s])];
  if (sum.kind === 'lshape') return [{ text: `The two short sides across add to ${at(s.W)}, and the two short sides up add to ${at(s.H)}.` }, add([s.W, s.W, s.H, s.H])];
  const sides = triSides(s);
  if (triLengths(s) === 1) return [{ text: `All 3 sides are ${at(sides[0])}.` }, add(sides)];
  if (triLengths(s) === 2) {
    const { equal, base } = isoOf(s);
    return [{ text: `Two sides are ${at(equal)}, and the base is ${at(base)}.` }, add([equal, equal, base])];
  }
  return [{ text: `The sides are ${at(sides[0])}, ${at(sides[1])} and ${at(sides[2])}.` }, add(sides)];
}

// Equal sides together: the equal sides counted once and multiplied, 2 × (length + width), 4 × a side, 3 × a side; an
// isosceles triangle's two equal sides, then its base
function pairSteps(sum) {
  const s = sum.sides, box = `☐${NB}${sum.unit}`;
  if (sum.kind === 'rect' || sum.kind === 'lshape') {
    const [x, y] = sum.kind === 'rect' ? [s.l, s.w] : [s.W, s.H];
    return [{ text: `${sum.kind === 'rect' ? 'Length and width' : 'Across and up'} once: ${x} + ${y} = ${box}`, value: x + y }, perAnswer(sum, 'Each twice', `2 × ${x + y}`)];
  }
  if (sum.kind === 'square' || sum.kind === 'rhombus') return [perAnswer(sum, '4 equal sides', `4 × ${s.s}`)];
  if (triLengths(s) === 1) return [perAnswer(sum, '3 equal sides', `3 × ${s.a}`)];
  const { equal, base } = isoOf(s);
  return [{ text: `The two equal sides: 2 × ${equal} = ${box}`, value: 2 * equal }, perAnswer(sum, 'And the base', `${2 * equal} + ${base}`)];
}
// why equal sides together cannot work it, true of the shape as shown: a scalene triangle
const pairStops = (sum) => (sum?.op === 'mper' && sum.kind === 'tri' && triLengths(sum.sides) === 3 ? 'no two sides of this triangle are the same length' : null);

const perWords = (sum) => ['perimeter', 'length', 'width', UNITS[sum.unit].one];

const perAdd = {
  op: 'mper', title: 'Add every side',
  fits: (sum) => sum?.op === 'mper',
  steps: (sum) => keptOf(addSteps(sum)),
  picture: () => null,
  hint: () => 'Did you go all the way round? How long is each side?',
  words: perWords,
};

const perPairs = {
  op: 'mper', title: 'Equal sides together', refusedAs: 'Equal sides',
  fits: (sum) => sum?.op === 'mper' && !pairStops(sum),
  stops: pairStops,
  steps: (sum) => keptOf(pairSteps(sum)),
  picture: () => null,
  hint: () => 'Which sides are the same length? How many of each are there?',
  words: perWords,
};

// ---- areas of rectangles (marea, the rectangle and missing keys): rows of squares, or NESA's words ----

// where a rectangle's unit squares are drawn square, one unit on each axis (engine/render/svg.js shape: both sides at
// most 12, the longer at most 3 times the shorter); the generator's edge squares (engine/items/measurement.js) too
export const squaresFit = ({ l, w }) => Math.max(l, w) <= 12 && Math.max(l, w) <= 3 * Math.min(l, w);
// the answer: a rectangle's area, a whole number of unit², or a missing side's length; a hectare's as text
export function areaValue(sum) {
  if (hectares(sum)) return convertValue(asConvert(sum));
  return sum.key === 'missing' ? sum.sides[sum.unknown] : sum.sides.l * sum.sides.w;
}
// the answer step in the question's order: "So the area of the rectangle is 4 × 6 = ☐ cm²", or of the place it is told
// with; a missing side's "So it is 24 ÷ 6 = ☐ cm wide"
const areaAnswer = (sum, claim) => ({ text: so(null, `the area of ${shapeName(sum)} is ${claim} = ☐${NB}${sum.unit}²`), value: areaValue(sum), answer: true });
const givenOf = (sum) => (sum.unknown === 'w' ? sum.sides.l : sum.sides.w);
const sideWord = (sum) => (sum.unknown === 'w' ? 'wide' : 'long');
const sideAnswer = (sum) => ({ text: so(null, `it is ${sum.sides.l * sum.sides.w} ÷ ${givenOf(sum)} = ☐${NB}${sum.unit} ${sideWord(sum)}`), value: areaValue(sum), answer: true });
// a missing side's question's area, as written
const inAll = (sum) => `${sum.sides.l * sum.sides.w}`;

// Rows of squares: how many squares fit in one row, how many rows, multiplied, the rows first as M2 writes it ("4 × 6",
// 4 rows of 6); its first step's picture the rectangle with its first row filled, where its squares are drawn
// square, marked working. Backwards for a missing side: the length given, each row's squares and every square, so the
// rows are the area ÷ the length; the width given, its rows and every square, so each row is the area ÷ the width (the
// plan words only the length given)
function rowSteps(sum) {
  const { l, w } = sum.sides;
  if (sum.key === 'missing') {
    const first = sum.unknown === 'w' ? `Each row has ${l} squares, and there are ${inAll(sum)} squares in all.` : `There are ${w} rows, and there are ${inAll(sum)} squares in all.`;
    return [{ text: first }, sideAnswer(sum)];
  }
  const picture = squaresFit(sum.sides) ? { picture: { type: 'shape', kind: 'rect', unit: sum.unit, sides: sum.sides, labels: 'area', edge: true, rows: 1, working: true } } : {};
  return [{ text: `One row has ${l} squares, and there are ${w} rows.`, ...picture }, areaAnswer(sum, `${w} × ${l}`)];
}
// Length × width: NESA's words, then the length times the width; backwards, the side given times the side missing is the
// area, the area kept on the line of the word before it, as it ends its sentence (the looker's finding 11, step 4.2)
function wordSteps(sum) {
  if (sum.key === 'missing') {
    const times = sum.unknown === 'w' ? `${sum.sides.l} × the width` : `the length × ${sum.sides.w}`;
    return [{ text: `Area = length × width, so ${times} is${NB}${inAll(sum)}.` }, sideAnswer(sum)];
  }
  return [{ text: 'Area of rectangle = number of units of length × number of units of width.' }, areaAnswer(sum, `${sum.sides.l} × ${sum.sides.w}`)];
}

const rectangles = (sum) => sum?.op === 'marea' && sum.kind === 'rect';
const areaWords = (sum) => ['area', 'length', 'width', UNITS[`${sum.unit}²`].one];

const areaRows = {
  op: 'marea', title: 'Rows of squares',
  fits: rectangles,
  steps: (sum) => keptOf(rowSteps(sum)),
  picture: () => null,
  hint: () => 'How many squares fit in one row? How many rows are there?',
  words: areaWords,
};

const areaLength = {
  op: 'marea', title: 'Length × width',
  fits: rectangles,
  steps: (sum) => keptOf(wordSteps(sum)),
  picture: () => null,
  hint: () => 'Which two lengths do you multiply?',
  words: areaWords,
};

export const MEASURE_WAYS = { 'scale-space': scaleSpace, 'scale-small': scaleSmall, 'unit-place': unitPlace, 'unit-split': unitSplit, 'per-add': perAdd, 'per-pairs': perPairs,
  'area-rows': areaRows, 'area-words': areaLength };
