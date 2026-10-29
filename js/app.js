// The game's screens: welcome, home, today's session, the story, her map, and settings. There is no parent's
// corner: the game teaches and measures her by itself (decided 17 October 2026).

import { h, show, topBar } from './ui.js';
import { Runner } from './runner.js';
import * as sound from './sound.js';
import { speak, stop as stopSpeaking, canSpeak, instruct, withoutNumbers, loadClips, useReadAloud } from './speech.js';
import { approved, loadStories, loadScene, sceneToHtml, currentStory, nextScene, scenesRead } from './story.js';
import { Store } from '../engine/store.js';
import { BY_ID, inRelease, pathsIn } from '../engine/skills.js';
import { computeState, dayOf, masteredCount, mapStatus } from '../engine/mastery.js';
import { planSession } from '../engine/session.js';
import { progressFile } from '../engine/measures.js';
import { placementFromEvents, isDone as placementDone } from '../engine/placement.js';
import { makeRng } from '../engine/rng.js';
import { didLine, PART_WAY } from '../engine/rounds.js';

export const RELEASE = 4;
const root = document.getElementById('app');
const params = new URLSearchParams(location.search);
const preview = params.has('preview'); // shows stories not yet approved
window.__preview = preview;
const store = new Store(window.localStorage);
let stories = [];

const releaseSkills = () => inRelease(RELEASE).map((s) => s.id);
const hero = () => [...store.events].reverse().find((e) => e.type === 'hero')?.name || '';
const bestSprint = () => Math.max(0, ...store.events.filter((e) => e.type === 'sprint').map((e) => e.score));
const placementFinished = () => placementDone(placementFromEvents(store.events, releaseSkills()));

// Every instruction read aloud, and again after a pause (js/speech.js; research 6.15, 2.1).
const say = (text) => { if (store.settings.readAloud) instruct(text); };

function applySettings() {
  sound.setSound(store.settings.sound);
  useReadAloud(store.settings.readAloud);
}

async function boot() {
  applySettings();
  const [all] = await Promise.all([loadStories(), loadClips()]);
  stories = all.filter((s) => approved(s) || preview);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  route();
}

function route() {
  stopSpeaking();
  if (!hero()) return welcome();
  return home();
}

// ---- welcome ----
function welcome() {
  const input = h('input', { class: 'text', placeholder: 'Your hero\'s name', autocomplete: 'off', maxlength: 24 });
  const go = () => {
    const name = input.value.trim();
    if (!name) return input.focus();
    store.add('hero', { name });
    home();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  const lines = ['You are the hero of its story, and a new part opens each day you finish.', 'What should your hero be called?'];
  const words = `This is your maths game. ${lines.join(' ')}`;
  show(root,
    topBar('Welcome'),
    h('div', { class: 'card stack' },
      h('h2', {}, 'This is your maths game.'),
      ...lines.map((l) => h('p', {}, l)),
      input),
    h('button', { class: 'btn big', onclick: go }, 'That\'s me'),
    // a browser will not speak before the first tap, so the first screen also has a button to hear it
    canSpeak() && store.settings.readAloud ? h('button', { class: 'btn plain', onclick: () => say(words) }, '🔊 Read it to me') : null);
  say(words);
  input.focus();
}

// ---- home ----
export function home() {
  const st = computeState(store.events);
  const placed = placementFinished();
  const story = stories.find((s) => s.id === currentStory(store.events));
  const scene = nextScene(store.events, story);
  const doneToday = store.events.some((e) => e.type === 'session' && e.phase === 'end' && dayOf(e.t) === dayOf(Date.now()));
  const shown = inRelease(RELEASE);
  const mastered = masteredCount(st, shown);
  const best = bestSprint();

  const mainBtn = !placed
    ? h('button', { class: 'btn big', onclick: () => placementSession() }, doneToday ? 'Do a bit more finding out' : 'Find where I\'m up to (about 5 minutes)')
    : h('button', { class: 'btn big', onclick: () => todaysSession() }, doneToday ? 'Another session' : 'Today\'s session');

  let storyCard;
  if (!stories.length) storyCard = null;
  else if (!story) storyCard = h('div', { class: 'card stack' }, h('h2', {}, 'Your story'),
    doneToday ? h('button', { class: 'btn', onclick: chooseStory }, 'Choose your story') : h('p', { class: 'muted' }, 'Finish today\'s maths to choose your story.'));
  else storyCard = h('div', { class: 'card stack' }, h('h2', {}, story.title),
    scene ? h('button', { class: 'btn', onclick: () => readScene(story, scene) }, 'Read the next scene')
      : h('p', { class: 'muted' }, doneToday ? 'You\'ve read today\'s scene. The next one opens tomorrow.' : 'Finish today\'s maths to open the next scene.'),
    scenesRead(store.events, story.id).size ? h('button', { class: 'btn quiet', onclick: () => storyShelf(story) }, 'Read earlier scenes') : null);

  show(root,
    topBar(hero() ? `Hi, ${hero()}` : 'Maths', { right: h('button', { class: 'iconbtn', 'aria-label': 'Settings', onclick: settings }, '⚙︎') }),
    mainBtn,
    storyCard,
    h('div', { class: 'card stats' },
      h('div', {}, h('div', { class: 'muted small' }, 'Skills mastered'), h('div', { class: 'stat' }, `${mastered} of ${shown.length}`)),
      h('div', {}, h('div', { class: 'muted small' }, 'Best sprint'), h('div', { class: 'stat' }, best ? String(best) : '–'))),
    h('button', { class: 'btn quiet', onclick: myMap }, 'My map'));
}

// ---- sessions ----
// A session, or her "Stop here for today" on any of its screens (js/runner.js), whichever comes first: true if she
// stopped. Stopping ends it as finishing does: the day counts, its scene opens, and the summary shows what she did.
function orStop(runner, session) {
  const stopped = new Promise((resolve) => { runner.onStop = () => resolve(true); }); // before its first screen is drawn
  return Promise.race([stopped, session().then(() => false)]);
}

async function placementSession() {
  const runner = new Runner(root, store, { readAloud: store.settings.readAloud });
  store.add('session', { phase: 'start', kind: 'placement' });
  let finished = false;
  const stopped = await orStop(runner, async () => { finished = await runner.placementSitting(releaseSkills()); });
  store.add('session', { phase: 'end', kind: 'placement', done: runner.count.done, ...(stopped ? { stopped: true } : {}) });
  await summary(runner, finished
    ? 'That\'s it, the game knows where you\'re up to. Tomorrow the real lessons start.'
    : 'Thanks! That\'s enough finding out for today. A bit more tomorrow.');
}

async function todaysSession() {
  const runner = new Runner(root, store, { readAloud: store.settings.readAloud });
  const last = [...store.events].reverse().find((e) => e.type === 'session' && e.path);
  const plan = planSession(computeState(store.events), Date.now(), makeRng(`${store.device}${Date.now()}`), { lastPath: last?.path ?? null, release: RELEASE, events: store.events });
  store.add('session', { phase: 'start', kind: 'lesson', path: plan.learn ? BY_ID[plan.learn.skill].path : null });
  const before = factBests();
  const stopped = await orStop(runner, async () => {
    await runner.lesson(plan);
    if (plan.sprint.ready && await offerSprint(runner)) {
      const r = await runner.sprint(plan.sprint, bestSprint());
      await sprintResult(r, runner);
    }
  });
  store.add('session', { phase: 'end', kind: 'lesson', done: runner.count.done, ...(stopped ? { stopped: true } : {}) });
  await summary(runner, null, before, { stopped });
}

// The sprint's offer and its result are screens of the session, drawn by its runner, so each has "Stop here for today" and
// stops as every other screen does (runner.frame, runner.waitFor). A runner outside a session (a test, the tools) has none.
const outside = () => new Runner(root, store, { readAloud: store.settings.readAloud });

export function offerSprint(runner = outside()) {
  return runner.waitFor((resolve) => {
    runner.frame('One more thing?', null,
      h('div', { class: 'card stack center' }, h('h2', {}, 'A one-minute sprint?'), h('p', { class: 'muted' }, bestSprint() ? `Your best is ${bestSprint()}. Only facts you know.` : 'Only facts you know.')),
      h('button', { class: 'btn big', onclick: () => resolve(true) }, 'Yes, let\'s go'),
      h('button', { class: 'btn plain', onclick: () => resolve(false) }, 'Not today'));
    say(withoutNumbers(`A one-minute sprint? ${bestSprint() ? `Your best is ${bestSprint()}. ` : ''}Only facts you know.`));
  });
}

// The sprint's result: her score, against her best before it (tools/voice-lines.mjs voices each one's words).
export function sprintLine(score, previousBest, first) {
  return first ? `${score} right. That's your score to beat next time.`
    : score > previousBest ? `${score} right. A new best! (It was ${previousBest}.)`
    : score === previousBest ? `${score} right. You matched your best.`
    : `${score} right. Your best is ${previousBest}. Facts you practise get faster.`;
}

export function sprintResult({ score }, runner = outside()) {
  const sprints = store.events.filter((e) => e.type === 'sprint');
  const previousBest = Math.max(0, ...sprints.slice(0, -1).map((e) => e.score));
  const line = sprintLine(score, previousBest, sprints.length === 1);
  if (score > previousBest) sound.done();
  return runner.waitFor((resolve) => {
    runner.frame('Sprint', null,
      h('div', { class: 'card stack center' }, h('h2', {}, line)),
      h('button', { class: 'btn big', onclick: resolve }, 'Done'));
    say(withoutNumbers(line));
  });
}

// Fastest right answer for each fact so far, to show what got faster today (feedback on progress, not prizes). A new
// fact typed whole from memory (phase 'flash') is left out: three numbers take longer than one answer.
function factBests() {
  const best = {};
  for (const e of store.events) {
    if (e.type !== 'answer' || e.phase === 'flash' || !e.correct || !e.firstTry || e.ms == null || !e.key || !/^\d+x\d+$/.test(e.key)) continue;
    if (best[e.key] == null || e.ms < best[e.key]) best[e.key] = e.ms;
  }
  return best;
}

// The day's summary. Stopped early, a warm line comes first, then what she did, as at the end of a whole session: said in
// words (engine/rounds.js didLine), with her counts on the screen. The placement check marks nothing, so has neither.
export function summary(runner, line, before = null, { stopped = false } = {}) {
  const { done, right } = runner.count;
  const did = `You worked through ${done} problem${done === 1 ? '' : 's'}.`;
  const heading = line || (stopped ? 'A good place to stop.' : did);
  // stopped part-way through a problem's steps before any was finished: the steps she worked out herself
  const what = line ? '' : didLine(runner.record ?? []) || (runner.count.steps ? PART_WAY : '');
  const counts = line ? [] : [what, stopped && done ? did : '', right ? `${right} right first time.` : ''].filter(Boolean);
  const lines = [];
  if (before) {
    const after = factBests();
    const faster = Object.keys(after).filter((k) => before[k] != null && after[k] < before[k] - 300)
      .sort((a, b) => (before[b] - after[b]) - (before[a] - after[a])).slice(0, 3);
    for (const k of faster) {
      const [a, b] = k.split('x');
      lines.push(`${a} × ${b}: ${(before[k] / 1000).toFixed(1)} s → ${(after[k] / 1000).toFixed(1)} s`);
    }
  }
  const story = stories.find((s) => s.id === currentStory(store.events));
  return new Promise((resolve) => {
    show(root, topBar('Done for today'),
      h('div', { class: 'card stack' },
        h('h2', {}, heading),
        ...counts.map((c) => h('p', {}, c)),
        lines.length ? h('div', {}, h('p', { class: 'muted small' }, 'Getting faster:'), ...lines.map((l) => h('p', { style: 'margin:4px 0;font-weight:600' }, l))) : null),
      stories.length && (!story || nextScene(store.events, story)) ? h('button', { class: 'btn big', onclick: () => { resolve(); story ? readScene(story, nextScene(store.events, story)) : chooseStory(); } },
        story ? 'Read today\'s scene' : 'Choose your story') : null,
      h('button', { class: 'btn plain', onclick: () => { resolve(); home(); } }, 'Home'));
    // the counts and the facts' times stay on the screen; the rest is said
    say(withoutNumbers(['Done for today.', heading, ...counts, lines.length ? `Getting faster. ${lines.join('. ')}.` : ''].join(' ')));
  });
}

// ---- the story ----
export function chooseStory() {
  const intro = 'Choose the one you most want to find out about. The others will still be here.';
  show(root, topBar('Choose your story', { back: home }),
    h('p', { class: 'muted' }, intro),
    ...stories.map((s) => h('div', { class: 'card stack' },
      h('div', { class: 'muted small' }, s.kind), h('h2', {}, s.title), h('p', {}, s.blurb),
      h('button', { class: 'btn', onclick: () => { store.add('pick-story', { story: s.id }); readScene(s, nextScene(store.events, s)); } }, 'This one'))));
  say([intro, ...stories.map((s) => `${s.title}, ${s.kind.toLowerCase()}: ${s.blurb}`)].join(' '));
}

async function readScene(story, file) {
  if (!file) return home();
  const theme = document.getElementById('story-theme');
  theme.href = `stories/${story.id}/theme.css`;
  const md = await loadScene(story.id, file).catch(() => null);
  if (!md) return home();
  const body = h('div', { class: 'story', html: sceneToHtml(md, hero()) });
  const paragraphs = [...body.querySelectorAll('p:not(.scene)')];
  let reading = false;
  const who = story.voice ?? 'narrator'; // a story is read by its own character, never in the guide's files
  const readBtn = canSpeak(who) && store.settings.readAloud ? h('button', { class: 'btn plain', onclick: () => {
    if (reading) { stopSpeaking(); reading = false; readBtn.textContent = '🔊 Read it to me'; return; }
    reading = true;
    readBtn.textContent = '■ Stop reading';
    let i = 0;
    const next = () => {
      paragraphs.forEach((p) => p.classList.remove('speaking'));
      if (!reading || i >= paragraphs.length) { reading = false; readBtn.textContent = '🔊 Read it to me'; return; }
      const p = paragraphs[i++];
      p.classList.add('speaking');
      p.scrollIntoView({ block: 'center', behavior: 'smooth' });
      speak(p.textContent, { voice: who, onEnd: next });
    };
    next();
  } }, '🔊 Read it to me') : null;
  const already = scenesRead(store.events, story.id).has(file);
  if (!already) store.add('story', { story: story.id, scene: file });
  show(root, topBar(story.title, { back: () => { stopSpeaking(); home(); } }), readBtn,
    h('div', { class: 'card' }, body),
    h('button', { class: 'btn big', onclick: () => { stopSpeaking(); home(); } }, 'Done'));
}

function storyShelf(story) {
  const read = scenesRead(store.events, story.id);
  show(root, topBar(story.title, { back: home }),
    ...story.scenes.filter((s) => read.has(s)).map((s, i) => h('button', { class: 'btn plain', onclick: () => readScene(story, s) }, `Scene ${i + 1}`)));
}

// ---- her map ----
export function myMap() {
  const st = computeState(store.events);
  const skills = inRelease(RELEASE);
  const label = { new: 'not started', learning: 'learning', learned: 'learned', placed: 'already knew', mastered: 'mastered', 'mastered-refresh': 'mastered, a quick refresh due', shaky: 'needs a refresh' };
  show(root, topBar('My map', { back: home }),
    h('div', { class: 'map' }, pathsIn(RELEASE).map(([p, name]) => h('div', { class: 'card' }, h('h3', {}, name),
      skills.filter((s) => s.path === p).map((s) => h('div', { class: 'node' }, h('span', { class: `dot ${mapStatus(st[s.id]) === 'mastered-refresh' ? 'mastered' : st[s.id].status}` }), h('span', { class: 'grow' }, s.title), h('span', { class: 'muted small' }, label[mapStatus(st[s.id])])))))));
}

// ---- settings ----
function settings() {
  const s = store.settings;
  const toggle = (key, text) => h('label', { class: 'row card' }, h('span', { class: 'grow' }, text),
    h('input', { type: 'checkbox', checked: s[key], onchange: (e) => { store.settings = { ...store.settings, [key]: e.target.checked }; applySettings(); } }));
  show(root, topBar('Settings', { back: home }),
    toggle('sound', 'Sounds'),
    toggle('readAloud', 'Read aloud'),
    h('button', { class: 'btn plain', onclick: saveCopy }, 'Save a copy of my progress'));
}

// A backup of her progress as a file, with the game's measures at the top (engine/measures.js).
function saveCopy() {
  const now = Date.now();
  const blob = new Blob([JSON.stringify(progressFile(store.events, now))], { type: 'application/json' });
  h('a', { href: URL.createObjectURL(blob), download: `maths-progress-${dayOf(now)}.json` }).click();
}

boot();
