// Works offline: every file is kept on the device the first time it loads, served from there at once,
// and refreshed in the background when there is a connection (stale-while-revalidate). The lists of sound files,
// voices/index.json and the guide's pieces in voices/pieces.json, come fresh whenever there is a connection, so a list
// from before the lines were voiced again never points the game at files that are gone; offline, the copy kept last
// time. A sound file is kept once played. The guide's pieces are named for what they say (tools/pieces.mjs), so they
// are kept in a cache of their own from one publish to the next, and after activate every one the list names is
// fetched and kept, so a line built from them is said offline too; a piece the fill misses is kept the first time it
// plays, and a piece the list no longer names is let go.
// tools/publish.mjs names the cache for what it published, so each new publish replaces every file kept from the last.
const CACHE = 'maths-game-f40e8cc417f5';
const PIECES = 'maths-game-pieces';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'css/app.css', 'js/app.js', 'stories/index.json'])).then(() => self.skipWaiting()));
});

// The fill: the list fetched past the browser's own copy (GitHub Pages lets it keep one ten minutes) and kept for
// offline, then every piece it names not yet kept, 20 at a time. Every failure is swallowed: offline, or a piece that
// will not come, the game goes on and the piece is kept the first time it plays. One fill at a time.
const GROUP = 20;
let filling = null;
async function fill() {
  let res, list;
  try {
    res = await fetch('voices/pieces.json', { cache: 'no-cache' });
    if (!res.ok) return;
    list = await res.clone().json();
  } catch { return; }
  await (await caches.open(CACHE)).put(new URL('voices/pieces.json', location.href).href, res);
  const cache = await caches.open(PIECES);
  const paths = Object.values(list && typeof list === 'object' ? list : {}).flatMap((lines) => Object.values(lines && typeof lines === 'object' ? lines : {}));
  const want = new Set(paths.filter((p) => typeof p === 'string').map((p) => new URL(`voices/pieces/${p}`, location.href).href));
  const have = new Set((await cache.keys()).map((req) => req.url));
  await Promise.all([...have].filter((u) => !want.has(u)).map((u) => cache.delete(u)));
  const urls = [...want].filter((u) => !have.has(u));
  for (let i = 0; i < urls.length; i += GROUP) await Promise.all(urls.slice(i, i + GROUP).map((u) => cache.add(u).catch(() => {})));
}
const keepPieces = () => (filling ??= fill().catch(() => {}).finally(() => { filling = null; }));

// A controlled page's requests wait while the worker is activating, so activate waits only on the old caches deleted
// and the pages claimed; the fill starts after, on its own, and again each time the game fetches the list.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== PIECES).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => { keepPieces(); }));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const path = new URL(req.url).pathname;
  // a piece never changes under its name: from the pieces' cache, else the network, kept there
  if (path.includes('/voices/pieces/')) {
    event.respondWith(caches.open(PIECES).then(async (cache) => {
      const kept = await cache.match(req, { ignoreSearch: true });
      if (kept) return kept;
      const res = await fetch(req);
      if (res.ok) await cache.put(req, res.clone());
      return res;
    }));
    return;
  }
  // the fresh copy is saved before the worker may stop (waitUntil), so a refresh is never lost half done
  const opened = caches.open(CACHE);
  const fresh = opened.then((cache) => fetch(req).then(async (res) => {
    if (res.ok) await cache.put(req, res.clone());
    return res;
  }));
  event.waitUntil(fresh.catch(() => {}));
  const kept = () => opened.then((cache) => cache.match(req, { ignoreSearch: true }));
  if (path.endsWith('/voices/index.json') || path.endsWith('/voices/pieces.json')) {
    if (path.endsWith('/voices/pieces.json')) event.waitUntil(fresh.then(keepPieces, () => {}));
    event.respondWith(fresh.catch(async () => (await kept()) || Response.error()));
    return;
  }
  event.respondWith(kept().then((cached) => cached || fresh));
});
