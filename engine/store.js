// Everything she does is stored as an event: one answer, one sprint, one story scene. Progress is worked
// out from the events, never stored on its own, so the Mac and the iPhone can be merged by putting their
// events together (union by id) with no conflicts.
//
// Event: { id, t (ms since 1970), device, type, ...data }
//   answer     { skill, key, phase, correct, firstTry, ms, given? }   phase: worked | learn | flash | practice | helped | review | sprint | placement
//              flash: a new fact shown, hidden and typed whole from memory (js/runner.js flash)
//              helped: a practice problem she asked to see steps of ("Show me one step"), with shown, how many
//              boxes: a long method's problem, how many of its steps she had as boxes to type in (engine/boxes.js)
//   flash      { key, shownMs, firstTry }                              one flash of a new fact: how long it showed, and
//                                                                      whether she typed it right without seeing it again
//   placed     { skill, result: 'known' | 'unknown' }                  from the placement check
//   learned    { skill }                                               block practice reached about 90% right
//   sprint     { score, wrong, skills }                                one one-minute sprint
//   round      { part, size, reward }                                  a round finished and the reward shown
//              part: review | practice | new-facts | facts (her slowest facts after the lesson);
//              reward: an id from engine/rounds.js, or 'learned'
//   session    { phase: 'start' | 'end', kind, done, stopped? }       stopped: she tapped "Stop here for today"
//   story      { story, scene }                                        a scene read
//   pick-story { story }
//   hero       { name }                                                her character's name; private, never in the repo
//   start-choice { first: 'review' | 'learn' }                        which part she chose to do first
//   rating     { guess, band, right, done }                            her guess at a session's score, then the score (engine/rating.js)
//   (two more)  release 1's parent's corner, no longer written (17 October 2026); kept if present, and ignored

const KEY = 'maths-game.events.v1';
const DEVICE_KEY = 'maths-game.device.v1';
const SETTINGS_KEY = 'maths-game.settings.v1';

export function makeId(device, t, n) {
  return `${device}-${t.toString(36)}-${n.toString(36)}`;
}

export function mergeEvents(...lists) {
  const byId = new Map();
  for (const list of lists) for (const e of list) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1));
}

export class Store {
  // storage: anything with getItem/setItem (localStorage in the browser, a Map wrapper in tests)
  constructor(storage, clock = () => Date.now()) {
    this.storage = storage;
    this.clock = clock;
    this.counter = 0;
    this.events = this.read(KEY, []);
    this.device = this.storage.getItem(DEVICE_KEY);
    if (!this.device) {
      this.device = Math.random().toString(36).slice(2, 8);
      this.storage.setItem(DEVICE_KEY, this.device);
    }
  }

  read(key, fallback) {
    try {
      const text = this.storage.getItem(key);
      return text ? JSON.parse(text) : fallback;
    } catch {
      return fallback;
    }
  }

  add(type, data = {}) {
    const t = this.clock();
    const e = { id: makeId(this.device, t, this.counter++), t, device: this.device, type, ...data };
    this.events.push(e);
    this.save();
    return e;
  }

  merge(remote) {
    if (remote && !Array.isArray(remote)) remote = remote.events ?? []; // the copy saved from Settings (engine/measures.js)
    const before = this.events.length;
    this.events = mergeEvents(this.events, remote);
    if (this.events.length !== before) this.save();
    return this.events.length - before;
  }

  save() {
    this.storage.setItem(KEY, JSON.stringify(this.events));
  }

  get settings() {
    return this.read(SETTINGS_KEY, { sound: true, readAloud: true });
  }

  set settings(value) {
    this.storage.setItem(SETTINGS_KEY, JSON.stringify(value));
  }
}

// Her hero's latest name, read straight from storage without opening a Store (which writes a device id); '' if there
// is none, or the storage is blocked or unreadable. getStorage is a function since reading window.localStorage can
// itself throw.
export function storedHeroName(getStorage) {
  try {
    const events = JSON.parse(getStorage().getItem(KEY) || '[]');
    return [...events].reverse().find((e) => e?.type === 'hero')?.name || '';
  } catch {
    return '';
  }
}

// A Map with the localStorage interface, for tests and for a browser that blocks storage.
export class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
