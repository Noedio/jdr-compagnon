// Service worker du carnet du MJ (téléphone, sans PC). Il garde l'application sur le téléphone pour
// qu'elle s'ouvre hors connexion, sert les images de la médiathèque depuis la base du téléphone
// (/api/images/<id>) et répond à la place du PC pour ce qui en a besoin (assistant IA, bibliothèque…).
const BASE = new URL('./', self.registration.scope).pathname; // ex. /jdr-compagnon/app/
const CACHE = 'jdr-carnet-3.15.0-f33a9c52c5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const list = await fetch(BASE + 'carnet-files.json', { cache: 'no-store' }).then((r) => r.json());
      // la page d'accueil, puis chaque fichier de l'application (noms uniques : gardés tels quels)
      await cache.addAll([BASE, ...list.files.filter((f) => f !== 'index.html').map((f) => BASE + f)]);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith('jdr-carnet-') && k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

// ---------- base du téléphone (même base que la page : jdr-carnet, magasin « media ») ----------
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jdr-carnet', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      if (!d.objectStoreNames.contains('media')) d.createObjectStore('media');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function mediaResponse(id) {
  // identifiants générés (uuid.ext) : rien d'autre n'est cherché
  if (!/^[0-9a-f-]+\.[a-z0-9]+$/i.test(id)) return new Response('', { status: 404 });
  const db = await openDb();
  const blob = await new Promise((resolve, reject) => {
    const req = db.transaction('media').objectStore('media').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  if (!blob) return new Response('', { status: 404 });
  return new Response(blob, { headers: { 'content-type': blob.type || 'application/octet-stream', 'cache-control': 'no-store' } });
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // la table vit dans la page : toute adresse /api/ est traitée ici, jamais envoyée au site
  const api = url.pathname.indexOf('/api/');
  if (api !== -1) {
    const rest = url.pathname.slice(api + 5);
    if (event.request.method === 'GET' && rest.startsWith('images/')) {
      event.respondWith(mediaResponse(decodeURIComponent(rest.slice(7))));
      return;
    }
    if (rest === 'info') {
      event.respondWith(json(200, { port: 0, urls: [], addresses: [], version: '', pro: false, local: true }));
      return;
    }
    event.respondWith(json(503, { error: 'Indisponible dans le carnet hors connexion : faites-le depuis le PC de la table.' }));
    return;
  }
  if (event.request.method !== 'GET' || !url.pathname.startsWith(BASE)) return;
  // pages de l'application (adresses du routeur) : la page d'accueil, réseau d'abord pour les mises à jour
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // réseau lent (métro, campagne) : la copie gardée s'ouvre au bout de 3 s
          const ctl = new AbortController();
          setTimeout(() => ctl.abort(), 3000);
          const r = await fetch(BASE, { cache: 'no-store', signal: ctl.signal });
          if (r.ok) (await caches.open(CACHE)).put(BASE, r.clone());
          return r;
        } catch {
          return (await caches.match(BASE)) || Response.error();
        }
      })(),
    );
    return;
  }
  // fichiers de l'application : gardés (noms uniques), sinon demandés puis gardés
  event.respondWith(
    (async () => {
      const hit = await caches.match(event.request);
      if (hit) return hit;
      const r = await fetch(event.request);
      if (r.ok) (await caches.open(CACHE)).put(event.request, r.clone());
      return r;
    })(),
  );
});
