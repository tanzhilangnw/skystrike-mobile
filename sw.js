const VERSION = 'skystrike-game-v3-e393233f3b9d';
const SHELL = ['./', 'index.html', 'home.css', 'home.js', 'manifest.webmanifest',
  'media/nebula.webp', 'media/player.webp', 'media/enemy.webp', 'media/icon-192.png', 'media/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(VERSION);
      await Promise.allSettled(SHELL.map(path => cache.add(new Request(path, {cache:'reload'}))));
    } finally { await self.skipWaiting(); }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('skystrike-game-') && key !== VERSION).map(key => caches.delete(key)));
    } finally { await self.clients.claim(); }
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const local = url.origin === self.location.origin;
  const runtime = url.hostname === 'pygame-web.github.io';
  if (!local && !runtime) return;
  if (local && url.pathname.endsWith('/sw.js')) return;
  event.respondWith((async () => {
    let cache;
    try { cache = await caches.open(VERSION); } catch { return fetch(req); }
    const cached = await cache.match(req);
    const immutable = /game-[a-f0-9]+\.tar\.gz$/.test(url.pathname) || runtime;
    if (cached && immutable) return cached;
    const network = fetch(req).then(response => {
      if (response.ok || response.type === 'opaque') {
        event.waitUntil(cache.put(req, response.clone()).catch(() => {}));
      }
      return response;
    });
    if (cached) { event.waitUntil(network.catch(() => {})); return cached; }
    return network;
  })());
});
