// Service Worker: App offline verfügbar machen.
// Bei jeder Änderung an den Dateien VERSION hochzählen.
const VERSION = "v4";
const CACHE = "lkw-abnahme-" + VERSION;
const FILES = [
  "./", "index.html", "styles.css", "app.js", "config.js", "checklist.js",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "vendor/jspdf.umd.min.js", "vendor/jspdf.plugin.autotable.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Network-first (damit Updates sofort ankommen), offline aus dem Cache.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }) // immer beim Server nachfragen, nicht 10 min aus HTTP-Cache
      .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
