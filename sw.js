// Caches the game files so it works offline after the first visit.
// Bump the version when files change so players get the update.
const CACHE = 'dodgyblobby-v1';
const FILES = [
  './', 'index.html', 'script.js', 'style.css', 'manifest.json', 'ESCAPEbackground.jpg',
  'blobStates/bloby0.png', 'blobStates/bloby1.png', 'blobStates/bloby2.png', 'blobStates/bloby3.png',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Use the cached copy if there is one, otherwise go to the network and cache the result.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && e.request.url.startsWith(self.location.origin)) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  })));
});
