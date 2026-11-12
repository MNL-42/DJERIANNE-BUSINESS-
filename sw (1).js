/* Djerianne Business : service worker (hors ligne + chargement rapide) */
const V = 'dj-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo.jpg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;   // Firebase & co : réseau direct
  if (r.mode === 'navigate') {                                                                               // pages : réseau d'abord
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(ch => ch.put('./index.html', c)); return res; })
      .catch(() => caches.match('./index.html').then(x => x || caches.match('./'))));
    return;
  }
  e.respondWith(caches.open(V).then(async ch => {                                                           // photos, polices : cache puis mise à jour
    const hit = await ch.match(r);
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') ch.put(r, res.clone()); return res; }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
