// Measurement (stage 6 strand 4, plans/2026-10-25-stage-6-plan.md "Strand 4: measurement"): the generator of the
// measurement skills, today meas-length's reading a scale (read), changing units (convert), perimeters (perimeter) and
// adding lengths in different units (total), and meas-area's areas of rectangles (rectangle), a missing side (missing)
// and hectares (hectare), each a list of keys, its classes in classesOf and its question in problem. Every amount is decimal text with at most 3 places, worked in BigInt
// thousandths of its kind's smallest unit (engine/units.js), never a float; the ways that work them are in
// engine/measure-ways.js.
//
// meas-length, MA3-GM-02, "selects and uses the appropriate unit and device to measure lengths and distances including
// perimeters" (Outcomes, saved copy 2026-10-10-1116-article-k-10-mathematics-k-10-syllabus-2022-outcomes.md l.276). Its
// read key: "Select and use an appropriate scaled instrument to measure lengths and distances", "A tape measure, ruler or
// trundle wheel." (Stage 2 Geometric measure B, saved copy 2026-10-28-2213-article-k-10-mathematics-k-10-syllabus-2022-
// fa620a8f93.md l.67-69), "Identify that there are 10 millimetres in one centimetre" and "Such as 53 mm or 6 cm 2 mm."
// (Stage 2 Geometric measure A, saved copy …fae78c0853.md l.61, l.67), "Use a variety of measuring devices to measure
// lengths and distances in different contexts" (Stage 3 Geometric measure A, saved copy …fa35c41b81.md l.59). Its convert
// key: "Measure 100 metres and recognise that 10 times 100 metres is one kilometre, ie 1000 metres = 1 kilometre" (S3 GM A
// l.47), "Record distances using the abbreviation for kilometres (km)", "Such as 1 km 200 m." (l.55-57), "a space should
// be left between the number and the abbreviated unit" (l.150); "Recognise the equivalence of whole-number and decimal
// representations of measurements of length", "Such as 165 cm is the same as 1.65 m." (Stage 3 Geometric measure B,
// saved copy …fae314fde1.md l.39-41), "Such as 13.5 cm is 13 centimetres and 5 millimetres" (l.43-45), "Such as 2.7 km."
// (l.47-49), "Use decimal place value system to convert between metres and kilometres", "Such as 2600 m is 2.6 km because
// there are 1000 m in one kilometre." (l.53-55), "More metres than kilometres will be needed to measure the same
// distance" (l.61-63), its teaching advice's place value (l.142-148); "Convert between metres and centimetres, and
// between centimetres and millimetres" and "Such as 1.25 m." (S2 GM B l.81-85). Its perimeter key: "Use efficient
// strategies to calculate the perimeter of a large rectangular area in metres", "A playground, netball courts.",
// "Calculate perimeters of common two-dimensional shapes, including squares, rectangles and triangles", "To calculate the
// perimeter of a rhombus, only one side length is required." (S3 GM A l.63-71), and its hexagon with 5 right angles,
// "The unmarked horizontal lines must add to 5 cm with the unmarked vertical lines adding to 4 cm." (l.122-126). Its
// total key: "Solve a variety of problems involving length and perimeter, including problems involving different units
// of length", "Find the total length of 3 items measuring 5 mm, 20 cm and 1.2 m." (S3 GM B l.71-73). The pages read live
// 28 October 2026 and saved 28 October 2026. NSW Mathematics K–10 Syllabus (2022), 16 June 2026 amendments, checked 28
// October 2026 (perimeter and total, 29 October 2026).
//
// meas-area, MA3-2DS-02, "selects and uses the appropriate unit to calculate areas, including areas of squares,
// rectangles and triangles" (Outcomes l.288). Its rectangle key: "Calculate areas of rectangles in square centimetres
// (cm²), square metres (m²) and square kilometres (km²)", "Record, using words, the method for finding the area of any
// rectangle", "Area of rectangle = number of units of length × number of units of width." (Stage 3 Two-dimensional
// spatial structure A, saved copy …fad7c142c4.md l.71-75), its teaching advice's rows of squares and its 6 cm by 4 cm
// rectangle with a row and a column of 1 cm squares along its edges (l.98-100), its grid "behind" the rectangle (l.104)
// and "students in Stage 3 should use words" (l.110); "Create the array structure of area using squares (1 cm × 1 cm) in rows and columns" (Stage 2 Two-dimensional
// spatial structure A, saved copy …fae82874e2.md l.95). Its missing key: "Establish the relationship between the lengths,
// widths and areas of rectangles", "Find the dimensions of different rectangles with an area of 24 cm²." (S3 2DS A
// l.69, l.77-79). Its hectare key: "Equate one hectare to the area of a square with side lengths of 100 m, ie 10 000
// square metres = 1 hectare (ha)", "Record areas using square kilometres and hectares" (l.61-63); "m2 is read as 'square
// metre(s)'" (l.132-134). The pages read live 28 October 2026 and saved 28 October 2026; NSW Mathematics K–10 Syllabus
// (2022), 16 June 2026 amendments, checked 28 October 2026 (the areas, 29 October 2026).
//
// Chosen for this game, not a syllabus requirement: a ruler or tape measure read from a picture in place of a real device;
// the things measured (OBJECTS, no person or animal); the split and join forms with one box ("2.6 km = 2 km ☐ m"); a
// perimeter's sizes, an L-shape's missing corner half its width and height as NESA's own L-shape (engine/render/svg.js
// EXAMPLES), and total's amounts (plan M1, "Sizes"); an area's sizes, its places (a netball court, a farm, a field), a
// missing side's question and the hectare amounts (plan M2, "Sizes");
// "2.60" taken for 2.6 (engine/check.js); the release 5 gate (engine/skills.js). Every problem is drawn from a list made
// once of every one the plan allows (plan, "Rules every measurement generator keeps"): the key first, each as often as the
// others; then its class by its weight; then a problem, each in its class as often as the others, and with opts.also
// only one both ways fit, whose boxed values differ by each. A problem is left out where the answer's number is in the text before the answer step, by any
// way of its group: a pencil 0.5 cm long on a ruler of halves ("each space is ☐ cm", 0.5), "0.3 cm = ☐ mm" (the chart's
// 3), "0.001 km = ☐ m" ("1 km is 1000 m").

import { METHODS, wayFor, wayFits } from '../methods.js';
import { BY_ID } from '../skills.js';
import { drawSum } from './fractions.js';
import { thousandths, normalise } from '../check.js';
import { decimalText } from './decimals.js';
import { UNITS, amountText, unitWords, inBase, fromBase } from '../units.js';
import { SMALLER, scaleOf, readValue, convertValue, convertAsk, pairOf, totalBase, totalValue, totalWhole, totalAsk, perimeterValue, shapeName, triLengths, squaresFit, areaValue,
  asConvert } from '../measure-ways.js';

// the kinds of problem (plans M1 and M2, "Keys and asks"), and those of the easy level ("Sizes"), which the worked
// examples come from; total, missing and hectare are the usual level's only
export const KEYS = { 'meas-length': ['read', 'convert', 'perimeter', 'total'], 'meas-area': ['rectangle', 'missing', 'hectare'] };
export const EASY = { 'meas-length': ['read', 'convert', 'perimeter'], 'meas-area': ['rectangle'] };

// The things measured (plan, "Rules every measurement generator keeps"), chosen for this game: on a ruler or a tape
// measure, and the places a large rectangle in metres is (S3 GM A l.65, "A playground, netball courts."), never a person
// or an animal, no digits (every number in a question is one the problem draws). The sum keeps the name, "the pencil",
// which its steps say.
export const OBJECTS = {
  ruler: [{ id: 'pencil', the: 'the pencil', a: 'a pencil' }, { id: 'crayon', the: 'the crayon', a: 'a crayon' }, { id: 'key', the: 'the key', a: 'a key' },
    { id: 'leaf', the: 'the leaf', a: 'a leaf' }, { id: 'feather', the: 'the feather', a: 'a feather' }, { id: 'shell', the: 'the shell', a: 'a shell' },
    { id: 'eraser', the: 'the eraser', a: 'an eraser' }, { id: 'ribbon', the: 'the ribbon', a: 'a ribbon' }],
  tape: [{ id: 'rope', the: 'the rope', a: 'a rope' }, { id: 'plank', the: 'the plank', a: 'a plank' }, { id: 'mat', the: 'the mat', a: 'a mat' },
    { id: 'bench', the: 'the bench', a: 'a bench' }, { id: 'hose', the: 'the hose', a: 'a hose' }, { id: 'curtain', the: 'the curtain', a: 'a curtain' }],
  place: [{ id: 'playground', the: 'the playground', a: 'a playground' }, { id: 'netball-court', the: 'the netball court', a: 'a netball court' },
    { id: 'vegetable-garden', the: 'the vegetable garden', a: 'a vegetable garden' }, { id: 'backyard', the: 'the backyard', a: 'a backyard' }],
  // a rectangle in square kilometres (plan M2, "A farm is a rectangle 6 km long and 4 km wide."), and the fields an area
  // in hectares is (S3 2DS A l.61-63)
  farm: [{ id: 'farm', the: 'the farm', a: 'a farm' }],
  field: [{ id: 'field', the: 'the field', a: 'a field' }, { id: 'farm-paddock', the: 'the farm paddock', a: 'a farm paddock' }, { id: 'park', the: 'the park', a: 'a park' }],
};
// the things a sum is told with: a reading's by its device, a large rectangle's in metres its places, a rectangle's area
// in square kilometres the farm, a field's area in hectares its fields; none for the rest
function thingsOf(sum) {
  if (sum.op === 'mread') return OBJECTS[sum.device];
  if (sum.op === 'mper') return sum.unit === 'm' ? OBJECTS.place : null;
  if (sum.op !== 'marea') return null;
  if (sum.form === 'field') return OBJECTS.field;
  return sum.key === 'rectangle' ? { m: OBJECTS.place, km: OBJECTS.farm }[sum.unit] ?? null : null;
}
// the place a sum is told with, by its name ("the netball court")
const placeOf = (sum) => Object.values(OBJECTS).flat().find((c) => c.the === sum.name);

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const NB = ' ';
const cap = (t) => t[0].toUpperCase() + t.slice(1);

// ---- read (plan M1, "Sizes"): a ruler in centimetres or a tape measure in metres, half each; parts 2 on 7 marks, 4 on
// 4 marks or 5 on 3 marks, so a scale across has 10 or 12 small spaces; the first mark 0 to 20 (cm) or 0 to 10 (m) ----

const DEVICES = { ruler: { unit: 'cm', firstMost: 20 }, tape: { unit: 'm', firstMost: 10 } };
// parts 2 one reading in 10 at the usual level, 4 and 5 the rest, so one space past the mark before is about 36% of the
// readings (plan, "What strands 1 to 3 taught": at most 40%)
const PARTS = { 2: { marks: 7, weight: 2 }, 4: { marks: 4, weight: 9 }, 5: { marks: 3, weight: 9 } };
// half from the first mark, which is 0; half from a labelled mark past 0, the first mark past 0 or a later one with the
// first mark 0, a quarter each
const STARTS = { zero: 2, first: 1, later: 1 };
// whether one small space is a whole number of the smaller unit: a ruler's halves and fifths (5 and 2 mm), not its
// quarters (2.5 mm); every space of a tape (50, 25, 20 cm)
const wholeSpace = (device, parts) => (UNITS[DEVICES[device].unit].base * 1000n / UNITS[SMALLER[DEVICES[device].unit]].base) % (BigInt(parts) * 1000n) === 0n;

// every reading of one class: its scales (the first mark f), where it starts (s spaces) and ends (e spaces, d past the
// labelled mark before)
function readings(device, parts, start, past, ask) {
  const { unit, firstMost } = DEVICES[device], n = PARTS[parts].marks;
  const firsts = start === 'first' ? range(1, firstMost) : [0];
  const out = [];
  for (const f of firsts) {
    const marks = range(f, f + n - 1).map(String);
    const froms = start === 'later' ? range(1, n - 2) : [0];
    for (const j of froms) {
      for (const before of range(j, n - 2)) out.push({ op: 'mread', key: 'read', device, unit, marks, parts, start: j * parts, end: before * parts + past, ask });
    }
  }
  return out;
}
// read's classes: by device, parts, where it starts, how many spaces past the mark before it ends (each its parts allows
// as often as the others) and the unit of the box, the smaller one half the problems that allow it (from 0, one space
// a whole number of it); easy, from 0 on a ruler or a tape, parts 2 or 5, the box in the device's unit
function readClasses(easy) {
  const out = [];
  for (const device of Object.keys(DEVICES)) {
    const { unit } = DEVICES[device];
    for (const parts of easy ? [2, 5] : [2, 4, 5]) {
      for (const start of easy ? ['zero'] : Object.keys(STARTS)) {
        for (const past of range(1, parts - 1)) {
          const boxes = !easy && start === 'zero' && wholeSpace(device, parts) ? [unit, SMALLER[unit]] : [unit];
          for (const ask of boxes) {
            const weight = (easy ? 1 : PARTS[parts].weight * STARTS[start]) / (parts - 1) / boxes.length;
            out.push({ name: `${device} in ${parts}, from ${start === 'zero' ? '0' : `a ${start} mark`}, ${past} past, in ${ask}`, weight, sums: readings(device, parts, start, past, ask),
              group: `${device} ${parts} ${start}` });
          }
        }
      }
    }
  }
  return out;
}

// ---- convert (plan M1, "Sizes"): millimetres and centimetres, centimetres and metres, or metres and kilometres, a third
// each; the amount N in the smaller unit a whole number and never a multiple of the pair's factor, so the larger unit
// always has a decimal part; to-larger and to-smaller N from 1, split and join N past the factor, so the whole part is
// at least 1; the four forms a quarter each ----

const PAIRS = [{ small: 'mm', large: 'cm', most: 999 }, { small: 'cm', large: 'm', most: 9999 }, { small: 'm', large: 'km', most: 99999 }];
// Fact 10 (plan "What the pages and code cannot settle"): the voice tools list every problem by every way
// (tools/voice-lines.mjs every), and over all of them (about 10^5 a form) voice-lines took 95 s against 9 s before, past 3
// times, so each class keeps at most CAP starting amounts, taken evenly through its own so every size of number stays
// (step 4.2, test first), and always NESA's own: "53 mm or 6 cm 2 mm" (Stage 2 Geometric measure A, saved copy
// …fae78c0853.md l.67), "1.25 m" (Stage 2 Geometric measure B, saved copy …fa620a8f93.md l.85), "1 km 200 m" (S3 GM A
// l.57), "165 cm is the same as 1.65 m", "13.5 cm", "2.7 km", "2600 m is 2.6 km" (S3 GM B l.41, l.45, l.49, l.55), each as N
// in the smaller unit
const CAP = 150;
const NESA = { mm: [53, 62, 135], cm: [125, 165], m: [1200, 2600, 2700] };
const evenly = (list, k) => (list.length <= k ? list : Array.from({ length: k }, (_, i) => list[Math.floor((i * list.length) / k)]));
const FORMS = ['to-larger', 'to-smaller', 'split', 'join'];
// the decimal places of N in the larger unit, and whether its decimal part has an empty place inside it ("2.08",
// "1.005", "0.065")
function placesOf(n, factor) {
  let places = String(factor).length - 1, rest = n % factor;
  while (rest % 10 === 0) { rest /= 10; places -= 1; }
  const part = String(n % factor).padStart(String(factor).length - 1, '0').slice(0, places);
  return { places, empty: part.slice(0, -1).includes('0') };
}
// a convert sum from N: the amount in the unit it is given in
function convertSum(form, { small, large }, n) {
  const larger = fromBase(BigInt(n) * UNITS[small].base * 1000n, large);
  if (form === 'to-larger' || form === 'join') return { op: 'mconv', key: 'convert', form, value: String(n), from: small, to: large };
  return { op: 'mconv', key: 'convert', form, value: larger, from: large, to: small };
}
// convert's classes: each form and pair as often as the others; for metres and kilometres a third each with 1, 2 and 3
// decimal places, for centimetres and metres half each with 1 and 2; where a place can be empty, about 2 in 3 with one
// (so about 1 in 4 of the key, plan M1); easy, centimetres and metres or metres and kilometres, to-larger and to-smaller,
// one decimal place, N at most 9999
function convertClasses(easy) {
  const out = [];
  for (const form of easy ? FORMS.slice(0, 2) : FORMS) {
    for (const pair of easy ? PAIRS.slice(1) : PAIRS) {
      const factor = Number(UNITS[pair.large].base / UNITS[pair.small].base), most = easy ? Math.min(pair.most, 9999) : pair.most;
      const lo = form === 'split' || form === 'join' ? factor + 1 : 1;
      const by = new Map();
      for (let n = lo; n <= most; n++) {
        if (n % factor === 0) continue;
        const { places, empty } = placesOf(n, factor);
        if (easy && places !== 1) continue;
        const at = `${places}${empty ? ' empty' : ''}`;
        if (!by.has(at)) by.set(at, []);
        by.get(at).push(n);
      }
      for (const [at, ns] of by) {
        const nesa = ns.filter((n) => NESA[pair.small].includes(n));
        by.set(at, [...evenly(ns.filter((n) => !nesa.includes(n)), CAP - nesa.length), ...nesa].sort((x, y) => x - y).map((n) => convertSum(form, pair, n)));
      }
      const placesSeen = new Set([...by.keys()].map((k) => k[0]));
      for (const [at, sums] of by) {
        const both = by.has(`${at[0]} empty`) && by.has(at[0]);
        const weight = 1 / placesSeen.size * (both ? (at.includes('empty') ? 2 / 3 : 1 / 3) : 1);
        out.push({ name: `${form} ${pair.small} and ${pair.large}, ${at[0]} place${at[0] === '1' ? '' : 's'}${at.includes('empty') ? ', an empty place' : ''}`, weight, sums });
      }
    }
  }
  return out;
}

// ---- perimeter (plan M1, "Sizes"): sides whole numbers, in centimetres 2 to 20, a large rectangle in metres 10 to 120;
// a rectangle a third of the problems (half of those in metres, told with a place), a square, a triangle, a rhombus
// and the L-shape a sixth each; a rectangle never a square, its length the longer side; a triangle by the triangle rule,
// its sides shortest first, scalene, isosceles and equilateral a third each; the L-shape 4 to 20 wide and 3 to 20 high,
// its missing corner half of each (rounded down), as NESA's own L-shape, 6 by 4 with a corner of 3 by 2 (chosen for this
// game: its corner is no number of the question). A rectangle in metres never has its sides 1 m apart: drawn to scale on
// her screen it looks a square with two different labels (step 4.3's code review, finding 1). Easy: rectangles and
// squares in centimetres, sides 2 to 10, the rectangles twice as often as the squares, as at the usual level ----

const perimeterOf = (kind, sides, unit = 'cm') => ({ op: 'mper', key: 'perimeter', kind, sides, unit });
const rectangles = (lengths, unit) => lengths.flatMap((w) => lengths.filter((l) => l > w).map((l) => perimeterOf('rect', { l, w }, unit)));
function perimeterClasses(easy) {
  const cm = range(2, easy ? 10 : 20), squares = cm.map((s) => perimeterOf('square', { s }));
  if (easy) return [{ name: 'rectangle in cm', weight: 2, sums: rectangles(cm, 'cm') }, { name: 'square', weight: 1, sums: squares }];
  const triangles = cm.flatMap((a) => cm.flatMap((b) => cm.filter((c) => a <= b && b <= c && c < a + b).map((c) => perimeterOf('tri', { a, b, c }))));
  const lshapes = range(4, 20).flatMap((W) => range(3, 20).map((H) => perimeterOf('lshape', { W, H, cw: Math.floor(W / 2), ch: Math.floor(H / 2) })));
  return [{ name: 'rectangle in cm', weight: 1 / 6, sums: rectangles(cm, 'cm') }, { name: 'rectangle in m', weight: 1 / 6, sums: rectangles(range(10, 120), 'm').filter(({ sides }) => sides.l - sides.w > 1) },
    { name: 'square', weight: 1 / 6, sums: squares }, { name: 'rhombus', weight: 1 / 6, sums: cm.map((s) => perimeterOf('rhombus', { s })) },
    ...[['scalene', 3], ['isosceles', 2], ['equilateral', 1]].map(([name, n]) => ({ name: `${name} triangle`, weight: 1 / 18, sums: triangles.filter((t) => triLengths(t.sides) === n) })),
    { name: 'L-shape', weight: 1 / 6, sums: lshapes }];
}

// ---- total (plan M1, "Sizes"): one finite table, the only list problemsOf, the exhaustive checks and the voice tools
// read. Its classes, each (the unit asked; the other parts' units), every part in mm, cm and m or in m and km, one part
// always in the unit asked and at most 2 to change: 2 parts a weight of 1/16 each, 3 parts 1/10 each, so half each ----

const TOTAL_CLASSES = [['mm', ['cm']], ['cm', ['mm']], ['cm', ['m']], ['m', ['cm']], ['mm', ['m']], ['m', ['mm']], ['m', ['km']], ['km', ['m']],
  ['cm', ['mm', 'm']], ['mm', ['cm', 'm']], ['m', ['mm', 'cm']], ['m', ['km', 'km']], ['km', ['m', 'm']]];
// each part's amounts as written, by its unit and the unit asked: in the unit asked, whole, and its halves only where
// the unit asked is not the sum's smallest (so a part already in the smallest unit is always whole); in a smaller unit,
// whole and never a multiple of the factor; in a larger, never whole and with no more places than the factor has zeros
// (so an answer in the smallest unit is always whole)
const IN_ASKED = { mm: ['5', '8', '12', '15', '25', '35', '40', '60', '75', '90'], cm: ['2', '5', '12', '20', '25', '30', '45', '60', '75', '85'],
  m: ['2', '5', '12', '20', '35', '40', '60', '75', '150', '250'], km: ['2', '3', '4', '5', '6', '7', '8', '10', '12', '15'] };
const IN_ASKED_HALVES = { mm: [], cm: ['2.5', '4.5', '12.5', '20.5'], m: ['1.5', '2.5', '4.5', '12.5'], km: ['0.5', '1.5', '2.5', '3.5'] };
const IN_LARGER = ['0.6', '0.75', '1.08', '1.2', '1.25', '1.5', '2.4', '2.5', '3.05', '4.2'];
const IN_OTHER = { 'mm cm': ['2', '3', '4', '5', '6', '7', '8', '9', '15', '25'], 'mm m': ['2', '5', '8', '15', '25', '40', '75', '90', '1250', '1500'],
  'cm m': ['5', '15', '20', '25', '45', '50', '75', '80', '120', '135'], 'm km': ['50', '120', '250', '300', '450', '600', '750', '800', '900', '1200'],
  'cm mm': ['0.5', '1.5', '2.5', '3.5', '4.5', '6.5', '7.5', '10.5', '12.5', '20.5'], 'm cm': IN_LARGER, 'm mm': IN_LARGER, 'km m': IN_LARGER };
const amountsIn = (unit, to, smallest) => (unit === to ? [...IN_ASKED[to], ...(smallest ? [] : IN_ASKED_HALVES[to])] : IN_OTHER[`${unit} ${to}`]);
// a part's place in an order: by its unit, then by its amount
const byUnit = (sign) => (p, q) => sign * Number(UNITS[p.unit].base - UNITS[q.unit].base) || Number(thousandths(p.value) - thousandths(q.value));
// every combination of a class's lists (two parts in one unit two different amounts), each written two ways, half
// each: the smallest unit first (NESA's own order) or the largest first, within one unit the smaller amount first
function totalClasses() {
  return TOTAL_CLASSES.map(([to, others]) => {
    const units = [to, ...others], smallest = units.every((u) => UNITS[u].base >= UNITS[to].base);
    let combos = [[]];
    units.forEach((unit, i) => {
      const list = amountsIn(unit, to, smallest), same = units.indexOf(unit) < i;
      combos = combos.flatMap((c) => list.filter((v) => !same || thousandths(v) > thousandths(c[units.indexOf(unit)].value)).map((value) => [...c, { value, unit }]));
    });
    const sums = combos.flatMap((parts) => [1, -1].map((sign) => ({ op: 'mtotal', key: 'total', parts: [...parts].sort(byUnit(sign)), to })));
    return { name: `${units.length} parts, in ${to}; ${others.join(', ')}`, weight: others.length === 1 ? 1 / 16 : 1 / 10, sums };
  });
}

// ---- rectangle (plan M2, "Sizes"): in cm², sides 2 to 12; in m², 10 to 60, told with its place; in km², 2 to 15, told
// with the farm; a third each; never a square, its length the longer side, so the area is never a side. A rectangle in
// m² never has its sides 1 m apart, as a perimeter's in metres (step 4.3's code review, finding 1): drawn about 3 px a
// metre (60 by 59 m), it would look a square with two different labels; in cm² and km² 1 apart is drawn 14 px or more
// apart. Easy: in cm², sides 2 to 10, the longer at most 3 times the shorter, so its edge squares are drawn square ----

const areaOf = (key, unit, more = {}) => (sides) => ({ op: 'marea', key, kind: 'rect', sides, unit, ...more });
// every rectangle with sides lo to hi, its length the longer
const sidesIn = (lo, hi) => range(lo, hi).flatMap((w) => range(lo, hi).filter((l) => l > w).map((l) => ({ l, w })));
function rectangleClasses(easy) {
  if (easy) return [{ name: 'rectangle in cm², edge squares', weight: 1, sums: sidesIn(2, 10).filter(squaresFit).map(areaOf('rectangle', 'cm')) }];
  return [{ name: 'rectangle in cm²', weight: 1 / 3, sums: sidesIn(2, 12).map(areaOf('rectangle', 'cm')) },
    { name: 'rectangle in m²', weight: 1 / 3, sums: sidesIn(10, 60).filter(({ l, w }) => l - w > 1).map(areaOf('rectangle', 'm')) },
    { name: 'rectangle in km²', weight: 1 / 3, sums: sidesIn(2, 15).map(areaOf('rectangle', 'km')) }];
}
// ---- missing (plan M2, "Sizes"): sides 2 to 12, in cm² or m², the length or the width given, a quarter each; never a
// square, so the answer is never the side given ----
const missingClasses = () => ['cm', 'm'].flatMap((unit) => ['w', 'l'].map((unknown) => ({ name: `missing ${unknown === 'w' ? 'width' : 'length'}, in ${unit}²`, weight: 1 / 4,
  sums: sidesIn(2, 12).map(areaOf('missing', unit, { unknown })) })));
// ---- hectare (plan M2, "Sizes"): to-larger, to-smaller and a field, a third each. to-larger amounts a multiple of 100
// from 1100 to 989 900 m², never of 10 000, under 10 000 m² (where whole units first stops) 1 in 6, and with 1 or 2
// places in hectares half each; to-smaller 1.1 to 99.9 ha with 1 place or 1.01 to 99.99 with 2, half each, never whole;
// a field's sides multiples of 10 from 100 to 500 m, its length the longer, its area a multiple of 1000 m² and never of
// 10 000, so the answer has one place. Fact 10: with every amount (19,592 changes of units) tools/piece-lines.mjs --json
// took 123.8 s, past its 120 s (105.2 s before step 4.4), so each to-larger and to-smaller class keeps at most CAP
// starting amounts, taken evenly through its own as convert's are, and always M2's own 25 000 m², 3.5 ha and 5000 m²
// (step 4.4, test first); the field whole ----
const M2_OWN = ['25000', '3.5', '5000'];
function capped(sums) {
  const own = sums.filter((s) => M2_OWN.includes(s.value));
  return [...evenly(sums.filter((s) => !own.includes(s)), CAP - own.length), ...own].sort((x, y) => (thousandths(x.value) < thousandths(y.value) ? -1 : 1));
}
const hectareOf = (form, value) => (form === 'to-larger' ? { op: 'marea', key: 'hectare', form, value, from: 'm²', to: 'ha' } : { op: 'marea', key: 'hectare', form, value, from: 'ha', to: 'm²' });
function hectareClasses() {
  // to-larger in hundreds of square metres, 11 to 9899, never a multiple of 100 (10 000 m²)
  const hundreds = range(11, 9899).filter((k) => k % 100);
  const larger = (under, places) => hundreds.filter((k) => (k < 100) === under && (k % 10 === 0) === (places === 1)).map((k) => hectareOf('to-larger', String(k * 100)));
  const toLarger = [true, false].flatMap((under) => [1, 2].map((places) => ({ name: `to-larger, ${under ? 'under' : 'at least'} 1 ha, ${places} place${places === 1 ? '' : 's'}`,
    weight: (under ? 1 / 6 : 5 / 6) / 2 / 3, sums: capped(larger(under, places)) })));
  const ones = range(1, 99), tenths = range(1, 9);
  const toSmaller = [{ name: 'to-smaller, 1 place', weight: 1 / 6, sums: capped(ones.flatMap((n) => tenths.map((d) => hectareOf('to-smaller', `${n}.${d}`)))) },
    { name: 'to-smaller, 2 places', weight: 1 / 6, sums: capped(ones.flatMap((n) => range(1, 99).filter((d) => d % 10).map((d) => hectareOf('to-smaller', `${n}.${String(d).padStart(2, '0')}`)))) }];
  const fields = sidesIn(10, 50).map(({ l, w }) => ({ l: 10 * l, w: 10 * w })).filter(({ l, w }) => (l * w) % 1000 === 0 && (l * w) % 10000)
    .map((sides) => ({ op: 'marea', key: 'hectare', form: 'field', sides, unit: 'm', from: 'm²', to: 'ha' }));
  return [...toLarger, ...toSmaller, { name: 'field', weight: 1 / 3, sums: fields }];
}

// the question, its words, its answer and its picture, from the sum alone, so the same sum makes the same problem
// whichever way works it: read "The pencil is ☐ cm long.", said "How long is the pencil, in centimetres?", the ruler its
// picture; convert the number sentence, said in words, "2600 metres = what kilometres?", with no picture. An answer in
// the larger unit is a decimal, its point key showing even when whole; in the smaller unit a whole number (plan, "Settled
// for the whole strand")
const UNIT_SAID = new RegExp(`(\\d+(?:${NB}\\d{3})*(?:\\.\\d+)?|☐)${NB}(${Object.keys(UNITS).sort((a, b) => b.length - a.length).join('|')})`, 'g');
const inWords = (text) => text.replace(UNIT_SAID, (_, n, u) => (n === '☐' ? `what ${unitWords(u, '2')}` : `${n} ${unitWords(u, n)}`));
const answerOf = (value, unit, larger) => (larger ? { kind: 'decimal', value } : { kind: 'number', value: Number(value) });
// a perimeter's ask, "The perimeter of the rectangle is ☐ cm.", or a large rectangle's told with its place, "A playground
// is a rectangle 40 m long and 25 m wide. Its perimeter is ☐ m." (plan M1, "Keys and asks"); its picture the shape, its
// equal sides marked wherever fewer sides are labelled than it has
const SIDE_MARKS = { square: true, rhombus: true };
function perimeterAsk(sum) {
  if (!sum.name) return `The perimeter of ${shapeName(sum)} is ☐${NB}${sum.unit}.`;
  const place = OBJECTS.place.find((c) => c.the === sum.name);
  return `${cap(place.a)} is a rectangle ${amountText(String(sum.sides.l), sum.unit)} long and ${amountText(String(sum.sides.w), sum.unit)} wide. Its perimeter is ☐${NB}${sum.unit}.`;
}
// an ask of more than one sentence said as a question, "… It is what centimetres wide?"
const saidAsk = (ask) => `${inWords(ask.replace(/\.$/, ''))}?`;
// An area's question (plan M2, "Keys and asks"): a rectangle's "The area of the rectangle is ☐ cm².", or a large one's
// told with its place, "A netball court is a rectangle 30 m long and 15 m wide. Its area is ☐ m².", said "What is the
// area of the rectangle, in square centimetres?", the shape its picture, with a row and a column of unit squares along
// its edges where they are drawn square (NESA's picture, S3 2DS A l.100); a missing side's "The rectangle's area is
// 24 cm². It is 6 cm long. It is ☐ cm wide.", its picture's missing side a box and no squares, which would count it out
// for her; a hectare's number sentence, or a field's "A field is a rectangle 250 m long and 100 m wide. Its area is ☐
// ha.", with no picture; each but a rectangle's said as it is asked
function areaProblem(sum) {
  const answer = (larger) => ({ kind: larger ? 'decimal' : 'number', value: larger ? areaValue(sum) : Number(areaValue(sum)) });
  const at = (n, unit) => amountText(String(n), unit), { l, w } = sum.sides ?? {};
  if (sum.key === 'hectare') {
    const ask = sum.form === 'field' ? `${cap(placeOf(sum).a)} is a rectangle ${at(l, 'm')} long and ${at(w, 'm')} wide. Its area is ☐${NB}ha.` : convertAsk(sum);
    return { ask, say: saidAsk(ask), answer: answer(sum.to === 'ha') };
  }
  const square = `${sum.unit}²`, picture = { type: 'shape', kind: 'rect', unit: sum.unit, sides: sum.sides, labels: 'area' };
  if (sum.key === 'missing') {
    const [given, has, wants] = sum.unknown === 'w' ? [l, 'long', 'wide'] : [w, 'wide', 'long'];
    const ask = `The rectangle's area is ${at(l * w, square)}. It is ${at(given, sum.unit)} ${has}. It is ☐${NB}${sum.unit} ${wants}.`;
    return { ask, say: saidAsk(ask), answer: answer(false), picture: { ...picture, unknown: sum.unknown } };
  }
  if (sum.key !== 'rectangle') throw new Error(`no measurement problem of kind ${sum.key}`);
  const ask = sum.name ? `${cap(placeOf(sum).a)} is a rectangle ${at(l, sum.unit)} long and ${at(w, sum.unit)} wide. Its area is ☐${NB}${square}.` : `The area of the rectangle is ☐${NB}${square}.`;
  return { ask, say: `What is the area of ${shapeName(sum)}, in ${UNITS[square].many}?`, answer: answer(false), picture: { ...picture, ...(squaresFit(sum.sides) ? { edge: true } : {}) } };
}
// skillId names the skill in what a total refuses: a total asked in its smallest unit is worked exactly in base
// thousandths first and made only where it is a whole number of that unit, and one asked in a larger unit only where it
// needs at most 3 places of it
function problem(skillId, sum) {
  if (sum.op === 'marea') return areaProblem(sum);
  if (sum.op === 'mper') {
    const ticks = SIDE_MARKS[sum.kind] || (sum.kind === 'tri' && triLengths(sum.sides) < 3);
    const picture = { type: 'shape', kind: sum.kind, unit: sum.unit, sides: sum.sides, labels: 'perimeter', ...(ticks ? { ticks: true } : {}) };
    return { ask: perimeterAsk(sum), say: `What is the perimeter of ${shapeName(sum)}, in ${UNITS[sum.unit].many}?`, answer: { kind: 'number', value: perimeterValue(sum) }, picture };
  }
  if (sum.op === 'mtotal') {
    const whole = totalWhole(sum);
    if (whole && totalBase(sum) % (UNITS[sum.to].base * 1000n) !== 0n) throw new Error(`${skillId} total is not a whole number of ${sum.to}`);
    if (!whole && totalValue(sum) === null) throw new Error(`${skillId} total needs a fourth place in ${sum.to}`);
    const ask = totalAsk(sum);
    return { ask, say: `${inWords(ask)}?`, answer: answerOf(totalValue(sum), sum.to, !whole) };
  }
  if (sum.op === 'mread') {
    if (!sum.name) throw new Error('a reading is told with what it measures');
    const picture = { type: 'scale', device: sum.device, unit: sum.unit, marks: sum.marks, parts: sum.parts, start: sum.start, end: sum.end, name: sum.name };
    return { ask: `${cap(sum.name)} is ☐${NB}${sum.ask} long.`, say: `How long is ${sum.name}, in ${UNITS[sum.ask].many}?`, answer: answerOf(readValue(sum), sum.ask, sum.ask === sum.unit), picture };
  }
  if (sum.op !== 'mconv') throw new Error(`no measurement problem of kind ${sum.key}`);
  const ask = convertAsk(sum), { large } = pairOf(sum);
  return { ask, say: `${inWords(ask)}?`, answer: answerOf(convertValue(sum), sum.to, sum.to === large) };
}

// Every number she sees or hears before the answer step, whichever way of its group she is asked by, as whole
// thousandths, so "2.60" and "2.6" are one number and "2.6" and "2600" two (plan, "Rules every measurement generator
// keeps"): the question's (shown and said) and its picture's, each step before the last, its words, its value and its
// picture's, a way that cannot work it saying so first, and the number word of why it cannot ("two parts need changing"
// says 2: step 4.3's code review, finding 3) and of each way's hint, shown under the question while her box is open
// ("Which two lengths do you multiply?" says 2, so no missing side is 2: step 4.4). A scale's numbers are its labels,
// its parts and where the object starts (its words, "along it from 3"); a chart's the number in it and each of its
// digits; a shape's its sides
const groupOf = (skillId, sum) => (BY_ID[skillId].groups ?? [BY_ID[skillId].methods]).findIndex((ws) => wayFits(ws[0], sum));
const numbersIn = (t) => [...String(t).replace(/(\d)[  ](?=\d{3}(?!\d))/g, '$1').matchAll(/\d+(?:\.\d+)?/g)].map((m) => thousandths(m[0])).filter((n) => n !== null);
// a refusal's number words, as numbers (whole thousandths): one to ten
const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const wordsIn = (t) => [...String(t ?? '').matchAll(new RegExp(`\\b(${NUMBER_WORDS.join('|')})\\b`, 'gi'))].map((m) => BigInt(NUMBER_WORDS.indexOf(m[1].toLowerCase()) + 1) * 1000n);
function pictureNumbers(p) {
  if (p.type === 'scale') {
    const first = thousandths(p.marks[0]);
    return [...p.marks.map(thousandths), BigInt(p.parts) * 1000n, first + 1000n * BigInt((p.start ?? 0) / p.parts)];
  }
  if (p.type === 'placevalue') return [thousandths(p.value), ...p.value.replace('.', '').split('').map((c) => BigInt(c) * 1000n)];
  // a shape's sides, but the one its box stands for; and where unit squares are drawn, their words' 1 ("1 cm squares")
  if (p.type === 'shape') return [...Object.entries(p.sides).filter(([k]) => k !== p.unknown).map(([, n]) => BigInt(n) * 1000n), ...(p.edge || p.rows ? [1000n] : [])];
  return [];
}
function earlierNumbers(skillId, sum) {
  const { ask, say, picture } = problem(skillId, sum);
  const texts = [ask, say], pictures = [picture], words = [];
  for (const w of BY_ID[skillId].groups[groupOf(skillId, sum)]) {
    words.push(...wordsIn(METHODS[w].stops?.(sum)), ...wordsIn(METHODS[w].hint(sum)));
    for (const st of wayFor(skillId, sum, w).steps.slice(0, -1)) {
      texts.push(st.text, 'value' in st ? String(st.value) : '');
      pictures.push(st.picture);
    }
  }
  return new Set([...texts.flatMap(numbersIn), ...words, ...pictures.filter(Boolean).flatMap(pictureNumbers)]);
}
// a problem the plan allows: its answer at most 8 characters as typed, and in no earlier text, nor in any hint it can give
// for a mistake, which shows under the question while her box is open (step 4.2's code review, finding 1: "24.01 m = 24 m
// ☐ cm", 1, and "How many centimetres are in 1 metre?")
function allowed(skillId, sum) {
  const told = toldOf(sum, null);
  const { answer } = problem(skillId, told);
  const value = String(answer.value), th = thousandths(value);
  return value.length <= 8 && !earlierNumbers(skillId, told).has(th) && !hintLines({ sum: told, answer }).flatMap(numbersIn).includes(th);
}

// every problem of a skill's key at a level, in its classes: [{ name, weight, sums }]; a class the rules leave empty is
// not one (on a scale of 3 marks, read from its middle mark 1 space past it, the one reading is one space long, the
// working value; drawSum leaves an empty class out too), its weight shared by the others of its group (a reading's
// device, parts and start), so each device, parts and start is drawn as often as before
const CLASSES = { read: readClasses, convert: convertClasses, perimeter: perimeterClasses, total: totalClasses, rectangle: rectangleClasses, missing: missingClasses,
  hectare: hectareClasses };
function classesOf(skillId, key, easy) {
  if (!KEYS[skillId]) throw new Error(`${skillId} has no measurement problems`);
  const classes = CLASSES[key]?.(easy) ?? null;
  if (!classes) throw new Error(`no measurement problem of kind ${key}`);
  const all = classes.map((c) => ({ ...c, sums: c.sums.filter((s) => allowed(skillId, s)) }));
  const weightOf = (list, group) => list.filter((c) => c.group === group).reduce((x, c) => x + c.weight, 0);
  const kept = all.filter((c) => c.sums.length);
  return kept.map(({ group, ...c }) => ({ ...c, weight: group ? (c.weight * weightOf(all, group)) / weightOf(kept, group) : c.weight }));
}
const MEMO = new Map(), KEPT = new Map();
export function problemsOf(skillId, key, easy) {
  if (!KEYS[skillId]?.includes(key)) throw new Error(`${skillId} has no kind of problem ${key}`);
  const at = `${skillId}:${key}:${Boolean(easy)}`;
  if (!MEMO.has(at)) MEMO.set(at, classesOf(skillId, key, Boolean(easy)));
  return MEMO.get(at);
}

// every way a problem can be told, for the voice tools (tools/voice-lines.mjs every): a reading with each thing its
// device measures, a large rectangle in metres with each place
export function tellings(sum) {
  const things = sum.name ? null : thingsOf(sum);
  return things ? things.map((c) => ({ ...sum, name: c.the })) : [sum];
}
// a reading's thing or a large rectangle's place, drawn after its numbers (with no rng, the first, for judging its
// numbers: no thing or place has one); a name given is kept
function toldOf(sum, rng) {
  const things = sum.name ? null : thingsOf(sum);
  return things ? { ...sum, name: (rng ? rng.pick(things) : things[0]).the } : sum;
}

// Two ways of one group side by side (opts.also another way of opts.method's group: "Another way", js/runner.js compare)
// only on a problem whose boxed values differ, so split and join, where moving the digits and whole units first box the
// same values (split only the answer; join "600 m = ☐ km", then the answer), the same steps in substance, are left out
// there and still drawn for her one way (the looker's finding 7, step 4.2, the lead's ruling; strand 3's KEPT_APART,
// engine/items/percentages.js); its own memo of what both ways fit, since its lists are not problemsOf's; each problem
// judged as first told
const KEPT_APART = new Map();
const boxedOf = (w, sum) => JSON.stringify(METHODS[w].steps(sum).filter((st) => 'value' in st).map((st) => String(thousandths(String(st.value)))));
const sameBoxes = (a, b, sum) => wayFits(a, sum) && wayFits(b, sum) && boxedOf(a, sum) === boxedOf(b, sum);
const apartOf = (a, b) => (skillId, key, easy) => problemsOf(skillId, key, easy).map((c) => ({ ...c, sums: c.sums.filter((sum) => !sameBoxes(a, b, toldOf(sum, null))) }));
// but rows of squares and length × width, which both box only the area, each its own way to it (the rows counted and
// multiplied, rows first, "4 × 6"; NESA's words, "6 × 4"), the plan's second way for every rectangle and missing side
// (M2, "Ways"): kept apart they could never be set side by side, and "Another way" would find no problem both fit
const NEVER_APART = ['area-rows', 'area-words'];

// a problem: drawn as the fractions' and percentages' are (engine/items/fractions.js drawSum: the key, its class by
// weight, a problem the ways fit), then its thing
function sumFor(skillId, rng, easy, opts) {
  if (opts.sum) return toldOf(opts.sum, rng);
  const group = BY_ID[skillId].groups.find((ws) => ws.includes(opts.method));
  const apart = opts.also && opts.also !== opts.method && group?.includes(opts.also) && !NEVER_APART.includes(opts.method);
  const listed = apart ? { problemsOf: apartOf(opts.method, opts.also), kept: KEPT_APART } : { problemsOf, kept: KEPT };
  return toldOf(drawSum(skillId, rng, easy, opts, { levelKeys: (easy ? EASY : KEYS)[skillId], ...listed }).sum, rng);
}

// The way a problem is worked (plan "The ways", "Groups"): opts.method where it is in the problem's group (the set of
// ways whose first fits it), else her way for that group (opts.ways, keyed by the group's place in the skill's groups:
// engine/methods.js groupWays, js/runner.js make), else the group's first; wayFor refusing where that way stops
function wayAsked(skillId, sum, opts) {
  const g = groupOf(skillId, sum), group = BY_ID[skillId].groups[g];
  if (group.includes(opts.method)) return opts.method;
  return group.includes(opts.ways?.[g]) ? opts.ways[g] : group[0];
}

// A hint for her actual mistake (plan M1, "Misconceptions"), each a question about the step or the question's own
// numbers, never about her answer, which the screen has taken away (js/runner.js), else none (the way's): the fixed ones,
// HINTS (hints, tools/voice-lines.mjs), and the rest built from the problem's numbers, each listed for its problem by
// hintLines(item). A slip whose value is the right answer is no slip there
export const HINTS = {
  // a space taken as one unit, or as a tenth of it, when it is not
  SPACE: 'How much is each small space worth? Count the spaces between two numbers.',
  // the reading given in the other unit of the pair
  UNIT: 'Which unit is written after the box? Count in the box\'s unit.',
  // a perimeter part of the way round: a rectangle's length + width; a square's, rhombus' or equilateral triangle's one
  // labelled side, or two
  ROUND: 'Did you go all the way round? How many sides are there?',
  // the area for the perimeter (the plan's "Perimeter is the distance around the edge." put after its question, so the
  // hint opens with a question, step 4.2's rule)
  AREA: 'Did you add the sides, or multiply? Perimeter is the distance around the edge.',
  // meas-area (plan M2, "Misconceptions"): the perimeter for the area (the plan's "Area is the squares inside." put after
  // its question, so the hint opens with a question, as AREA above); the sides added; a missing side answered with the
  // area × the side given; 1000 or 100 square metres taken for a hectare
  ROUND_AREA: 'Did you count the squares, or go round the edge? Area is the squares inside.',
  ADDED: 'Did you add the sides, or multiply them?',
  TIMES: 'Did you multiply, or find how many rows?',
  HECTARE: 'How many square metres make 1 hectare?',
};
// a number in thousandths as she would type it ('4.5', '45'); null where it is not above 0, or past 8 characters
const typed = (th) => {
  if (th === null || th <= 0n) return null;
  const t = decimalText(Number(th));
  return t.length <= 8 ? t : null;
};
// a hectare's change to square metres with the digits moved the wrong way, its point moved left, as text ("3.5 ha"
// 0.00035), where thousandths cannot read it and the pad's 8 characters take it, else null (the code review's finding 2,
// step 4.4, the lead's ruling); and a number's digits without the point and the zeros at either end
function backOf(sum) {
  if (sum.op !== 'marea' || sum.form !== 'to-smaller') return null;
  const { places } = pairOf(sum), [w, f = ''] = sum.value.split('.'), d = w.padStart(places + 1, '0');
  const t = `${d.slice(0, -places)}.${d.slice(-places)}${f}`;
  return thousandths(t) === null && t.length <= 8 ? t : null;
}
const digitsOf = (t) => t.replace('.', '').replace(/^0+|0+$/g, '');
// each slip she could make on a problem, its value as typed and its kind, the more particular first: [[value, kind]]
function slipsOf(item) {
  const { sum } = item, out = [];
  const add = (th, hint) => { const v = typed(th); if (v !== null) out.push([v, hint]); };
  const units = (n) => BigInt(n) * 1000n;
  if (sum.op === 'mper') {
    const s = sum.sides;
    // a rectangle's length + width; a square's, rhombus' or equilateral triangle's one side, or two; a rectangle's or
    // square's area
    if (sum.kind === 'rect') add(units(s.l + s.w), 'round');
    const one = sum.kind === 'square' || sum.kind === 'rhombus' ? s.s : sum.kind === 'tri' && triLengths(s) === 1 ? s.a : null;
    if (one !== null) for (const n of [one, 2 * one]) add(units(n), 'round');
    if (sum.kind === 'rect' || sum.kind === 'square') add(units(sum.kind === 'rect' ? s.l * s.w : s.s * s.s), 'area');
    return out;
  }
  if (sum.op === 'marea' && sum.key !== 'hectare') {
    const { l, w } = sum.sides;
    // a rectangle's perimeter, or its sides added; a missing side's area × the side given
    if (sum.key === 'rectangle') {
      add(units(2 * (l + w)), 'round-area');
      add(units(l + w), 'added');
    } else add(units(l * w * (sum.unknown === 'w' ? l : w)), 'times');
    return out;
  }
  if (sum.op === 'mtotal') {
    // a part not changed: each set of the parts to change left as they are written, the rest in the unit asked
    const change = sum.parts.filter((p) => p.unit !== sum.to);
    for (let mask = 1; mask < 1 << change.length; mask++) {
      add(sum.parts.reduce((t, p) => {
        const k = change.indexOf(p);
        return t + (k >= 0 && mask & (1 << k) ? thousandths(p.value) : inBase(p.value, p.unit) / UNITS[sum.to].base);
      }, 0n), 'change');
    }
    return out;
  }
  if (sum.op === 'mread') {
    // an amount in thousandths of the device's unit, in thousandths of the box's unit; null where she could not type it
    const u = sum.unit, inAsk = (th) => {
      const t = th > 0n ? fromBase(th * UNITS[u].base, sum.ask) : null;
      return t === null ? null : thousandths(t);
    };
    const { space, start, end, mark, past } = scaleOf(sum);
    // a length past 0 given where it ends
    if (start > 0n) add(inAsk(end), 'start');
    // a space taken as one unit or a tenth of it
    for (const wrong of [1000n, 100n]) if (wrong !== space) add(inAsk(mark + wrong * BigInt(past) - start), 'space');
    // the reading in the other unit of the pair
    const other = sum.ask === u ? SMALLER[u] : u, length = (end - start) * UNITS[u].base;
    add(fromBase(length, other) === null ? null : thousandths(fromBase(length, other)), 'unit');
    return out;
  }
  if (sum.op !== 'mconv' && sum.op !== 'marea') return out;
  // a hectare's change of units as a length's: a field's its area in square metres to hectares
  const conv = sum.op === 'marea' ? asConvert(sum) : sum;
  const { factor: F } = pairOf(conv);
  const v = thousandths(conv.value), whole = (v / 1000n) * 1000n;
  // the number moved by a factor, into the larger unit (÷) or the smaller (×), exactly, else null
  const by = (th, f, into) => (into === 'larger' ? (th % f === 0n ? th / f : null) : th * f);
  const moved = (f, into) => {
    if (conv.form === 'to-larger' || conv.form === 'to-smaller') return by(v, f, into);
    if (sum.form === 'split') return by(v - whole, f, into);
    const n = BigInt(sum.value) * 1000n, w = n / (F * 1000n) * 1000n, part = n - w * F, m = by(part, f, into);
    return m === null ? null : w + m;
  };
  const right = conv.form === 'to-larger' || conv.form === 'join' ? 'larger' : 'smaller', wrongWay = right === 'larger' ? 'smaller' : 'larger';
  // split with the digit in the wrong place: the decimal part's digits as written, "2.08 km = 2 km ☐ m" answered 8
  if (sum.form === 'split') add(BigInt(sum.value.split('.')[1]) * 1000n, 'digit');
  // the digits moved the wrong way
  add(moved(F, wrongWay), 'way');
  if (backOf(sum) !== null) out.push([backOf(sum), 'way']);
  // the wrong number of places: another pair's factor; for a hectare 1000 or 100 square metres taken for one (plan M2)
  for (const f of sum.op === 'marea' ? [1000n, 100n] : [10n, 100n, 1000n]) if (f !== F) add(moved(f, right), sum.op === 'marea' ? 'hectare' : 'places');
  return out;
}
// a split's digit in the wrong place: the first digit of its decimal part that is not 0, named so she finds it in one
// place of the question as she sees it ("10.1 km = 10 km ☐ m" writes 1 three times; the looker's finding 2, step 4.2, the
// lead's ruling): "the 8" where it is written once in the question, "the 1 after the point" where it is written more
// than once but once after the point, "the first 1 after the point" where it is written more than once after it; and the
// second question, how many of the smaller unit that place is worth, or where that worth is the answer itself ("2.1 km =
// 2 km ☐ m"), how many make 1 of the larger
function digitOf(item) {
  const { small, large } = pairOf(item.sum), digits = item.sum.value.split('.')[1], k = digits.search(/[1-9]/), worth = `0.${'0'.repeat(k)}1`;
  const d = digits[k], times = (t) => [...t].filter((c) => c === d).length;
  const digit = times(convertAsk(item.sum)) === 1 ? d : times(digits) === 1 ? `${d} after the point` : `first ${d} after the point`;
  const worthSmall = fromBase(inBase(worth, large), small);
  const second = thousandths(worthSmall) === thousandths(String(item.answer.value)) ? `How many ${UNITS[small].many} make ${amountText('1', large)}?`
    : `How many ${UNITS[small].many} is ${amountText(worth, large)}?`;
  return { digit, second };
}
function hintFor(item, given) {
  const { sum } = item;
  if (!['mread', 'mconv', 'mper', 'mtotal', 'marea'].includes(sum?.op)) return null;
  const g = Array.isArray(given) ? given[0] : given, th = g == null ? null : thousandths(String(g));
  const answer = thousandths(String(item.answer.value));
  // the wrong way past what thousandths reads (backOf): her number under 1, its digits the amount's
  const back = backOf(sum) !== null && /^0*\.\d+$/.test(normalise(g)) && digitsOf(normalise(g)) === digitsOf(sum.value);
  if (!back && (th === null || th === answer)) return null;
  const kind = back ? 'way' : slipsOf(item).find(([v]) => thousandths(v) === th)?.[1];
  const { small, large } = sum.op === 'mconv' ? pairOf(sum) : {};
  if (kind === 'space') return HINTS.SPACE;
  if (kind === 'unit') return HINTS.UNIT;
  if (kind === 'start') return `Where does ${sum.name} start? Did you take the start away?`;
  if (kind === 'way') return `Is a ${UNITS[sum.to].one} bigger or smaller than a ${UNITS[sum.from].one}? Will there be more of them, or fewer?`;
  if (kind === 'places') return `How many ${UNITS[small].many} are in 1 ${UNITS[large].one}?`;
  if (kind === 'digit') return `Which place is the ${digitOf(item).digit} in? ${digitOf(item).second}`;
  if (kind === 'round') return HINTS.ROUND;
  if (kind === 'area') return HINTS.AREA;
  if (kind === 'round-area') return HINTS.ROUND_AREA;
  if (kind === 'added') return HINTS.ADDED;
  if (kind === 'times') return HINTS.TIMES;
  if (kind === 'hectare') return HINTS.HECTARE;
  // the unit after her box, in words ("… to centimetres first?")
  if (kind === 'change') return `Did you change every length to ${unitWords(sum.to, '2')} first?`;
  return null;
}
// every hint text hintFor gives for a problem, each misconception's mistake worked out from the problem, for the tools
// that list the lines to voice
export function hintLines(item) {
  return [...new Set(slipsOf(item).map(([v]) => hintFor(item, v)).filter(Boolean))];
}

export default {
  skills: ['meas-length', 'meas-area'],
  // opts.key makes that kind, opts.sum that very problem, opts.method works it that way where it is in the problem's
  // group (else her way for that group, opts.ways, else the group's first; a way that stops says why first: wayFor),
  // opts.also draws only a problem that way fits too, opts.op only a kind of that sum, opts.easy the easy level
  make(skillId, rng, opts = {}) {
    const sum = sumFor(skillId, rng, Boolean(opts.easy), opts);
    const { picture, ...question } = problem(skillId, sum);
    const { method, steps } = wayFor(skillId, sum, wayAsked(skillId, sum, opts));
    const way = METHODS[method];
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
