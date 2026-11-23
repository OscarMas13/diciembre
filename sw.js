// Permite abrir el calendario sin conexión.
// Siempre intenta descargar lo último (para que veas tus cambios);
// si no hay internet, usa la copia guardada.
const CACHE = "adviento-v2";
const BASE = [
  "./", "index.html", "estilos.css", "app.js", "contenido.js",
  "manifest.webmanifest", "iconos/icon-180.png", "iconos/icon-192.png", "iconos/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  // Los archivos del calendario se piden siempre frescos (sin caché del navegador)
  const mismo = new URL(req.url).origin === self.location.origin;
  const peticion = mismo ? fetch(req.url, { cache: "no-cache" }) : fetch(req);
  e.respondWith(
    peticion
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
