// Service worker do Fake Hunter: deixa o jogo instalável e jogável sem internet.
// - Páginas: rede primeiro, com a última versão salva como reserva offline.
// - /_next/static: cache primeiro (o nome do arquivo muda a cada build).
// - Imagens, ícones e áudio: entrega do cache e atualiza em segundo plano, para que um arquivo
//   trocado no mesmo endereço chegue ao jogador na visita seguinte.
// Ao mudar esta lógica, troque a VERSAO para descartar os caches antigos.

const VERSAO = "fakehunter-v2";
const AUDIOS = [
  "clique",
  "acerto",
  "erro",
  "proxima_fase",
  "game_over",
  "menu_1",
  "menu_2",
  "menu_3",
];
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // O áudio é pedido em pedaços (206), que não vão para o cache; baixar inteiro aqui garante
  // som também offline.
  ...AUDIOS.map((a) => `/audio/${a}.mp3`),
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

function ehVersionado(url) {
  return url.pathname.startsWith("/_next/static/");
}

function ehMidia(url) {
  return ["/_next/image", "/img/", "/icons/", "/audio/"].some((p) => url.pathname.startsWith(p));
}

function buscarESalvar(request) {
  return fetch(request).then((resposta) => {
    // 206 (pedaço de áudio) não pode ir para o cache; só respostas completas.
    if (resposta.status === 200) {
      const copia = resposta.clone();
      caches.open(VERSAO).then((cache) => cache.put(request, copia));
    }
    return resposta;
  });
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

  if (ehVersionado(url)) {
    evento.respondWith(caches.match(request).then((salva) => salva || buscarESalvar(request)));
    return;
  }

  if (ehMidia(url)) {
    evento.respondWith(
      caches.match(request).then((salva) => {
        const atualizada = buscarESalvar(request).catch(() => salva);
        if (salva) evento.waitUntil(atualizada);
        return salva || atualizada;
      }),
    );
  }
});
