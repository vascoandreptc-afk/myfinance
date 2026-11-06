// MyFinance: guarda a app no telemóvel para abrir depressa e sem rede.
const CACHE = "myfinance-v16";
const SHELL = ["./", "index.html", "app.js?v=16", "shell.js?v=16", "firebase-config.js?v=16", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];
const CDN = ["www.gstatic.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // rede primeiro (para receber atualizações), cache se estiver offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else if (CDN.includes(url.hostname) && !url.pathname.includes("/__/")) {
    // bibliotecas e tipos de letra: cache primeiro
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { const cp = n.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return n; })));
  }
});
