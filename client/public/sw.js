const CACHE = 'stine-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/']).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || request.url.includes('/api/')) return;
  e.respondWith(
    fetch(request).then(res => {
      if (res && res.status === 200) caches.open(CACHE).then(c => c.put(request, res.clone()));
      return res;
    }).catch(() => caches.match(request).then(r => r || caches.match('/')))
  );
});
