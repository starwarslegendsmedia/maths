// The question and its answer boxes. The boxes sit inside the question where the ☐ is, so she answers
// the sentence itself, and a number pad stays on screen (the iPhone keyboard would cover the question).
// The Mac's keyboard works too: digits, Backspace, Enter, and Tab between boxes (and the point, where a box takes one, and
// "/" from a fraction's numerator to its denominator).

import { h } from './ui.js';
import { fmt, thousandths } from '../engine/check.js';
import { FRACTION, FRACTION_NAMES, fractionWords } from '../engine/fractions.js';

function isSentenceAsk(ask) {
  return ask.includes('☐') && !/[a-z]{3,}/i.test(ask.replace(/\br\b/g, ''));
}

// A number sentence too long for the question's size on a phone takes the smaller size (css/app.css .ask.long), so
// "394 ÷ 5 = ☐ r ☐" stays on one line at 390 wide: counted with each box as three characters, as a box with its answer
// typed in is about that wide (measured in WebKit at 390 × 844, 25 October 2026: every remainder question on one line).
function long(ask) {
  return ask.length + 2 * (ask.split('☐').length - 1) > 14;
}

// A question's look: a number sentence large (smaller when long), a question in words in the reading font (css/app.css
// .ask.words), the same on the first screen and in the walk-through after a second miss (js/runner.js worked).
export function askClass(ask) {
  return isSentenceAsk(ask) ? `ask${long(ask) ? ' long' : ''}` : 'ask words';
}

// Every n/d drawn as she writes it on paper, the numerator over a bar over the denominator (stage 6 strand 2,
// plans/2026-10-25-stage-6-plan.md "Showing a fraction"), named for a screen reader as it is said ("3 eighths",
// engine/fractions.js fractionWords), found by engine/fractions.js FRACTION, the pattern speech and the pictures use too.
// The slash stays in the text, hidden (css/app.css .frac), so its words read "3/8" as before. slot: what each ☐ becomes,
// in reading order (a box, or the value worked in for her), a ☐ in a fraction going inside its numerator or
// denominator; with none, a ☐ stays as written. A comma straight after a fraction goes in its denominator, after the
// digits (css/app.css .frac .after), so it sits on that line and not halfway up, where it looks like an apostrophe (a full
// stop stays on the sentence's line: after the denominator it would read as a decimal point, "8."); it goes in the
// fraction's name too, which a screen reader reads in place of what is inside ("1 third,"). A line never breaks inside
// a number sentence with a fraction or a "%" in it ("3/5 = ☐/10", "5/8 + 6/8 = 1 + ☐/8", "100% ÷ 4 = 25%": numbers,
// fractions and boxes joined by = + − × ÷ < >), nor before a closing mark after a fraction ("3/8?"): each is kept in one
// span that does not wrap (css/app.css .nowrap), the mark after it, a comma still in the denominator (stage 6 step 2.3
// review, finding 7); one with a "%" and no fraction only in a step (step), where it fits a phone 320 px wide, never in
// a question, where at 40 px "0.75 = 100%" would not (stage 6 step 3.2, code review 2, finding 1). Text with no fraction
// and no "%" comes back as it was, [text], a whole-number sentence ("5 × 2 = 10") with it, and so does a whole-number or
// decimal sentence beside a fraction (dec-x10's "1/10 of 3.6 = ☐"): the screens of every skill before the fractions draw
// as they did (tests/stage6-fractions-screens.test.js). The one exception, written only by the fraction ways: a count
// sentence with no fraction whose spaces are no-break ones ("6 eighths + 5 eighths = 11 eighths") can run out of a
// phone's step box, so it may break before its "=" and nowhere else (counted).
export function fracNodes(text, slot = null, { step = false } = {}) {
  // a box with a word joined to it by a no-break space ("covers ☐ eighths.", I7) kept on one line with it, which a browser
  // would otherwise break beside the box, the word alone on the next line (stage 6 step 2.4, the replay's shot 112, pt59);
  // and a box with "%" straight after it ("So 100% − 30% = ☐%", stage 6 strand 3, plan "Showing a percentage")
  const plain = (into, t) => {
    if (!slot) return t && into.push(t);
    t.split('☐').forEach((p, i) => {
      const joined = i ? p.match(/^(?:\u00a0\S+|%)/) : null;
      if (joined) into.push(h('span', { class: 'nowrap' }, slot(), joined[0]), p.slice(joined[0].length));
      else { if (i) into.push(slot()); into.push(p); }
    });
  };
  const part = (cls, v, after = null) => h('span', { class: cls }, v === '☐' && slot ? slot() : v,
    after && h('span', { class: 'after' }, after));
  const fracs = [...text.matchAll(FRACTION)];
  // what is kept on one line, as [from, to]: each number sentence with a fraction in it, or in a step a "%" ("100% ÷ 4 =
  // 25%", which broke after its "÷", stage 6 step 3.2's looker, F6), and a fraction outside one with a closing mark after
  // it, each with the mark after it
  const percent = step && text.includes('%');
  const keep = !fracs.length && !percent ? [] : [...text.matchAll(SENTENCE)].map((m) => [m.index, m.index + m[0].length])
    .filter(([from, to]) => fracs.some((f) => f.index >= from && f.index < to) || (percent && text.slice(from, to).includes('%')));
  const kept = fracs.length || keep.length;
  if (!kept && text.includes('\u00a0=')) return counted(text, plain);
  if (!kept && !slot) return [text];
  const out = [];
  if (!kept) return (plain(out, text), out);
  for (const f of fracs) {
    const to = f.index + f[0].length;
    if (/[.?!:;]/.test(text[to] ?? '') && !keep.some(([a, b]) => f.index >= a && f.index < b)) keep.push([f.index, to]);
  }
  keep.sort((a, b) => a[0] - b[0]);
  // a "%" after a sentence's last number or box kept with it too ("3/4 = ☐%", "So 3/4 = 75%.")
  for (const k of keep) if (/[,.?!:;%]/.test(text[k[1]] ?? '')) k[1]++;
  let at = 0;
  // the text from at up to end, into a list
  const upTo = (into, end) => {
    for (const m of fracs) {
      if (m.index < at || m.index >= end) continue;
      const [all, n, d] = m;
      plain(into, text.slice(at, m.index));
      at = m.index + all.length;
      const after = text[at] === ',' ? text[at++] : null;
      const said = /^\d+$/.test(n) && FRACTION_NAMES[d] ? fractionWords(n, d) + (after ?? '') : null;
      into.push(h('span', { class: 'frac', 'aria-label': said },
        part('num', n), h('span', { class: 'slash' }, '/'), part('den', d, after)));
    }
    plain(into, text.slice(at, end));
    at = Math.max(at, end);
  };
  for (const [from, to] of keep) {
    upTo(out, from);
    const together = [];
    upTo(together, to);
    out.push(h('span', { class: 'nowrap' }, together));
  }
  upTo(out, text.length);
  return out;
}

// A count sentence joined by no-break spaces, with no fraction (fracNodes): the no-break space before each "=" an
// ordinary one, so a line may break there and nowhere else (at 320 px wide "7 tenths + 9 tenths = 16 tenths" runs 81 px
// out of a worked example's step box, WebKit, 27 October 2026; the shots of the pt56 replay, point 8); each side kept on
// one line around a box drawn in it, which a browser may otherwise break beside (css/app.css .nowrap).
function counted(text, plain) {
  const out = [];
  text.split(/\u00a0(?==)/).forEach((side, i) => {
    if (i) out.push(' ');
    // the words before the sentence, with their ordinary spaces, as they are; the sentence's own side in one span
    const at = i === 0 ? side.lastIndexOf(' ') + 1 : 0, end = i === 0 ? side.length : (side + ' ').indexOf(' ');
    plain(out, side.slice(0, at));
    const run = [];
    plain(run, side.slice(at, end));
    out.push(...(run.some((x) => typeof x !== 'string') ? [h('span', { class: 'nowrap' }, run)] : run));
    plain(out, side.slice(end));
  });
  // the text between the spans as one string, as fracNodes gives it
  return out.reduce((all, x) => (typeof x === 'string' && typeof all.at(-1) === 'string' ? [...all.slice(0, -1), all.at(-1) + x] : [...all, x]), [])
    .filter((x) => x !== '');
}

// a number sentence (fracNodes): its parts, each a fraction, a whole number grouped as fmt groups it, a decimal or a box
// (☐, or "?" on a question card), joined by its signs; a whole number, a decimal or a box may have "%" straight after it
// ("So 75% = ☐/4", stage 6 step 3.1 review, finding 2; "12.5% = ☐", "0.75 = ?%", step 3.2 code review 2, finding 2)
const SENTENCE_TERM = `(?:${FRACTION.source}|(?<![\\d.\\/])\\d+(?:\\u00a0\\d{3})*(?:\\.\\d+)?%?|☐%?|\\?%?)`;
const SENTENCE = new RegExp(`${SENTENCE_TERM}(?:[ \\u00a0]*[=+−×÷<>][ \\u00a0]*${SENTENCE_TERM})+`, 'g');

// Render text with ☐ turned into boxes, a fraction's two numerator first; returns { el, boxes }.
function withBoxes(text, cls = 'ask') {
  const boxes = [];
  const box = () => {
    const b = h('span', { class: 'box', role: 'textbox', 'aria-label': `answer box ${boxes.length + 1}` }, ' ');
    boxes.push(b);
    return b;
  };
  return { el: h('div', { class: cls }, fracNodes(text, box)), boxes };
}

// A word problem's story with its numbers and doing-words marked (item.marks, engine/items/wordproblems.js; research
// 2.5): numbers in one look, doing-words underlined in another. Anything else: its question as it is. Its fractions
// stacked (fracNodes).
export function marked(item) {
  if (!item.marks?.length) return fracNodes(item.ask);
  const out = [];
  let at = 0;
  for (const m of item.marks) {
    if (m.from > at) out.push(...fracNodes(item.ask.slice(at, m.from)));
    out.push(h('span', { class: `mark ${KIND[m.kind]}` }, fracNodes(item.ask.slice(m.from, m.to))));
    at = m.to;
  }
  if (at < item.ask.length) out.push(...fracNodes(item.ask.slice(at)));
  return out;
}
const KIND = { number: 'num', doing: 'doing' };

// The story with every word a tap, for her to find the marks of the kinds in `find` (the other marks shown): a mark she
// taps is marked and onFind called; any other word does nothing. reveal() marks the ones she has not found as missed.
export function findable(item, find, onFind) {
  const el = h('div', { class: 'ask words find' });
  const keys = [];
  const words = (text) => {
    for (const w of text.split(/(\s+)/)) if (w) el.append(/^\s+$/.test(w) ? w : h('span', { class: 'word' }, w));
  };
  let at = 0;
  for (const m of item.marks) {
    words(item.ask.slice(at, m.from));
    const text = item.ask.slice(m.from, m.to);
    if (find.includes(m.kind)) {
      const span = h('span', { class: 'word' }, text);
      span.addEventListener('click', () => {
        if (span.classList.contains('mark')) return;
        span.classList.add('mark', KIND[m.kind]);
        onFind(m);
      });
      keys.push({ m, span });
      el.append(span);
    } else el.append(h('span', { class: `mark ${KIND[m.kind]}` }, text));
    at = m.to;
  }
  words(item.ask.slice(at));
  return {
    el,
    keys: keys.map((k) => k.m),
    reveal() { for (const { m, span } of keys) if (!span.classList.contains('mark')) span.classList.add('mark', KIND[m.kind], 'missed'); },
  };
}

// mode: 'normal' | 'sprint' | 'placement'. onSubmit(given) gets a string, or an array for several boxes. A word
// problem's story has its numbers and doing-words marked, except in placement and the sprint, which find what she knows.
// below: an element put under the question, above the pad (what she is told about her answer, where she is looking).
// between: an element put between a question in words and its "Answer:" line (the steps "Show me one step" shows, on a
// question with a docked picture, js/runner.js askOnly); a question with its boxes in its own sentence has no such line,
// and leaves it out.
// askIn: an element the question is written into, in place of its own card (a step box, typed into in its step).
// show: a choice ringed for her to tap (the answer she copies after a second miss, js/runner.js copyAnswer); the widget's
// ring(value) rings one once it is drawn (a worked example's own choices, js/runner.js choose).
export function answerWidget(item, { onSubmit, onSkip, mode = 'normal', below = null, between = null, askIn = null, show = null } = {}) {
  const wrap = h('div', { class: 'stack' });
  const kind = item.answer.kind;
  if (window.__preview) window.__item = item; // preview only: lets a test drive the game
  let boxes = [];
  let askEl;
  let boxLine = null; // the line her boxes are on: the sentence with the ☐, or a story's "Answer: ☐"

  if (item.ask.includes('☐')) {
    // boxes sit where the ☐ is, in a number sentence or in words ("In 13 000, the 1 is worth ☐")
    ({ el: askEl, boxes } = withBoxes(item.ask, askIn ? 'in-step' : askClass(item.ask)));
    boxLine = askEl;
  } else {
    askEl = h('div', { class: 'ask words' }, ...(mode === 'normal' ? marked(item) : fracNodes(item.ask)));
    if (kind === 'number' || kind === 'decimal' || kind === 'fraction' || kind === 'remainder') {
      const line = withBoxes(kind === 'remainder' ? 'Answer: ☐ r ☐' : kind === 'fraction' ? 'Answer: ☐/☐' : 'Answer: ☐', 'ask');
      askEl = h('div', {}, askEl, between, line.el);
      boxes = line.boxes;
      boxLine = line.el;
    }
  }
  const values = boxes.map(() => '');
  let at = 0;
  let locked = false;
  // a point key only where a box takes a decimal: a decimal answer, or a step whose value is decimal text
  const point = kind === 'decimal' || (kind === 'number' && typeof item.answer.value === 'string' && thousandths(item.answer.value) !== null);

  const paint = () => boxes.forEach((b, i) => {
    b.textContent = values[i] ? asTyped(values[i]) : ' ';
    b.classList.toggle('on', i === at && !locked);
  });
  boxes.forEach((b, i) => b.addEventListener('click', () => { at = i; paint(); }));

  const submit = (given) => {
    if (locked) return;
    onSubmit?.(given);
  };

  const press = (key) => {
    if (locked || !boxes.length) return;
    if (/^\d$/.test(key)) {
      // at most 8 characters, the point included, and 3 digits after the point
      const v = values[at];
      if (v.length < 8 && !/\.\d{3}$/.test(v)) values[at] += key;
    } else if (key === '.') {
      // one point a box; a point first is "0."
      if (!point || values[at].includes('.') || values[at].length >= 8) return;
      values[at] = values[at] ? `${values[at]}.` : '0.';
    } else if (key === 'back') {
      if (values[at]) values[at] = values[at].slice(0, -1);
      else if (at > 0) at--;
    } else if (key === 'next') {
      at = (at + 1) % boxes.length;
    } else if (key === 'enter') {
      if (!values[at]) return;
      if (at < boxes.length - 1) at++;
      else submit(boxes.length === 1 ? values[0] : values.slice());
    }
    paint();
  };

  let controls;
  let unpick = () => {}; // an order's chips back in their places and its line emptied (clear, and "Start again")
  let ring = () => {}; // a choice ringed for her to tap, and no other (show; none for null)
  if (kind === 'choice') {
    // choices in words longer than a line of a half-width button ("five hundred and twenty million, ...") go one under
    // another at a smaller size (css/app.css .choices.long), so all three fit on a phone; short ones keep two columns. By
    // the length of its text: a fraction's '1/3' is three characters, though drawn stacked (fracNodes)
    const wordy = item.answer.options.some((o) => String(label(o)).length > LONG_CHOICE);
    const buttons = item.answer.options.map((o) =>
      h('button', { onclick: (e) => { if (locked) return; e.currentTarget.classList.add('picked'); submit(o); } }, fracNodes(String(label(o)))));
    ring = (value) => buttons.forEach((b, i) => b.classList.toggle('show', value != null && String(item.answer.options[i]) === String(value)));
    controls = h('div', { class: `choices${wordy ? ' long' : ''}` }, buttons);
  } else if (kind === 'order') {
    const picked = [];
    const shown = h('div', { class: 'ask', style: 'font-size:28px' }, ' ');
    const chips = h('div', { class: 'chips' });
    const shuffled = deal(item.answer.values);
    // each value as its chip shows it: decimal text as written, so "0.50" keeps its zero, and a fraction stacked
    const asShown = new Map(shuffled.map((v) => [String(v), fmt(v)]));
    shuffled.forEach((v) => {
      const b = h('button', { onclick: () => {
        if (locked || b.classList.contains('used')) return;
        b.classList.add('used');
        picked.push(String(v));
        shown.replaceChildren(...fracNodes(picked.map((x) => asShown.get(x)).join(',  ')));
        if (picked.length === shuffled.length) submit(picked.slice());
      } }, fracNodes(fmt(v)));
      chips.append(b);
    });
    unpick = () => {
      picked.length = 0;
      shown.textContent = ' ';
      chips.querySelectorAll('button').forEach((b) => b.classList.remove('used'));
    };
    const undo = h('button', { class: 'btn plain', onclick: () => { if (!locked) unpick(); } }, 'Start again');
    controls = h('div', { class: 'stack' }, h('div', { class: 'muted small center' }, 'Tap them from smallest to largest'), shown, chips, undo);
  } else {
    const key = (label, k, cls) => h('button', { class: cls, 'aria-label': k, onclick: () => press(k) }, label);
    controls = h('div', { class: 'pad' },
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => key(String(n), String(n))),
      boxes.length > 1 ? key('next box', 'next', 'fn') : key('⌫', 'back', 'fn'),
      key('0', '0'),
      key('✓', 'enter', 'go'));
    if (boxes.length > 1) controls.append(key('⌫', 'back', 'fn'));
    // after every key a whole-number pad has, so those stay where they are; a key the size of the digits, its dot drawn
    // large in its middle (css/app.css .pad button.point)
    if (point) controls.append(key('.', '.', 'point'));
  }

  const onKey = (e) => {
    if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey); return; }
    if (/^\d$/.test(e.key) || e.key === '.') press(e.key);
    else if (e.key === 'Backspace') press('back');
    else if (e.key === 'Enter') press('enter');
    else if (e.key === 'Tab') { e.preventDefault(); press('next'); }
    // "/" from the numerator to the denominator, as on paper; the game's alone, as Tab is (Firefox's Quick Find)
    else if (e.key === '/' && kind === 'fraction') { e.preventDefault(); press('next'); }
    else if (kind === 'choice') {
      const i = item.answer.options.findIndex((o) => o[0].toLowerCase() === e.key.toLowerCase() || o === e.key);
      if (i >= 0) submit(item.answer.options[i]);
    }
  };
  document.addEventListener('keydown', onKey);

  if (askIn) askIn.replaceChildren(askEl);
  else wrap.append(h('div', { class: 'card question' }, askEl));
  if (below) wrap.append(below);
  wrap.append(controls);
  if (mode === 'placement' && onSkip) {
    wrap.append(h('button', { class: 'btn quiet', onclick: () => { if (!locked) onSkip(); } }, 'I haven\'t learned this yet'));
  }
  paint();
  ring(show);

  const pad = kind === 'choice' || kind === 'order' ? null : controls;
  return {
    el: wrap,
    askEl,
    // a pad's fifth row: the point key, or ⌫ where two boxes put "next box" in its place (js/runner.js brings the whole pad
    // into view); choices and chips have no pad, however many ☐ their question has
    tall: pad != null && (point || boxes.length > 1),
    pad,
    boxLine,
    ring,
    lock() { locked = true; paint(); },
    unlock() { locked = false; paint(); },
    clear() { values.fill(''); at = 0; unpick(); wrap.querySelectorAll('.picked').forEach((b) => b.classList.remove('picked')); paint(); },
    setValues(vals) { vals.forEach((v, i) => { values[i] = String(v); }); paint(); },
    destroy() { document.removeEventListener('keydown', onKey); },
  };
}

// An order's chips, dealt as a fair shuffle (Fisher–Yates), and dealt again while they come in the answer's order, so
// she never finds them done for her and no chip keeps a place more often than another deal would give it (stage 6 step
// 2.3 review, finding 6: a sort with a random comparator dealt 3 chips in order a quarter of the time); and again while
// they come reversed where four or more are dealt, so the largest first is never the whole answer read backwards (pt61,
// T13). Three chips may come reversed (1 deal in 5): refusing that too left the middle chip never in the middle, a place
// that told her which chip goes there (pt61, the review's finding 2).
function deal(values) {
  const inOrder = (xs) => xs.every((x, i) => String(x) === String(values[i]));
  const reversed = (xs) => xs.every((x, i) => String(x) === String(values[values.length - 1 - i]));
  const other = new Set(values.map(String)).size > 1; // another order there is to deal
  const four = other && values.length > 3; // its reverse refused too
  let out;
  do {
    out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while ((other && inOrder(out)) || (four && reversed(out)));
  return out;
}

// the most characters a choice's words can have and stay a short choice: about a line of a half-width button at 390 wide
const LONG_CHOICE = 16;

// A box as she typed it, the whole part grouped as fmt groups it: "3." and "0.50" stay as they are.
function asTyped(v) {
  const [whole, frac] = v.split('.');
  return frac === undefined ? fmt(Number(v)) : `${fmt(Number(whole || '0'))}.${frac}`;
}

function label(o) {
  return { true: 'True', false: 'False', yes: 'Yes', no: 'No' }[o] || o;
}
