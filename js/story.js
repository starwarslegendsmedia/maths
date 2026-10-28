// The story: scenes are short markdown files in stories/<id>/, with {name} where her hero's name goes
// (the name lives on her devices and in the private Sheet, never in this public repository).
// One new scene unlocks for each day she finishes a session: the story is the reason to come back
// tomorrow, which is the spacing the research wants.

import { dayOf } from '../engine/mastery.js';

// A story that has been approved: only approved: true counts, never a string such as "false".
export const approved = (s) => s?.approved === true;

// The story list, or none when it is missing, its read fails part-way (a connection dropped as it came in) or what came
// is not a list (one saved by hand as an object, a Wi-Fi login page's JSON), so the game still starts.
export async function loadStories() {
  const res = await fetch('stories/index.json', { cache: 'no-cache' }).catch(() => null);
  if (!res || !res.ok) return [];
  return res.json().then((x) => (Array.isArray(x) ? x : [])).catch(() => []);
}

export async function loadScene(storyId, file) {
  const res = await fetch(`stories/${storyId}/${file}`);
  if (!res.ok) throw new Error(`scene missing: ${storyId}/${file}`);
  return res.text();
}

export function esc(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function inline(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
}

// The small piece of markdown the scenes use: a # title, an *italic* line, paragraphs, --- breaks.
export function sceneToHtml(md, name) {
  const text = esc(md).replaceAll('{name}', esc(name || 'Our hero'));
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    if (b.startsWith('# ')) return `<h2>${inline(b.slice(2))}</h2>`;
    if (b === '---') return '<hr>';
    if (/^\*[^*].*\*$/.test(b) && !b.includes('\n')) return `<p class="scene">${b.slice(1, -1)}</p>`;
    return `<p>${inline(b.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
}

// Days on which she finished a session (or a placement sitting).
export function sessionDays(events) {
  return new Set(events.filter((e) => e.type === 'session' && e.phase === 'end').map((e) => dayOf(e.t)));
}

export function currentStory(events) {
  const picks = events.filter((e) => e.type === 'pick-story');
  return picks.length ? picks[picks.length - 1].story : null;
}

export function scenesRead(events, storyId) {
  return new Set(events.filter((e) => e.type === 'story' && e.story === storyId).map((e) => e.scene));
}

// The next scene she may read now, or null (none unlocked yet, or the story has no more written).
export function nextScene(events, story) {
  if (!story) return null;
  const read = scenesRead(events, story.id);
  const earned = sessionDays(events).size;
  const readToday = events.some((e) => e.type === 'story' && e.story === story.id && dayOf(e.t) === dayOf(Date.now()));
  const next = story.scenes.find((s) => !read.has(s));
  if (!next || read.size >= earned || readToday) return null;
  return next;
}
