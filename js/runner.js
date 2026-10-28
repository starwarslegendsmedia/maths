// Running a session: one problem at a time, worked examples, mixed review, the sprint and the
// placement sittings. Every answer becomes an event in the store.
//
// After a first miss she gets a question that helps her find her own mistake (IES 2021 p. 7) and tries
// again; after a second miss she rebuilds that sum step by step, filling its steps in, before moving
// on ("The student is responsible for ... correcting their answer before moving on", IES 2021 p. 54).

import { h, show } from './ui.js';
import { answerWidget, askClass, marked, findable, fracNodes } from './answer.js';
import * as sound from './sound.js';
import { stop as stopSpeaking, instruct, noRepeat, withoutNumbers, words as said } from './speech.js';
import { makeItem, hintFor } from '../engine/items/index.js';
import { TYPE_NAMES, barSlots, slotPicture } from '../engine/items/wordproblems.js';
import { isCorrect, answerText, fmt, sameAmount } from '../engine/check.js';
import { renderPicture } from '../engine/render/svg.js';
import { BY_ID } from '../engine/skills.js';
import { computeState, FAST_MS } from '../engine/mastery.js';
import { factsToLearn, knownTables, BY_TABLES } from '../engine/session.js';
import { nextProbe, applyProbe, placementFromEvents, isDone as placementDone, PROBE_ITEMS, PROBE_PASS, SITTING_PROBES } from '../engine/placement.js';
import { makeRng } from '../engine/rng.js';
import { inRounds, roundSizes, countLabel, pickReward, didLine, didCount } from '../engine/rounds.js';
import { Level, startLevel } from '../engine/level.js';
import { BANDS, bandOf, RATE_FROM } from '../engine/rating.js';
import { bestWarmUp } from '../engine/goals.js';
import { METHODS, WHOLE_OPS, preferredMethod, taughtFirst, reviewMethod, choiceOp, wayTitle } from '../engine/methods.js';
import { FAMILY_OPS, LEARNED } from '../engine/items/ways.js';
import { FRACTION_WAYS } from '../engine/fraction-ways.js';
import { flashMs } from '../engine/flash.js';
import { stepBoxes, workingSteps, valuedSteps, fade } from '../engine/boxes.js';
import { lowerFirst } from '../engine/items/facts.js';

// the most words a line she hears may have (research 2.1: a sentence or two; tests/short.test.js)
const MOST_SAID = 25;
// the percentage sums' ops (engine/items/index.js: pct-benchmarks' pct, pct-of's pof, pct-discount's poff and pest)
const PERCENT_OPS = new Set(['pct', 'pof', 'poff', 'pest']);
const wordsIn = (t) => said(t).split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
const PRACTICE_CAP = 8;    // problems of the new skill in one session (kept short), in rounds (engine/rounds.js)
const SPRINT_MS = 60000;

// When she names the wrong type: a question about the story's structure, never the answer.
export const TYPE_HINTS = {
  change: 'Does something happen that makes an amount go up or down?',
  combine: 'Are two amounts being put together into one whole?',
  compare: 'Is it asking how much more or fewer one thing is than another?',
  'equal-groups': 'Are there groups that all have the same amount?',
  multistep: 'Can you solve it in one go, or do you need to find something else first?',
};

// A word problem's own screens: finding its numbers and doing-words, and building a two-step problem's bar model.
export const WORD_LINES = {
  findDoing: 'Find the doing-words.',
  findBoth: 'Find the numbers and doing-words.',
  tapDoing: 'Tap each word that says what happens. Then tap Done.',
  tapBoth: 'Tap each number, and each word that says what happens. Then tap Done.',
  rest: 'Here are the others.',
  build: 'Build the bar. Tap the number that goes in the marked part.',
  look: 'Read the name by that part. Which number in the story is it?',
  ring: 'It is the one with the ring. Tap it.',
};

// How far a word problem's help has faded on a skill, from her days with it before today, judged as the step boxes are
// (engine/boxes.js: a day of 4 in 5 right first time moves it on one, a day under brings one back; her own answers only):
//   0  her first days: its numbers and doing-words marked for her, a two-step problem's bar model drawn
//   1  she finds the doing-words (the numbers still marked), and builds the bar for the first step
//   2  she finds the numbers and the doing-words, and builds both bars
//   3  nothing marked and nothing to find or build: she reads it, names its type and answers (its picture, a two-step
//      problem's bar model with them, still drawn on the question, as every word problem's picture is)
// Her days are replayed in order as engine/boxes.js replays them (its fade, over every way of the skill), one level
// further.
const WORD_FADED = 3;
export function wordFade(events, skill, now = Date.now(), memo = null) {
  return fade(events, skill, null, now, memo, { max: WORD_FADED });
}

// A question's picture sets out what the question gives and never does a step for her: the written layout without
// its carries or trades, the area model and the bus stop with boxes for what she works out, the chunking ladder with
// only its number, the amount to share without its groups, a place-value chart's empty columns, and a number line with
// no jumps or stops (none at all when its ends are hers to find; a line of lettered marks keeps its letters); a tape
// diagram's values as boxes, and a fraction line with no jumps and no marks but its letters (stage 6 strand 2, "The
// fraction pictures"), the area model and a shaded array being the question itself; a picture
// that is itself her working (marked working, as a rounding line or the factor rectangle) is left out; a worked example
// she only watches still shows every step (tests/question-picture.test.js).
export function asked(item) {
  const p = item.picture;
  if (!p) return item;
  let q = p;
  if (p.working) q = null;
  else if (p.type === 'columns' && p.carries) q = { ...p, carries: undefined };
  else if (['area', 'shortdiv', 'chunks'].includes(p.type)) q = { ...p, blank: true };
  else if (p.type === 'bar' && p.rows) q = { ...p, blank: true }; // a two-step bar model: the first step's result a box
  else if (p.type === 'groups' && p.find !== 'total') q = { ...p, blank: true };
  else if (p.type === 'placevalue') q = { ...p, value: '', highlight: undefined };
  else if (p.type === 'strips' && Array.isArray(p.rows) && p.rows.some((r) => r?.value != null)) q = { ...p, blank: true };
  else if (p.type === 'fracline') q = { ...p, jumps: undefined, marks: p.letters ? p.marks : undefined };
  else if (p.type === 'numberline') {
    // its ends by value, as numbers or as decimal text ('2.30' is 2.3)
    const given = item.ask.replace(/(\d)[ \u00a0](?=\d{3}(?!\d))/g, '$1').match(/\d+(?:\.\d+)?/g) || [];
    const gives = (end) => given.some((g) => sameAmount(g, end));
    // a line of lettered marks ("Which letter is at 0.65?", marked letters: true) is the question itself: its letters
    // are the options
    const lettered = Boolean(p.letters) && (p.marks || []).length > 0;
    if (lettered) q = { ...p, jumps: undefined };
    else q = gives(p.from) && gives(p.to) ? { ...p, jumps: undefined, marks: undefined } : null;
  }
  return q === p ? item : { ...item, picture: q };
}

export class Runner {
  constructor(root, store, { readAloud = true } = {}) {
    this.root = root;
    this.store = store;
    this.readAloud = readAloud;
    this.rng = makeRng(`${store.device}:${Date.now()}`);
    this.count = { done: 0, right: 0 }; // and helped, once she asks for a step
    this.round = [];  // what she did in this round, a problem at a time (engine/rounds.js didLine)
    this.record = []; // and in the whole session, for the day's summary (js/app.js)
    this.onStop = null; // set by js/app.js for a session: every screen then has "Stop here for today"
    this.stopped = false;
    this.timers = new Map(); // every timer it has running, with what clears it (stop)
    this.fades = new Map();  // how far each way's step boxes have faded today (engine/boxes.js)
  }

  // progress: null, a share done (a bar), or { i, n } in a round (a bar and "2 of 5"). A new screen stops the last
  // one's words. In a session every screen ends with "Stop here for today".
  frame(title, progress, ...body) {
    stopSpeaking();
    const round = progress != null && typeof progress === 'object';
    const share = round ? progress.i / progress.n : progress;
    const bar = progress == null ? null : h('div', { class: 'progress' }, h('div', { style: `width:${Math.round(share * 100)}%` }));
    const count = round ? h('span', { class: 'count' }, countLabel(progress.i, progress.n)) : h('span', { style: 'width:44px' });
    const stop = this.onStop ? h('button', { class: 'btn plain stop', onclick: () => this.stop() }, 'Stop here for today') : null;
    show(this.root, h('div', { class: 'top' }, h('span', { style: 'width:44px' }), h('h1', {}, title), count), bar, ...body, stop);
  }

  // "Stop here for today" (research 9.1: a session ends before she fades; 3.5: stopping costs her nothing): the session
  // goes no further, and nothing more of it is shown, said or written; js/app.js counts the day and shows what she did.
  // There is one way to stop: everything the runner waits for (a tap, an answer, a pause) comes through waitFor, which
  // never goes on once she has stopped, and every timer it starts is cleared here. What she answered before she
  // stopped is already kept.
  stop() {
    this.stopped = true;
    for (const [id, clear] of this.timers) clear(id);
    this.timers.clear();
    stopSpeaking();
    this.onStop?.();
  }

  // A wait for her or for the clock: build(done) draws what it needs and calls done(value) when it is over; after Stop,
  // done does nothing, so whatever waits on it goes no further.
  waitFor(build) {
    return new Promise((resolve) => build((value) => { if (!this.stopped) resolve(value); }));
  }

  later(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.set(id, clearTimeout);
    return id;
  }

  every(fn, ms) {
    const id = setInterval(fn, ms);
    this.timers.set(id, clearInterval);
    return id;
  }

  cancel(id) {
    this.timers.get(id)?.(id);
    this.timers.delete(id);
  }

  sleep(ms) {
    return this.waitFor((done) => this.later(done, ms));
  }

  // Every instruction read aloud, and again after a pause (js/speech.js; research 6.15, 2.1). A problem she solves is
  // put on the screen and never read out (decided 24 October 2026); the teaching and the hints are said.
  say(text) {
    if (this.readAloud && text) instruct(text);
  }

  // A problem worked her way (engine/methods.js): the way she chose, else the way taught first (for a facts skill, each
  // fact's own: taughtFirst).
  make(skill, opts = {}) {
    const events = this.store.events;
    const way = { method: preferredMethod(events, skill, '×', this.choice(skill, '×')) };
    // a facts skill's division takes her ÷ way, kept apart from her × way
    if (BY_ID[skill]?.kind === 'facts') way.divMethod = preferredMethod(events, skill, '÷', this.choice(skill, '÷'));
    const o = { ...way, ...this.byTables(skill), ...opts };
    o.method ??= taughtFirst(skill);
    return makeItem(skill, this.rng, o);
  }

  // The tables she knows (engine/session.js knownTables), for a skill that takes its factors from them: { factors },
  // else nothing. Worked out again only when her events have changed.
  byTables(skill) {
    if (!BY_TABLES.has(skill)) return {};
    const events = this.store.events;
    if (this.known?.events !== events || this.known.n !== events.length) this.known = { events, n: events.length, tables: knownTables(computeState(events)) };
    return this.known.tables ? { factors: this.known.tables } : {};
  }

  // Her latest choice of way on a skill (engine/methods.js lastChoice), or null, kept up as events come in, so a problem
  // does not read her whole history again; read afresh if her events were merged from another device (a new list).
  choice(skill, op = '×') {
    const events = this.store.events;
    if (this.chosen?.events !== events) this.chosen = { events, at: 0, last: new Map() };
    for (const c = this.chosen; c.at < events.length; c.at++) {
      const e = events[c.at];
      if (e.type === 'method-choice') c.last.set(`${e.skill} ${e.op === '÷' ? '÷' : '×'}`, e);
    }
    return this.chosen.last.get(`${skill} ${op}`) ?? null; // null, not undefined: none, found
  }

  // One problem done, for the round's line and the session's (not the placement check's, which marks nothing).
  did(entry) {
    this.round.push(entry);
    this.record.push(entry);
  }

  // How many step boxes a long method's problem has today, in practice and the warm-up (engine/boxes.js); null for a
  // skill that has none.
  boxes(item) {
    return stepBoxes(this.store.events, item, Date.now(), this.fades);
  }

  // Her level for a skill's practice today (engine/level.js): moved after a run of three, eased after a win.
  level(skillId) {
    return new Level({ start: startLevel(this.store.events, computeState(this.store.events), skillId) });
  }

  // A pause before a screen changes by itself; the tests open it by hand.
  pause(ms) {
    return this.sleep(ms);
  }

  picture(item) {
    if (!item.picture) return null;
    const svg = renderPicture(item.picture);
    return svg ? h('div', { class: 'picture', html: svg }) : null;
  }

  // One problem. Resolves with { firstTry, correct, ms }. A word problem first asks her to name its type
  // (IES 2021 Rec. 5: "name the problem type" before solving), outside sprints and placement; once its help has faded
  // (wordFade), she finds its doing-words before that, and builds a two-step problem's bar after it; at the last level
  // she has it as it is, nothing marked.
  async ask(item, phase, opts = {}) {
    if (item.problemType && ['learn', 'practice', 'review'].includes(phase)) {
      const title = opts.title || '';
      // only here: a worked example (worked()) keeps the marks whatever her level, as it demonstrates (decided 25 October 2026)
      const faded = item.marks?.length ? wordFade(this.store.events, item.skill, Date.now(), this.fades) : 0;
      if (faded >= WORD_FADED) item = { ...item, marks: undefined };
      if (faded && faded < WORD_FADED) await this.findWords(item, faded, title);
      await this.nameType(item, title);
      if (faded && faded < WORD_FADED && item.picture?.rows) await this.buildBar(item, faded, title);
    }
    return this.askOnly(item, phase, opts);
  }

  // Her turn to find the story's doing-words, and after two good days its numbers too (research 2.5: highlighted for
  // her first, then by her): each word a tap, a word she finds marked, any other word left as it is. Done shows the
  // ones she missed, marked, and nothing is a fail: what she found is kept in her progress ('wp-words') and counts nowhere.
  findWords(item, faded, title) {
    const kinds = faded >= 2 ? ['number', 'doing'] : ['doing'];
    const [heading, line] = faded >= 2 ? [WORD_LINES.findBoth, WORD_LINES.tapBoth] : [WORD_LINES.findDoing, WORD_LINES.tapDoing];
    return this.waitFor((resolve) => {
      let found = 0;
      let over = false;
      const story = findable(item, kinds, () => { found++; });
      const fb = h('div', { class: 'feedback' });
      const done = h('button', { class: 'btn big', onclick: async () => {
        if (over) return;
        over = true;
        const of = story.keys.length;
        this.store.add('wp-words', { skill: item.skill, key: item.key, find: kinds, found, of });
        if (found < of) {
          story.reveal();
          fb.className = 'feedback hint';
          fb.textContent = WORD_LINES.rest;
          this.say(fb.textContent);
          await this.sleep(1800);
        } else {
          fb.className = 'feedback good';
          fb.textContent = 'You found them all.';
          await this.sleep(900);
        }
        resolve();
      } }, 'Done');
      this.frame(title, null,
        h('div', { class: 'card question' }, story.el),
        h('div', { class: 'stack center', style: 'gap:4px' }, h('h2', { style: 'margin:0;font-size:20px' }, heading), h('p', { style: 'margin:0' }, line)),
        done, fb);
      this.say(`${heading} ${line}`);
    });
  }

  // She builds the bar model of a two-step problem from its story (teaching audit 10; research 15.11 and 5.5, doing it
  // helps it stick), the first step's bar after a good day and both after two: each part that holds a number from the
  // story is marked in turn, and she taps the story's number that goes there. A wrong one gets a question about the part, then
  // the right one ringed; it never counts against her answer or her skill ('wp-bar' keeps it in her progress). Then she
  // answers as before, with the bar she built. A decimal story's numbers are kept as written and found by their value
  // (stage 6: "0.50" stays "0.50", engine/check.js sameAmount); a whole-number story's are numbers, as before.
  buildBar(item, faded, title) {
    const decimal = item.answer.kind === 'decimal';
    const story = item.marks.filter((m) => m.kind === 'number').map((m) => item.ask.slice(m.from, m.to).replace(/[$ ]/g, '')).map((t) => (decimal ? t : Number(t)));
    const slots = barSlots(item.picture, Math.min(faded, item.picture.rows.length), story);
    if (!slots.length) return Promise.resolve();
    return this.waitFor((resolve) => {
      let at = 0;
      let misses = 0;
      let wrong = 0;
      const pic = h('div', { class: 'picture' });
      const draw = () => { pic.innerHTML = renderPicture(slotPicture(item.picture, slots, at)); };
      const fb = h('div', { class: 'feedback' });
      const chips = new Map();
      const chipOf = (v) => [...chips].find(([n]) => sameAmount(n, v))?.[1];
      const tapped = async (n) => {
        if (at >= slots.length) return;
        if (!sameAmount(n, slots[at].value)) {
          misses++;
          wrong++;
          fb.className = 'feedback hint';
          fb.textContent = misses === 1 ? WORD_LINES.look : WORD_LINES.ring;
          if (misses > 1) chipOf(slots[at].value)?.classList.add('show');
          this.say(fb.textContent);
          return;
        }
        sound.right();
        chips.get(n).classList.remove('show');
        at++;
        misses = 0;
        fb.className = 'feedback';
        fb.textContent = '';
        draw();
        if (at < slots.length) return;
        this.store.add('wp-bar', { skill: item.skill, key: item.key, parts: slots.length, wrong });
        fb.className = 'feedback good';
        fb.textContent = 'That\'s the bar.';
        await this.sleep(900);
        resolve();
      };
      for (const n of new Set(story)) chips.set(n, h('button', { onclick: () => tapped(n) }, decimal ? n : fmt(n)));
      draw();
      this.frame(title, null,
        h('div', { class: 'card question' }, h('div', { class: 'ask words' }, ...marked(item))),
        h('p', { class: 'center', style: 'margin:0;font-weight:650' }, WORD_LINES.build),
        pic, h('div', { class: 'chips' }, ...chips.values()), fb);
      this.say(WORD_LINES.build);
    });
  }

  nameType(item, title) {
    const right = TYPE_NAMES[item.problemType];
    return this.waitFor((resolve) => {
      let tries = 0;
      const fb = h('div', { class: 'feedback' });
      const choices = h('div', { class: 'choices' }, item.typeOptions.map((o) => h('button', { onclick: async (e) => {
        tries++;
        const ok = o === right;
        this.store.add('wp-type', { skill: item.skill, type: item.problemType, correct: ok, firstTry: ok && tries === 1 });
        if (ok) {
          e.currentTarget.classList.add('picked');
          sound.right();
          fb.className = 'feedback good';
          fb.textContent = `Yes, it's ${right.toLowerCase() === 'more than one step' ? 'more than one step' : `a ${right.toLowerCase()} problem`}.`;
          await this.sleep(900);
          resolve();
        } else {
          fb.className = 'feedback hint';
          fb.textContent = TYPE_HINTS[item.problemType] || 'Read it again. What is happening in the story?';
          this.say(fb.textContent);
        }
      } }, o)));
      this.frame(title, null,
        h('div', { class: 'card question' }, h('div', { class: 'ask words' }, ...marked(item))),
        h('p', { class: 'center', style: 'margin:0;font-weight:650' }, 'What type of problem is it?'),
        choices, fb);
      this.say(`What type of problem is it? ${orList(item.typeOptions)}?`);
    });
  }

  // In practice, "Show me one step" (research 3.6: "I don't know" gets a safe answer; 2.3) gives the next step of her
  // way, free and said aloud, so the answer stays hers: a step whose value is the answer (the last, or a division
  // fact's "7 × ☐ = 56") comes with its box empty. A choice or an order is written in its last step's words ("so 9 is
  // not a factor of 29", "Smallest first: …"), so for those it stops before that step. A problem she asked a step for
  // is kept as 'helped': engine/mastery.js counts it as a try only, so it is neither her right-first-time evidence nor
  // a miss, and here it leaves her level, her worked examples and her rating as they were.
  // boxes (engine/boxes.js): a long method's first working steps come first, one at a time, each a box she types in, said
  // as it appears and with a step's usual help if she misses it; they stay in view while she writes the answer in the
  // question. Only the answer is marked, as before, and timed from when she reaches it: a slip on a step leaves it right
  // first time. "Show me one step" fills the box she is on.
  // Her answer is kept as soon as it is settled, before the "Yes!" pause or the rebuild, so a Stop then loses nothing.
  askOnly(item, phase, { title = '', progress = null, withPicture = true, boxes = null } = {}) {
    return this.waitFor((resolve) => {
      let started = null;
      let tries = 0;
      let firstMs = null;
      let shown = 0;
      let at = 0;      // the next of its steps not yet on the screen
      let box = null;  // the step box she is on: box.give() fills it in for her
      let settled = false;
      let widget = null;
      const feedback = h('div', { class: 'feedback' });
      const boxed = boxes ? workingSteps(item).slice(0, boxes) : [];
      // a remainder's steps say which are the answer (engine/methods.js own): its small remainder is too often a working
      // step's number by chance to go by value
      const isAnswer = (s) => Boolean(s.answer) || (item.answer.kind !== 'remainder' && answerParts(item).some((v) => sameAmount(v, s.value)));
      const shows = item.steps.length - (['number', 'decimal', 'fraction', 'remainder'].includes(item.answer.kind) ? 0 : 1); // the steps it gives
      const answer = (between = null) => {
        started = performance.now();
        widget = answerWidget(item, {
          mode: phase === 'placement' ? 'placement' : 'normal',
          below: feedback,
          between,
          onSkip: () => done(keep(false, true)),
          onSubmit: async (given) => {
            tries++;
            if (firstMs == null) firstMs = Math.round(performance.now() - started);
            const ok = isCorrect(item.answer, given);
            widget.lock();
            if (phase === 'placement') return done(keep(ok));
            if (ok) {
              settled = true;
              sound.right();
              feedback.className = 'feedback good';
              feedback.textContent = tries === 1 ? 'Yes!' : 'That\'s it.';
              const result = keep(true);
              await this.sleep(650);
              return done(result);
            }
            if (tries === 1) {
              feedback.className = 'feedback hint';
              writeIn(feedback, hintFor(item, given) || item.hint);
              pad(widget.el); // the question, the hint under it and the pad
              this.say(feedback.textContent);
              await this.sleep(400);
              widget.clear();
              widget.unlock();
              return;
            }
            // second miss: she rebuilds that sum herself, a step at a time
            settled = true;
            const result = keep(false);
            await this.rebuild(item, title);
            done(result);
          },
        });
        return widget.el;
      };
      const keep = (ok, skipped = false) => {
        widget.destroy();
        const helped = shown > 0;
        const result = { firstTry: ok && tries <= 1 && !skipped && !helped, correct: ok, ms: firstMs, ...(helped ? { helped } : {}) };
        this.store.add('answer', { skill: item.skill, key: item.key, phase: helped ? 'helped' : phase, correct: ok, firstTry: result.firstTry, ms: firstMs, method: item.method, ...(helped ? { shown } : {}), ...(boxed.length ? { boxes: boxed.length } : {}) });
        this.count.done++;
        if (helped) this.count.helped = (this.count.helped ?? 0) + 1;
        if (result.firstTry) this.count.right++;
        if (phase !== 'placement') {
          const chose = this.choice(item.skill, choiceOp(item));
          this.did({ firstTry: result.firstTry, correct: ok, ...(helped ? { helped } : {}),
            ...(chose && item.method ? { own: chose.chosen === item.method } : {}), ...(boxes != null ? { boxes: boxed.length } : {}) });
        }
        return result;
      };
      const done = (result) => {
        stopSpeaking();
        resolve(result);
      };
      // the pad brought into view (showPad), with "Show me one step" under it while she has it; old, what a pad that is
      // not tall, or choices or chips, follow here. Every pad stops at the line with her box (a decimal or remainder pad
      // on a question with a picture: tests/stage6-step6-screens.test.js, tests/replay-fixes-screens.test.js), so the
      // button she taps is on the screen, and a step just shown above the card with it where the screen has room; a
      // fraction answer's too, which stopped at a story's strips and left the button under the bottom edge (step 2.3
      // review finding 8; stage 6 step 2.4, the replay's story on the strips, the lead's ruling, pt59)
      const pad = (old) => this.showPad(widget, { old, under: step?.parentNode ? step : null });
      const steps = h('ol', { class: 'steps' });
      const pictured = new Set(); // the pictures drawn beside the steps listed, as the SVG each draws
      const step = ['learn', 'practice'].includes(phase) && shows > 0 ? h('button', { class: 'btn quiet', onclick: () => {
        if (settled || at >= shows) return;
        if (box) {
          if (isAnswer(item.steps[at])) return box.hint(item.hint); // its box stays hers, and she has the hint instead
          shown++;
          return box.give();
        }
        shown++;
        const s = item.steps[at++];
        const last = at === item.steps.length;
        const open = last || isAnswer(s);
        const text = last ? lastStep(item, s) : s.text;
        // a step with a picture of its own (a two-step story's columns for a result, stage 6 plan D7) shows it beside it, as a
        // question would where its box is still hers (asked); one marked working, the way's own picture, as it is; one
        // already drawn beside a step above it (the answer step carries the picture of the step before it, stage 6 step
        // 2.3's I1) is not drawn again, so the list stays short enough to keep the pad in view (the pt56 replay, shot 018)
        const own = s.picture ? ownPicture(item, s, open) : null;
        const svg = own ? renderPicture(own.picture) : '';
        const pic = svg && !pictured.has(svg) ? this.picture(own) : null;
        if (pic) pictured.add(svg);
        steps.append(h('li', {}, ...fill(text, open ? null : s.value), pic));
        this.say(open ? text : stepWords(s, true));
        if (at === shows) step.remove();
        // what she acts on, pushed down: this button, else her answer, followed by choices or chips, and by a pad only once
        // past the bottom edge (a step's number line can do it), so a whole-number pad still in view stays as it was
        const on = step.parentNode ? step : widget?.el;
        if (widget) pad(!widget.pad || on.getBoundingClientRect?.().bottom > window.innerHeight ? on : null);
      } }, 'Show me one step') : null;
      const drawn = withPicture ? asked(item) : null;
      const picture = drawn ? this.picture(drawn) : null;
      // the feedback goes under the question, above the pad (answerWidget's below), where she is looking
      if (!boxed.length) {
        // a question whose picture is strips or a tape (a fraction's, stage 6 strand 2) keeps it whole on the screen, its
        // story's picture being what she works from (pt61, the lead's ruling on triage T2, the measure's design 1): the
        // picture docked under the top edge (css/app.css .docked, the page sliding under it), the steps shown inside the
        // card between the question's words and its "Answer:" line, the button in the two empty slots of a pad's fifth
        // row (a pad of 13 keys), and the pad's scroll stopped at the picture's bottom (dock). Every other screen as it was.
        const docked = picture != null && drawn.picture.type === 'strips';
        if (docked) picture.classList.add('docked');
        const el = answer(docked && step ? steps : null);
        if (docked && step && widget.pad?.children.length % 3 === 1) {
          step.classList.add('inpad');
          widget.pad.append(step);
        }
        // it opens with what she acts on in view, the pad and its ✓ and "Show me one step" (on a phone a word problem's
        // story and bars push them past the bottom edge): one block from the question down, brought into view only as
        // far as it needs, so on a screen too short for all of it the question's start stays at the top
        const act = h('div', { class: 'stack' }, el, step?.parentNode ? null : step);
        this.frame(title, progress, picture, step && !steps.parentNode ? steps : null, act);
        return pad(act);
      }

      const question = h('div', { class: 'card question' }, h('div', { class: askClass(item.ask) }, fracNodes(item.ask.replaceAll('☐', '?'))));
      const area = h('div', { class: 'stack' });
      this.frame(title, progress, picture, question, steps, area, step);
      (async () => {
        let lead = []; // a step without a box, or one filled in for her, is said with the next
        for (; at <= boxed.at(-1); at++) {
          const s = item.steps[at];
          if (!('value' in s)) { steps.append(h('li', {}, ...fracNodes(s.text, null, { step: true }))); lead.push(s.text); continue; }
          steps.querySelectorAll('li').forEach((x) => x.classList.remove('now'));
          const li = h('li', { class: 'now' }, ...fill(s.text, null));
          steps.append(li);
          this.say(inTurn([...lead, stepWords(s, false)]));
          box = {};
          const given = await this.fillStep(s, li, area, item, { first: at === 0, hold: box });
          box = null;
          lead = given ? [stepWords(s, true)] : [];
        }
        steps.querySelectorAll('li').forEach((x) => x.classList.remove('now'));
        question.remove();
        area.replaceChildren(answer());
        feedback.textContent = 'Now finish it.';
        pad(area);
        this.say(inTurn([...lead, feedback.textContent]));
      })();
    });
  }

  // After a second miss she rebuilds that same sum as a faded worked example (research 2.2: "show me", not "say it
  // back"; 3.2: rebuild the step): one step at a time, each said as it appears, the first shown and every step after it
  // hers to fill, with a step's usual help if she misses it. When its last step is the answer, that is her answer; any
  // other answer (a remainder, a choice) she then writes in the question herself.
  async rebuild(item, title) {
    const valued = valuedSteps(item);
    await this.worked(item, Math.max(1, valued.length - 1), title, { heading: 'Let\'s go through it', keep: false });
    if (!(['number', 'decimal'].includes(item.answer.kind) && sameAmount(item.steps[valued.at(-1)]?.value, item.answer.value))) await this.copyAnswer(item, title);
  }

  copyAnswer(item, title) {
    return this.waitFor((resolve) => {
      const feedback = h('div', { class: 'feedback' }, fracNodes(copyLine(item.answer)));
      // a choice's line goes above its choices, where every line about her answer sits, and the one to tap is ringed
      const choice = item.answer.kind === 'choice';
      const widget = answerWidget(item, {
        ...(choice ? { below: feedback, show: item.answer.value } : {}),
        onSubmit: async (given) => {
          if (isCorrect(item.answer, given)) {
            widget.lock();
            widget.destroy();
            resolve(true);
          } else {
            widget.clear();
          }
        },
      });
      this.frame(title, null, widget.el, choice ? null : feedback);
      this.showPad(widget);
      this.say(feedback.textContent);
    });
  }

  // A worked example. fade = how many of the last steps she fills in herself (Renkl & Atkinson: backward fading).
  // The rebuild after a second miss has its own heading, and is not kept as a worked example: the problem is kept.
  // A problem whose steps have no value (a choice or an order: "So 6.32 is between 6.3 and 6.4") has none for her to
  // fill, so with fade > 0 she answers it on its own choices: at fade 1 after every step but the last, at 2 or more with
  // no step shown. The rebuild keeps every step and then has her copy the answer (rebuild, copyAnswer).
  async worked(item, fade, title, { heading: own = null, keep = true } = {}) {
    const withValue = valuedSteps(item);
    const toFill = new Set(withValue.slice(withValue.length - Math.min(fade, withValue.length)));
    const onChoices = fade > 0 && !withValue.length && own == null;
    const watched = !onChoices ? item.steps.length : fade === 1 ? Math.max(0, item.steps.length - 1) : 0;
    const list = h('ol', { class: 'steps' });
    const heading = own ?? (fade === 0 ? 'Watch how it works' : onChoices ? (watched ? 'You do the last part' : 'Your turn, all of it')
      : fade >= withValue.length ? 'Your turn, all of it' : 'You do the last part');
    // once she fills in any step, or chooses the answer, the picture is the question's, so it never shows a value she is
    // asked for; steps she only watches (the rebuild of a number in words) keep it whole, so she reads them from it
    const base = toFill.size || onChoices ? asked(item) : item;
    // a step with a picture of its own (a two-step story's columns for a result, stage 6 plan D7) shows it while it is the
    // step she is on, as a question would where she fills it (asked; one marked working as it is, ownPicture), and the
    // problem's picture is back for the others, laid out as the question's (css/app.css .as-question), never to one side
    // or wider than it is there (stage 6 step 2.3, the replay's E/088 and A/043)
    const ownPictures = item.steps.some((st) => st.picture);
    const pictureOf = (st, mine) => this.picture(!st.picture ? base : ownPicture(item, st, mine));
    const first = ownPictures ? this.picture(base) : null;
    const shownHere = ownPictures ? h('div', first ? { class: 'as-question' } : {}, first) : null;
    let showing = null; // the step whose picture is shown, or null for the problem's
    // the question as the first screen shows it, in its look and size (askClass)
    const card = h('div', { class: 'card stack' },
      h('h2', {}, heading),
      h('div', { class: askClass(item.ask) }, ...(item.marks ? marked(item) : fracNodes(item.ask.replaceAll('☐', '?')))),
      shownHere ?? this.picture(base), list);
    const area = h('div', { class: 'stack' });
    this.frame(title, null, card, area);
    for (let i = 0; i < watched; i++) {
      const s = item.steps[i];
      const li = h('li', { class: 'now' });
      list.append(li);
      list.querySelectorAll('li').forEach((x) => x !== li && x.classList.remove('now'));
      const opening = i === 0 ? `${heading}. ` : '';
      // drawn again only where it changes: at a step with its own picture, and back after it; where the problem has none
      // here (a working picture left off once she answers), a step's own stays on, as "Show me one step" keeps it, so the
      // steps after it still point at a picture she sees
      const wants = s.picture ? s : base.picture ? null : showing;
      if (shownHere && wants !== showing) {
        const pic = pictureOf(s, toFill.has(i));
        shownHere.className = !s.picture && pic ? 'as-question' : '';
        shownHere.replaceChildren(...[pic].filter(Boolean));
        showing = wants;
      }
      if (toFill.has(i)) {
        li.append(...fill(s.text, null));
        this.say(opening + stepWords(s, false));
        await this.fillStep(s, li, area, item, { first: i === 0 });
      } else {
        li.append(...fill(s.text, s.value));
        this.say(opening + stepWords(s, true));
        await this.tapNext(area, i === item.steps.length - 1 ? 'Got it' : 'Next');
      }
    }
    if (onChoices) {
      list.querySelectorAll('li').forEach((x) => x.classList.remove('now'));
      if (!watched) this.say(`${heading}.`);
      await this.choose(item, area);
    }
    stopSpeaking();
    if (keep) this.store.add('answer', { skill: item.skill, key: item.key, phase: 'worked', correct: true, firstTry: true, ms: null, method: item.method });
  }

  // Her answer in a worked example whose steps have no value: the question's own choices (or chips) under the card that
  // shows it, resolving once she has it right; a first miss gets the problem's hint, as in practice, and a second the one
  // to tap (copyLine), as a step she fills gets "It is 7. Type it in."
  choose(item, area) {
    return this.waitFor((resolve) => {
      let tries = 0;
      const fb = h('div', { class: 'feedback' });
      const widget = answerWidget(item, {
        askIn: h('div'), // the question is on the card above
        below: fb,
        onSubmit: (given) => {
          tries++;
          if (isCorrect(item.answer, given)) {
            sound.right();
            widget.destroy();
            area.replaceChildren();
            resolve();
            return;
          }
          fb.className = 'feedback hint';
          writeIn(fb, tries === 1 ? hintFor(item, given) || item.hint : copyLine(item.answer));
          this.say(fb.textContent);
          widget.clear();
          if (tries > 1) widget.ring(item.answer.value); // the one to tap ringed, as the copy screen rings it (copyAnswer)
        },
      });
      area.replaceChildren(widget.el);
      this.showPad(widget, { old: area });
    });
  }

  tapNext(area, label) {
    return this.waitFor((resolve) => {
      area.replaceChildren(h('button', { class: 'btn big', onclick: resolve }, label));
      this.follow(area);
    });
  }

  // On a screen that grows a step at a time, what she is on is brought into view, smoothly and only as far as it needs:
  // the pad or the button, with the step she is on just above it (on a phone a long sum runs past the bottom edge).
  // On a screen with a docked picture (askOnly), never under it: the screen's top edge taken as the picture's bottom, and
  // the scroll "nearest" makes there stopped on a line's edge (edge), the page scrolled by that instead where it differs.
  follow(el) {
    const dock = this.dock();
    if (dock) el.style.scrollMarginTop = `${dock}px`;
    const r = dock ? el.getBoundingClientRect?.() : null;
    const room = window.innerHeight - dock;
    if (r && !(r.top >= dock && r.bottom <= window.innerHeight) && !(r.top < dock && r.bottom > window.innerHeight)) {
      const by = (r.top < dock && r.height <= room) || (r.bottom > window.innerHeight && r.height > room) ? Math.floor(r.top - dock) : Math.ceil(r.bottom - window.innerHeight);
      const to = this.edge(by, Math.floor(r.top - dock), r.height <= room ? Math.min(by, Math.ceil(r.bottom - window.innerHeight)) : by);
      if (to !== by) return window.scrollBy({ top: to, behavior: 'smooth' });
    }
    el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }

  // The height of a docked picture on the screen (askOnly), sticky at its top edge: what a scroll keeps clear at the top;
  // 0 on every other screen.
  dock() {
    const r = this.root.querySelector('.picture.docked')?.getBoundingClientRect?.();
    return r ? Math.ceil(r.bottom - r.top) : 0;
  }

  // A scroll of by on a screen with a docked picture, stopped on a line's edge: where the picture's bottom would cut a
  // line of the text sliding under it, the rest under the picture read as other words ("Kead It all tne way througn":
  // pt61's replay, the shots look's finding A; the lead's ruling R12, pt62), so the page goes on until each line there is
  // under the picture, never past most (what she needs, its top at the picture's bottom) or the page's end, or else back
  // until each is out from under it, never short of least (what she needs, its bottom at the screen's); where neither can
  // be, as it was. 0, or no docked picture: as it was. A line's box (Range) has ink down to its bottom but none in its top
  // 3 px at the game's sizes (WebKit, pt62), so a line counts as cut with any of it under the edge and more than 3 px of
  // it above: a stacked fraction's line reaches a pixel or two into the next. A stacked fraction is one line, its
  // numerator's top to its denominator's bottom, never cut at the bar; its hidden "/" (css/app.css .slash, its box over the
  // numerator) and a picture's labels are no line (the round 2 review, finding 2).
  edge(by, most, least = by) {
    const dock = this.root.querySelector('.picture.docked');
    if (!by || !dock || !document.createRange) return by;
    const d = dock.getBoundingClientRect();
    const edge = d.bottom - d.top;
    const lines = [];
    const walk = (n) => {
      if (n.nodeType === 3) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const l of range.getClientRects()) if (l.height) lines.push(l);
      } else if (n.matches && !n.matches('.slash, .picture')) {
        if (n.matches('.frac')) lines.push(n.getBoundingClientRect());
        else n.childNodes.forEach(walk);
      }
    };
    const after = [...this.root.childNodes];
    after.slice(after.indexOf(dock) + 1).forEach(walk);
    const far = Math.min(most, (document.documentElement?.scrollHeight ?? Infinity) - window.innerHeight - (window.scrollY ?? 0));
    const cut = (y) => lines.filter((l) => l.top - y < edge - 3 && l.bottom - y > edge + 0.05);
    for (let y = by, c = cut(y); y <= far; y += Math.ceil(Math.max(...c.map((l) => l.bottom)) - y - edge), c = cut(y)) if (!c.length) return y;
    for (let y = by, c = cut(y); y >= least; y -= Math.ceil(edge - 3 - Math.min(...c.map((l) => l.top)) + y), c = cut(y)) if (!c.length) return y;
    return by;
  }

  // An answer widget brought into view as it shows, or as something goes in above it (a step, a hint): a whole-number
  // pad, or choices, as before (old, the element followed there, or none); a pad with a fifth row (a point key, stage 6,
  // or a remainder's second box), and so often under a tall screen's bottom edge, scrolled until the pad's bottom, or "Show
  // me one step" right under it (under), is on the screen, but never so far that top (the line with her answer box, or
  // the step she is on) goes off it: on a short screen the pad and her box win over a story's opening, which was read to
  // her (padScroll); under a docked picture, never so far that top goes under the picture (dock). There every pad is
  // brought into view so, a one-box pad too: followed, the steps in its card and a hint under it made it taller than the
  // room under the picture, and ✓ was left under the bottom edge (pt61, the review of step 2.6, finding 1); choices and
  // chips, which have no pad, are followed as before.
  showPad(widget, { old = null, top = widget.boxLine ?? widget.el, under = null } = {}) {
    const floor = widget.pad ? this.dock() : 0;
    if (!widget.tall && !floor) {
      if (old) this.follow(old);
      return;
    }
    const end = (under ?? widget.pad).getBoundingClientRect?.();
    const from = top.getBoundingClientRect?.();
    const by = end && from ? padScroll(end, from, window.innerHeight, floor) : 0;
    const to = floor && by > 0 ? this.edge(by, Math.floor(from.top - floor), Math.min(by, Math.ceil(end.bottom - window.innerHeight))) : by;
    if (to > 0) window.scrollBy({ top: to, behavior: 'smooth' });
  }

  // A step she fills in: resolves once it is right, with true if it was filled in for her instead (hold.give, "Show me
  // one step"). The first step of all has no step before it to look at. Its box is the step's own, typed into there
  // (answerWidget's askIn), with the pad below it; one she works out herself is counted for the day's summary.
  fillStep(step, li, area, item, { first = false, hold = null } = {}) {
    return this.waitFor((resolve) => {
      let tries = 0;
      const fb = h('div', { class: 'feedback' });
      const stepItem = { ...item, ask: step.text, answer: { kind: 'number', value: step.value } };
      const done = (given) => {
        widget.destroy();
        li.replaceChildren(...fill(step.text, step.value));
        area.replaceChildren();
        resolve(given);
      };
      if (hold) {
        hold.give = () => done(true);
        hold.hint = (text) => { fb.className = 'feedback hint'; writeIn(fb, text); this.say(text); };
      }
      const widget = answerWidget(stepItem, {
        askIn: li,
        onSubmit: (given) => {
          tries++;
          if (isCorrect(stepItem.answer, given)) {
            sound.right();
            this.count.steps = (this.count.steps ?? 0) + 1;
            done(false);
          } else if (tries === 1) {
            fb.className = 'feedback hint';
            fb.textContent = first ? 'Read the step again. What does it ask?' : 'Look at the step before. What does it tell you?';
            this.say(fb.textContent);
            widget.clear();
          } else {
            fb.className = 'feedback hint';
            fb.textContent = `It is ${fmt(step.value)}. Type it in.`;
            this.say(fb.textContent);
            widget.clear();
          }
        },
      });
      area.replaceChildren(fb, widget.el);
      this.showPad(widget, { old: area, top: li });
    });
  }

  // ---- the parts of a session ----

  // Today's lesson: the warm-up and the new part in the order she chooses, then her slowest facts, then her own
  // rating. A small choice to open with (research 1.5, 10.9); with only one part today there is nothing to choose.
  async lesson(plan) {
    const parts = [];
    if (plan.review.length) parts.push('review');
    if (plan.learn) parts.push('learn');
    if (parts.length > 1) {
      const first = await this.askStart(parts, plan.learn.fresh);
      this.store.add('start-choice', { first });
      if (first === 'learn') parts.reverse();
    }
    for (const part of parts) {
      if (part === 'review') await this.review(plan.review);
      else await this.learn(plan.learn.skill, plan.learn.fresh);
    }
    if (plan.compare) await this.compare(plan.compare);
    if (plan.facts?.length) await this.factPractice(plan.facts);
    await this.rate();
  }

  askStart(parts, fresh = true) {
    return this.waitFor((resolve) => {
      this.frame('Today', null,
        h('div', { class: 'card stack center' }, h('h2', {}, 'What first?')),
        h('button', { class: 'btn big', onclick: () => resolve('review') }, 'Warm-up first'),
        h('button', { class: 'btn big', onclick: () => resolve('learn') }, fresh ? 'Something new first' : 'Today\'s skill first'));
      this.say(`What first? Warm-up first, or ${fresh ? 'something new first' : 'today\'s skill first'}?`);
    });
  }

  // a warm-up's problem: the skill worked her way (or school's, one in three: reviewMethod), in the tables she knows
  reviewItem(p) {
    return this.make(p.skill, { method: reviewMethod(this.store.events, p.skill), ...(p.key ? { key: p.key } : {}) });
  }

  async review(picks) {
    await this.warmUpGoal(bestWarmUp(this.store.events));
    for (const round of inRounds(picks)) {
      for (let i = 0; i < round.length; i++) {
        const p = round[i];
        const item = this.reviewItem(p);
        await this.ask(item, 'review', { title: 'Warm-up', progress: { i, n: round.length }, boxes: this.boxes(item) });
      }
      await this.roundEnd('review', round.length);
    }
  }

  // What good looks like before the warm-up, with her best warm-up beside it (engine/goals.js, research 7.2).
  warmUpGoal(best) {
    return this.waitFor((resolve) => {
      const heading = 'A good warm-up: each one right first time';
      const line = `${best ? `Your best: ${best.right} of ${best.done}. ` : ''}Take your time; there's no clock.`;
      this.frame('Warm-up', null,
        h('div', { class: 'card stack center' }, h('h2', {}, heading), h('p', {}, line)),
        h('button', { class: 'btn big', onclick: resolve }, 'Start'));
      this.say(withoutNumbers(`${heading}. ${line}`));
    });
  }

  async learn(skillId, fresh) {
    const sk = BY_ID[skillId];
    const title = sk.title;
    if (sk.kind === 'facts') return this.learnFacts(skillId, fresh);
    if (fresh) {
      await this.intro(sk);
      await this.worked(this.make(skillId, { easy: true }), 0, title);
      await this.worked(this.make(skillId, { easy: true }), 1, title);
      await this.worked(this.make(skillId), 2, title);
    } else {
      await this.worked(this.make(skillId), 1, title);
    }
    let missesInARow = 0;
    let asked = 0;
    const level = this.level(skillId);
    for (const size of roundSizes(PRACTICE_CAP)) {
      for (let i = 0; i < size; i++) {
        const item = this.make(skillId, { easy: level.easy });
        const r = await this.ask(item, asked < 2 && fresh ? 'learn' : 'practice', { title, progress: { i, n: size }, boxes: this.boxes(item) });
        asked++;
        // a step she asked to see is free: it moves neither her level nor her run towards another worked example
        if (!r.helped) {
          level.record(r.firstTry);
          missesInARow = r.firstTry ? 0 : missesInARow + 1;
        }
        if (missesInARow >= 3) {
          await this.worked(this.make(skillId, { easy: true }), 0, title);
          missesInARow = 0;
        }
        if (computeState(this.store.events)[skillId].status === 'learned') {
          // the win closes the round, in place of the round's reward
          this.store.add('round', { part: 'practice', size: i + 1, reward: 'learned' });
          this.round = [];
          await this.celebrate(`You've learned ${lowerFirst(sk.title)}.`, 'It will come back in your warm-ups, so it sticks.');
          return;
        }
      }
      await this.roundEnd('practice', size);
    }
  }

  async learnFacts(skillId, fresh) {
    const sk = BY_ID[skillId];
    const { newFacts, again, mixIn } = factsToLearn(computeState(this.store.events), skillId, this.rng);
    if (fresh && sk.strategy) await this.intro(sk);
    for (let i = 0; i < newFacts.length; i++) {
      const key = newFacts[i];
      await this.worked(this.make(skillId, { key, form: 0 }), 0, 'A new fact');
      await this.flash(skillId, key, { i, n: newFacts.length });
    }
    if (newFacts.length) await this.roundEnd('new-facts', newFacts.length);
    const own = [...newFacts, ...again].map((key) => ({ skill: skillId, key }));
    const queue = this.rng.shuffle([...own, ...own, ...mixIn]);
    const level = this.level(skillId);
    for (const round of inRounds(queue)) {
      for (let i = 0; i < round.length; i++) {
        const r = await this.ask(this.make(round[i].skill, { key: round[i].key, easy: level.easy }), 'practice', { title: sk.title, progress: { i, n: round.length } });
        if (!r.helped) level.record(r.firstTry);
      }
      await this.roundEnd('practice', round.length);
    }
  }

  // A new fact shown, hidden, then typed whole from memory (Gersten et al. 2009: "a mathematics fact was presented
  // briefly"; "When the fact disappeared, the student typed the fact"), shown for flashMs of her history
  // (engine/flash.js). The factors go in either way round. The fact is shown, not said (a problem is never read out);
  // "Show it again" shows it once more; a miss shows it again with the fact said ("accompanying audio"), and a second
  // leaves it in view to copy. Nothing is marked wrong; she ends only by typing it.
  async flash(skillId, key, progress) {
    const [a, b] = key.split('x').map(Number);
    const fact = `${a} × ${b} = ${a * b}`;
    const heading = 'Look, then type it from memory';
    const shownMs = flashMs(this.store.events);
    const answers = [[a, b, a * b], [b, a, a * b]].map((values) => ({ kind: 'order', values }));
    // answerWidget shows an 'order' answer as chips holding its numbers, which would give the fact away: the boxes
    // are asked for as a plain sum, with the number pad, and checked against both orders here
    const sum = { skill: skillId, key, ask: '☐ × ☐ = ☐', answer: { kind: 'number' } };
    const area = h('div', { class: 'stack' });
    this.frame('A new fact', progress, area);
    let started = null;
    let firstMs = null;
    let misses = 0;
    let firstTry = true;

    // the screens change in place, so words still being said are not cut off when the fact hides
    const look = (line = null) => {
      area.replaceChildren(h('div', { class: 'card stack center' },
        line ? h('div', { class: 'feedback hint' }, line) : null,
        h('h2', {}, heading),
        h('div', { class: 'ask', style: 'font-size:44px' }, fact)));
      this.say(line ? `${line} ${a} times ${b} is ${a * b}. ${heading}.` : `${heading}.`);
      return this.waitFor((done) => this.pause(shownMs).then(done));
    };
    const kept = () => {
      this.store.add('answer', { skill: skillId, key, phase: 'flash', correct: true, firstTry, ms: firstMs });
      this.store.add('flash', { key, shownMs, firstTry });
      this.count.done++;
      if (firstTry) this.count.right++;
      this.did({ flash: true, firstTry, correct: true });
    };
    // the boxes: resolves with what she typed, or null for "Show it again"; a fact typed right is kept at once, before
    // the "Yes!" pause
    const boxes = (copy) => this.waitFor((resolve) => {
      const fb = h('div', { class: 'feedback' });
      let sent = false;
      const widget = answerWidget(sum, {
        onSubmit: async (given) => {
          sent = true;
          widget.lock();
          firstMs ??= Math.round(performance.now() - started);
          if (answers.some((ans) => isCorrect(ans, given))) {
            sound.right();
            fb.className = 'feedback good';
            fb.textContent = 'Yes!';
            kept();
            await this.sleep(650);
          }
          widget.destroy();
          resolve(given);
        },
      });
      const again = copy ? null : h('button', { class: 'btn plain', onclick: () => { if (sent) return; widget.destroy(); resolve(null); } }, 'Show it again');
      area.replaceChildren(...[copy ? h('div', { class: 'feedback hint' }, copy) : null, widget.el, fb, again].filter(Boolean));
      // nothing said again while she recalls it; with the fact in view to copy, it is said
      if (copy) this.say(copy); else noRepeat();
      if (firstMs == null) started = performance.now();
    });

    await look();
    for (;;) {
      const given = await boxes(misses >= 2 ? `Copy it: ${fact}` : null);
      if (given == null) { firstTry = false; await look(); continue; }
      if (answers.some((ans) => isCorrect(ans, given))) break;
      firstTry = false;
      misses++;
      if (misses === 1) await look('Here it is again.');
    }
    stopSpeaking();
  }

  // Her slowest facts after the lesson (engine/session.js factPractice), in rounds; a miss gets the usual free
  // correction.
  async factPractice(list) {
    await this.factGoal();
    for (const round of inRounds(list)) {
      for (let i = 0; i < round.length; i++) {
        await this.ask(this.make(round[i].skill, { key: round[i].key }), 'practice', { title: 'Facts', progress: { i, n: round.length } });
      }
      await this.roundEnd('facts', round.length);
    }
  }

  factGoal() {
    return this.waitFor((resolve) => {
      const heading = 'Facts practice';
      const line = 'Your slowest facts, a few at a time. Take your time; there\'s no clock.';
      this.frame('Facts', null,
        h('div', { class: 'card stack center' }, h('h2', {}, heading), h('p', {}, line)),
        h('button', { class: 'btn big', onclick: resolve }, 'Start'));
      this.say(`${heading}. ${line}`);
    });
  }

  // A second way beside hers on the same sum (research 4.1: shown side by side, she chooses): each way's steps, hers
  // first and a step at a time, which takes fewer, and her choice, kept (engine/methods.js); then one more her way, with
  // the last step hers (for a facts skill, on another fact she knows that her way fits, not the one she has just seen
  // answered). The sum is one both
  // ways fit (opts.also: counting up works only a subtraction, partitioning one with no trades), and her own go is on
  // one her way fits, of the same operation (opts.op: a subtraction after a subtraction); if a sum is not worked both
  // ways after all, nothing is shown and nothing kept.
  // A division fact's ways (sum, op '÷') are set side by side on that division, and her choice is kept as her ÷ way, apart
  // from her × way (engine/methods.js preferredMethod).
  // A skill whose generator builds its steps (engine/items/ways.js) has second ways for some kinds of problem only: where
  // hers and the other never fit the same kind (adding the values, the place value chart), hers on that kind is the way she
  // learned, so that is set beside the other; set beside the way she learned, hers is drawn on a problem it fits; and her
  // own go is another of the same kind.
  async compare({ skill, mine, other, key, sum, op, again = false }) {
    const family = Boolean(METHODS[other]?.fromGenerator);
    let first = this.make(skill, sum ? { sum, method: mine } : key ? { key, form: 0, method: mine } : { plain: true, method: mine, also: family && other === LEARNED ? mine : other });
    // fifty draws can end on a problem hers fits and the other does not: that too sets the way she learned beside the other
    if (family && mine !== LEARNED && other !== LEARNED && (first.method !== mine || !first.sum.ways.includes(other))) first = this.make(skill, { plain: true, method: LEARNED, also: other });
    const second = this.make(skill, { sum: first.sum, method: other });
    if ((first.method !== mine && !(family && first.method === LEARNED && other !== LEARNED)) || second.method !== other) return;
    // where hers could not be drawn, the way she learned stands in for it, and is not called hers
    const chosen = await this.askWay([first, second], { hers: first.method === mine });
    this.store.add('method-choice', { skill, shown: [first.method, other], chosen, again, ...(op === '÷' ? { op } : {}) });
    const next = sum ? { sum: this.anotherDivision(skill, key, sum, chosen) } : key ? { key: this.anotherFact(skill, key, chosen), form: 0 }
      : family ? { plain: true, also: chosen, key: first.sum.shape } : { plain: true, also: chosen, op: first.sum.op };
    await this.worked(this.make(skill, { ...next, method: chosen }), 1, 'Your way');
  }

  anotherFact(skill, key, method) {
    const facts = computeState(this.store.events)[skill].facts;
    const fit = Object.keys(facts).filter((k) => k !== key && facts[k].known && METHODS[method].fits({ op: '×', a: +k.split('x')[0], b: +k.split('x')[1] }));
    return fit.length ? this.rng.pick(fit) : key;
  }

  // a division of another fact she knows that her chosen ÷ way fits, else the same one
  anotherDivision(skill, key, sum, method) {
    const facts = computeState(this.store.events)[skill].facts;
    const fit = Object.keys(facts).filter((k) => k !== key && facts[k].known).flatMap((k) => {
      const [a, b] = k.split('x').map(Number);
      return [...new Set([a, b].filter((f) => f > 0))].map((d) => ({ op: '÷', n: a * b, d }));
    }).filter((s) => METHODS[method].fits(s));
    return fit.length ? this.rng.pick(fit) : sum;
  }

  // The two ways one at a time (research 2.1: one step, a sentence or two; she glazes after about 20 seconds of talk):
  // her way first, each step said as it appears and a tap to go on, as in a worked example; then the other way the same.
  // Both then stay side by side, which takes fewer steps is said, and she chooses.
  // A skill whose generator builds its own steps (engine/items/ways.js) has no sum to name: the heading is "Two ways to do
  // this one" with the problem under it, and the steps both ways begin with (a word problem's prompt card) are shown once,
  // above the two ways, at most all but one of the shorter way's; where the two ways ask it differently (an estimate by
  // bounds or by compatible numbers), each way shows its own question above its steps.
  async askWay(items, { hers = true } = {}) {
    const { sum } = items[0];
    const family = FAMILY_OPS.has(sum.op);
    // a number sentence of the equals path is shown whole, its box and all; a decimal sum (stage 6: rep, cmp, d+ and the
    // rest, whose numbers are text) is "this one" with the problem under it, as a generator's own steps are
    const named = !family && WHOLE_OPS.includes(sum.op) && (sum.op === '=' || sum.op === '÷' || ('a' in sum && 'b' in sum));
    const said = !named ? null : sum.op === '=' ? items[0].ask : sum.op === '÷' ? `${fmt(sum.n)} ÷ ${sum.d}` : `${fmt(sum.a)} ${sum.op} ${fmt(sum.b)}`;
    const heading = named ? `Two ways to do ${said}` : 'Two ways to do this one';
    const twoAsks = family && items[0].ask !== items[1].ask;
    const same = (x, y) => x.text === y.text && x.value === y.value;
    // where each way asks it its own way, nothing is shown above the two, so a step never comes before its question; a
    // decimal adding or taking away has the same estimate in both ways (engine/methods.js wayFor), first, or in a story after
    // "What do we know?", so it and the steps before it are shown once
    let both = 0;
    if ((family && !twoAsks) || items.every((it) => it.steps.some((s) => s.opening))) {
      const most = Math.min(items[0].steps.length, items[1].steps.length) - 1;
      while (both < most && same(items[0].steps[both], items[1].steps[both])) both++;
    }
    const sharedSteps = items[0].steps.slice(0, both);
    const own = items.map((it) => it.steps.slice(both));
    const names = items.map((it) => wayTitle(it.method, it.sum)); // a way's name on this sum (engine/methods.js wayTitle)
    // each way's steps are the lines she reads, so "3 steps" sits over three lines; the steps both share are not counted
    const counts = own.map((st) => st.length);
    const steps = (n) => `${n} step${n === 1 ? '' : 's'}`;
    const [few, more] = counts[1] < counts[0] ? [1, 0] : [0, 1];
    const line = counts[0] === counts[1] ? `Both take ${steps(counts[0])}.` : `${names[few]} takes ${steps(counts[few])}; ${lowerFirst(names[more])} takes ${steps(counts[more])}.`;
    const question = 'Which way will you use?';
    const openings = [hers ? `Your way first: ${lowerFirst(names[0])}.` : `First: ${lowerFirst(names[0])}.`, `Now another way: ${lowerFirst(names[1])}.`];
    let opening = `${heading}. `;
    // a picture both ways share (a facts array) is shown once, above them
    const shared = JSON.stringify(items[0].picture) === JSON.stringify(items[1].picture);
    const lists = items.map(() => h('ol', { class: 'steps' }));
    const bothList = sharedSteps.length ? h('ol', { class: 'steps' }) : null;
    // a percentage way's card with no picture of its own draws its first step picture that is not the one at the top
    // (the line's line, out of 100's strip filled in), its steps here being shown worked (stage 6 step 3.2's looker, F2,
    // the lead's ruling R12); a fraction's, a decimal's and a whole number's as before
    const top = shared ? JSON.stringify(items[0].picture) : null;
    const stepPicture = (it) => (PERCENT_OPS.has(sum.op) ? it.steps.find((s) => s.picture && JSON.stringify(s.picture) !== top)?.picture : null);
    const cardPicture = (it) => {
      const own = shared ? null : this.picture(it), step = own ? null : stepPicture(it);
      return own ?? (step ? this.picture({ picture: step }) : null);
    };
    const way = (it, i) => h('div', { class: 'card stack way' },
      h('h3', {}, names[i]),
      h('div', { class: 'muted small' }, i === 0 && hers ? `Your way · ${steps(counts[i])}` : steps(counts[i])),
      twoAsks ? h('p', {}, ...shownAsk(it)) : null,
      cardPicture(it),
      lists[i]);
    const ways = h('div', { class: 'ways' });
    const area = h('div', { class: 'stack' });
    // a shared picture of strips or a tape (a fraction's) docked under the top edge, as the question's is (askOnly), the
    // two cards and their steps sliding under it and every scroll here (follow) stopping at its bottom (pt61, the lead's
    // ruling R12); any other on the card, as before
    const picture = shared ? this.picture(items[0]) : null;
    const docked = picture != null && items[0].picture.type === 'strips';
    if (docked) picture.classList.add('docked');
    this.frame('Another way', null, docked ? picture : null, h('div', { class: 'card stack center' }, h('h2', {}, heading),
      !named && !twoAsks ? h('p', {}, ...shownAsk(items[0])) : null, docked ? null : picture, bothList), ways, area);
    const now = () => this.root.querySelectorAll('li.now').forEach((x) => x.classList.remove('now'));
    for (const [j, s] of sharedSteps.entries()) {
      now();
      // a decimal sum's estimate, its first step, takes its words for both ways (engine/methods.js estimateOf, opening):
      // "For both ways, about how big is 6 − 2? About 4.", so "First" is never said twice; a story's comes after its prompt
      // card, which said "First", so it shows and says its own step, "About how big? Each to the nearest tenth: …"
      // a fraction estimate's opening drawn as every step is, its fractions stacked (stage 6 step 2.4, the replay)
      const opens = j === 0 && s.opening;
      bothList.append(h('li', { class: 'now' }, ...(opens ? fracNodes(s.opening.charAt(0).toUpperCase() + s.opening.slice(1)) : fill(s.text, s.value))));
      this.say(opens ? `${opening}For both ways, ${s.opening}` : `${j === 0 ? `${opening}First, for both ways. ` : ''}${stepWords(s, true)}`);
      opening = '';
      await this.tapNext(area, 'Next');
    }
    for (const [i, it] of items.entries()) {
      ways.append(way(it, i));
      for (const [j, s] of own[i].entries()) {
        // a way's opening is said with its first step where the two fit in 25 words as said (research 2.1), else on its own
        // first (partitioning's "Put the parts together: 6 + 0.8 + 0.09 + 0.006 = 6.896" is 22 of them)
        const lead = j === 0 ? `${opening}${openings[i]}` : '';
        const alone = lead && wordsIn(`${lead} ${stepWords(s, true)}`) > MOST_SAID;
        if (alone) {
          this.say(lead);
          await this.tapNext(area, 'Next');
        }
        now();
        lists[i].append(h('li', { class: 'now' }, ...fill(s.text, s.value)));
        this.say(lead && !alone ? `${lead} ${stepWords(s, true)}` : stepWords(s, true));
        if (j === 0) opening = '';
        await this.tapNext(area, i === items.length - 1 && j === own[i].length - 1 ? 'Got it' : 'Next');
      }
    }
    now();
    return this.waitFor((resolve) => {
      area.replaceChildren(h('p', { class: 'center' }, line),
        h('p', { class: 'center', style: 'font-weight:650' }, question),
        h('div', { class: 'stack' }, items.map((it, i) => h('button', { class: 'btn big', onclick: () => resolve(it.method) }, names[i]))));
      this.follow(area);
      this.say(`${line} ${question}`);
    });
  }

  intro(sk) {
    return this.waitFor((resolve) => {
      this.frame('Something new', null,
        h('div', { class: 'card stack' },
          h('h2', {}, sk.title),
          sk.strategy ? h('p', {}, sk.strategy) : null,
          h('p', { class: 'muted' }, 'Watch one, finish one, then do one yourself.')),
        h('button', { class: 'btn big', onclick: resolve }, 'Show me'));
      this.say(`${sk.title}. ${sk.strategy ?? ''} Watch one, finish one, then do one yourself.`);
    });
  }

  // Her own rating of the session so far, before she sees the result (engine/rating.js, research 7.3), of the problems
  // she did on her own: one she asked a step for is left out.
  async rate() {
    const { right, helped = 0 } = this.count;
    const done = this.count.done - helped;
    if (done < RATE_FROM) return;
    const guess = await this.askRating();
    const r = { guess, band: bandOf(right, done), right, done };
    this.store.add('rating', r);
    await this.showRating(r);
  }

  askRating() {
    return this.waitFor((resolve) => {
      this.frame('Before you look', null,
        h('div', { class: 'card stack center' }, h('h2', {}, 'How many do you think you got right first time?')),
        h('div', { class: 'stack' }, BANDS.map((b) => h('button', { class: 'btn plain big', onclick: () => resolve(b.id) }, b.text))));
      this.say(`How many do you think you got right first time? ${orList(BANDS.map((b) => b.text))}?`);
    });
  }

  showRating({ guess, band, right, done }) {
    const said = BANDS.find((b) => b.id === guess).text.toLowerCase();
    const at = BANDS.findIndex((b) => b.id === band) - BANDS.findIndex((b) => b.id === guess);
    const line = at === 0 ? 'Spot on.' : at < 0 ? 'Better than you thought.' : 'A few more slipped than you thought.';
    return this.waitFor((resolve) => {
      this.frame('How you did', null,
        h('div', { class: 'card stack center' }, h('h2', {}, line), h('p', {}, `You said ${said}. You got ${right} of ${done} right first time.`)),
        h('button', { class: 'btn big', onclick: resolve }, 'Keep going'));
      this.say(withoutNumbers(`${line} You said ${said}. You got ${right} of ${done} right first time.`));
    });
  }

  // The end of a round: a reward straight away, a different one from last time, and a line naming what she did in it
  // (engine/rounds.js); her count stays on the screen, unsaid.
  async roundEnd(part, size) {
    const reward = pickReward(this.store.events, this.rng);
    this.store.add('round', { part, size, reward: reward.id });
    const done = this.round;
    this.round = [];
    await this.showReward(reward, done);
  }

  showReward(reward, done = []) {
    sound.reward(reward.sound);
    const line = didLine(done) || 'Round done.';
    return this.waitFor((resolve) => {
      this.frame('', null, h('div', { class: 'card stack center reward' }, h('div', { class: 'reward-icon', 'aria-hidden': 'true' }, reward.icon),
        h('h2', {}, line), h('p', {}, reward.line), done.length ? h('p', { class: 'muted small' }, didCount(done)) : null),
        h('button', { class: 'btn big', onclick: resolve }, 'Keep going'));
      this.say(`${line} ${reward.line}`);
    });
  }

  celebrate(line, sub) {
    sound.done();
    return this.waitFor((resolve) => {
      this.frame('', null, h('div', { class: 'card stack center' }, h('h2', {}, line), sub ? h('p', { class: 'muted' }, sub) : null),
        h('button', { class: 'btn big', onclick: resolve }, 'Keep going'));
      this.say(`${line} ${sub ?? ''}`);
    });
  }

  // The one-minute sprint: known facts only, a calm visible timer that waits while she types a fix, score = number right
  // first time. What good looks like comes first, her best as the score to reach, and her best stays beside her score
  // (research 7.2).
  // A sprint's next problem: a known fact, or a learned sprint skill's problem in the tables she knows.
  sprintPick(pool) {
    if (pool.facts.length && (!pool.skills.length || this.rng.chance(0.75))) {
      const f = this.weightedFact(pool.facts);
      return makeItem(f.skill, this.rng, { key: f.key });
    }
    const skill = this.rng.pick(pool.skills).skill;
    return makeItem(skill, this.rng, this.byTables(skill));
  }

  async sprint(pool, best) {
    const items = [];
    const pickItem = () => this.sprintPick(pool);
    await this.waitFor((resolve) => {
      const heading = best ? `Your best: ${best}` : 'Your first sprint';
      const lines = ['Get as many right as you can in one minute, all facts you know.',
        best ? 'Good is your best or more; right matters more than fast.' : 'Good is getting each one right; speed comes with practice.'];
      this.frame('One-minute sprint', null,
        h('div', { class: 'card stack center' }, h('h2', {}, heading), h('p', {}, lines[0]), h('p', { class: 'muted small' }, lines[1])),
        h('button', { class: 'btn big', onclick: resolve }, 'Go'));
      this.say(withoutNumbers(`${heading}. ${lines.join(' ')}`));
    });
    // the minute's end, moved on by the time she spends typing a fix after a miss (sprintItem)
    const clock = { end: performance.now() + SPRINT_MS, stoppedAt: null };
    let score = 0;
    let wrong = 0;
    const retry = [];
    const timer = h('div', { class: 'timer' }, h('div'));
    const tick = this.every(() => {
      const left = Math.max(0, clock.end - (clock.stoppedAt ?? performance.now()));
      const bar = timer.firstChild;
      if (bar) bar.style.transform = `scaleX(${left / SPRINT_MS})`;
    }, 250);
    while (performance.now() < clock.end) {
      const item = retry.length && this.rng.chance(0.5) ? retry.shift() : pickItem();
      items.push(item);
      const r = await this.sprintItem(item, timer, score, clock, best);
      if (r === 'timeout') break;
      if (r) score++; else { wrong++; retry.push(makeItem(item.skill, this.rng, { key: item.key, ...this.byTables(item.skill) })); }
    }
    this.cancel(tick);
    // stopped part-way, it never gets here, so it is not kept as a minute's sprint (her answers in it are)
    this.store.add('sprint', { score, wrong, skills: [...new Set(items.map((i) => i.skill))] });
    return { score, wrong };
  }

  weightedFact(facts) {
    // slower and newer facts come up more often (as Times Tables Rock Stars does)
    const st = computeState(this.store.events);
    const weights = facts.map((f) => {
      const x = st[f.skill].facts[f.key];
      return 1 + (x.lastMs == null ? 2 : Math.min(4, x.lastMs / FAST_MS)) + (x.fastDays.size < 3 ? 1 : 0);
    });
    let r = this.rng.next() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < facts.length; i++) { r -= weights[i]; if (r <= 0) return facts[i]; }
    return facts[facts.length - 1];
  }

  // clock: { end } of the minute. After a miss the clock waits while she types the fix (research 3.5: a miss costs her
  // nothing, time included), and goes on once she has.
  sprintItem(item, timer, score, clock, best = 0) {
    return this.waitFor((resolve) => {
      const started = performance.now();
      let fixing = false;
      const fb = h('div', { class: 'feedback' });
      const left = this.later(() => { widget.destroy(); resolve('timeout'); }, Math.max(0, clock.end - performance.now()));
      const widget = answerWidget(item, {
        mode: 'sprint',
        onSubmit: (given) => {
          const ok = isCorrect(item.answer, given);
          if (!fixing) {
            const ms = Math.round(performance.now() - started);
            this.store.add('answer', { skill: item.skill, key: item.key, phase: 'sprint', correct: ok, firstTry: ok, ms });
            this.count.done++;
            if (ok) this.count.right++;
            if (ok) { sound.right(); this.cancel(left); widget.destroy(); resolve(true); return; }
            fixing = true;
            this.cancel(left);
            clock.stoppedAt = performance.now();
            timer.classList.add('waiting');
            fb.className = 'feedback hint';
            fb.textContent = `${item.ask.replace('☐', answerText(item.answer))}. Type it.`;
            this.say(fb.textContent);
            widget.clear();
          } else if (ok) {
            clock.end += performance.now() - clock.stoppedAt;
            clock.stoppedAt = null;
            timer.classList.remove('waiting');
            widget.destroy(); resolve(false);
          } else {
            widget.clear();
          }
        },
      });
      this.frame('Sprint', null, timer, h('div', { class: 'score' }, best ? `${score} right · best ${best}` : `${score} right`), widget.el, fb);
    });
  }

  // ---- placement: a sitting of a few probes, untimed, no marks shown ----
  async placementSitting(pool) {
    const p = placementFromEvents(this.store.events, pool);
    await this.waitFor((resolve) => {
      const line = 'This finds out what to teach you next. There\'s no score, and it\'s fine to tap "I haven\'t learned this yet".';
      this.frame('Where you\'re up to', null,
        h('div', { class: 'card stack' }, h('p', {}, line)),
        h('button', { class: 'btn big', onclick: resolve }, 'Start'));
      this.say(line);
    });
    for (let n = 0; n < SITTING_PROBES && !placementDone(p); n++) {
      const id = nextProbe(p);
      let right = 0;
      for (let i = 0; i < PROBE_ITEMS; i++) {
        const r = await this.ask(makeItem(id, this.rng, {}), 'placement', { title: 'Where you\'re up to', progress: (n * PROBE_ITEMS + i) / (SITTING_PROBES * PROBE_ITEMS) });
        if (r.firstTry) right++;
        const still = PROBE_ITEMS - (i + 1);
        if (right >= PROBE_PASS || right + still < PROBE_PASS) break; // already settled: fewer questions
      }
      const { settled } = applyProbe(p, id, right);
      for (const s of settled) this.store.add('placed', s);
    }
    return placementDone(p);
  }
}

// The values that make up an item's answer: a number or a decimal, a fraction's numerator (its last step's box, "So 3/8 +
// 2/8 = ☐/8"), a remainder answer's quotient and remainder, or a choice that is a number (the "32" of "Which is right:
// (2 + 6) × 4 = 26 or 32?", worked out in a step "8 × 4 = ☐").
function answerParts(item) {
  const a = item.answer;
  return a.kind === 'number' || a.kind === 'decimal' ? [a.value] : a.kind === 'fraction' ? [a.n] : a.kind === 'remainder' ? [a.quotient, a.remainder]
    : a.kind === 'choice' && /^\d+$/.test(a.value) ? [Number(a.value)] : [];
}


// What she is told to put in after a second miss, when the rebuild has not ended on the answer (copyAnswer), and the
// line voiced for it (tools/voice-lines.mjs): a number is written, "Write 12"; a choice or an order is tapped, "Tap 6.65",
// "Tap true", "Tap 0.38, 0.4, 0.5", and a choice whose answer is a sentence (why a way suits the numbers, stage 6) has a
// colon before it: "Tap: No place needs a trade, …".
export function copyLine(answer) {
  if (answer.kind === 'order') return `Tap ${answerText(answer)}`;
  if (answer.kind !== 'choice') return `Write ${answerText(answer)}`;
  return `${/[.?!]$/.test(String(answer.value)) ? 'Tap:' : 'Tap'} ${answerText(answer)}`;
}

// How far down to scroll a screen height tall so end's bottom is on it, but never so far that top's start goes above
// floor (the screen's top, or a docked picture's bottom): the smaller of the two, in whole pixels as WebKit scrolls
// (end's rounded up, top's down), and 0 when end's bottom is on the screen already. Measured from the screen's top.
export function padScroll(end, top, height, floor = 0) {
  return Math.max(0, Math.min(Math.ceil(end.bottom - height), Math.floor(top.top - floor)));
}

// A step's own picture, beside it: as it is where the step is shown worked, and where she fills the step (mine) as a
// question would show it (asked), so a two-step story's columns never show the result she is asked for (stage 6 plan
// D7); a picture marked working is the way's own picture of that step, left off the question only, so it is shown as
// it is (a fraction way's strips or line, which the step speaks of: stage 6 step 2.3 review, finding 3).
function ownPicture(item, step, mine) {
  return mine && !step.picture.working ? asked({ ...item, picture: step.picture }) : { picture: step.picture };
}

// The last step as "Show me one step" shows it, its box empty: a remainder answer's last step prints the quotient
// ("So 394 ÷ 5 = 78 remainder ☐", and the biggest multiple's "78 groups of 5, and 4 left over"), so it is shown as the
// question itself, both boxes empty, with the remainder in words as every worked step writes it ("So 394 ÷ 5 = ☐
// remainder ☐").
function lastStep(item, s) {
  return item.answer.kind === 'remainder' ? `So ${item.ask.replace(/☐ r ☐/, '☐ remainder ☐')}` : s.text;
}

// Lines said one after another, each a sentence of its own: one with no stop of its own ends in one before the next
// ("… = 441. Take away 40 × 9 = ☐"), so the voice pauses there and finds each sentence's sound file.
function inTurn(lines) {
  return lines.map((t, i) => (i === lines.length - 1 || /[.!?]$/.test(t) ? t : `${t.replace(/[\s:;,]+$/, '')}.`)).join(' ');
}

// A hint, or the line she copies, written into its place with its fractions stacked (fracNodes), its words as before.
function writeIn(el, text) {
  el.replaceChildren(...fracNodes(text));
}

// A question on the two ways' card, not answered there, its fractions stacked: a fraction way's with its ☐ as "?", as the
// question cards show it; any other as before, its ☐ and all (a decimal's "1/100 of 60.9 = ☐").
function shownAsk(item) {
  return fracNodes(item.method in FRACTION_WAYS ? item.ask.replaceAll('☐', '?') : item.ask);
}

// Step text with ☐ shown as its value, or as an empty box to fill, its fractions stacked: the ☐ of "☐/8" inside the
// numerator (fracNodes), never beside "/8"; a number sentence with a "%" kept on one line, as in a step (fracNodes step).
function fill(text, value) {
  return fracNodes(text, () => (value == null ? h('span', { class: 'box on' }, ' ') : h('b', {}, fmt(value))), { step: true });
}

// A step as said: with its value, or with "what" where she fills it in (js/speech.js turns the symbols into words).
export function stepWords(s, withValue) {
  return withValue && 'value' in s ? s.text.replace('☐', String(s.value)) : s.text;
}

// "a, b, or c"
export function orList(options) {
  return options.length < 2 ? options.join('') : `${options.slice(0, -1).join(', ')}, or ${options.at(-1)}`;
}
