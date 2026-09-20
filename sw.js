// Service worker de Control Vigía.
// Solo se ocupa de la apertura de la app: red primero (así siempre ves la última versión)
// y, si no hay internet, abre la última copia guardada. No toca Firebase ni ningún otro pedido.
const CACHE = 'control-vigia-v1';
const SHELL = self.registration.scope;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return; // el resto sale directo a la red, como siempre
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(SHELL, res.clone()).catch(() => {});
      }
      return res;
    } catch (e) {
      const cache = await caches.open(CACHE);
      return (await cache.match(SHELL)) || Response.error();
    }
  })());
});
