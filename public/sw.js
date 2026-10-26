// Service worker do Fake Hunter: deixa o jogo instalável e jogável sem internet.
// - Páginas: rede primeiro, com a última versão salva como reserva offline.
// - Arquivos estáticos (JS, CSS, fontes, imagens): cache primeiro, porque têm nome versionado
//   ou mudam raramente.
// Ao mudar esta lógica, troque a VERSAO para descartar os caches antigos.

const VERSAO = "fakehunter-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

function ehEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/img/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/audio/")
  );
}

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    evento.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put("/", copia));
          return resposta;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (ehEstatico(url)) {
    evento.respondWith(
      caches.match(request).then(
        (salva) =>
          salva ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});
