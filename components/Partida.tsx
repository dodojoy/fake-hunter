"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  conteudo,
  obterFase,
  statusTexto,
  vereditoTexto,
  type Noticia,
  type StatusFonte,
  type Veredito,
} from "@/lib/conteudo";
import {
  comecar,
  decidir,
  iniciarPartida,
  investigacoesRestantes,
  investigar,
  noticiaAtual,
  podeInvestigar,
  proximaNoticia,
  type EstadoPartida,
  type Investigacao,
} from "@/lib/regras";
import { tocar } from "@/lib/audio";
import {
  descobrirSinais,
  lerRecordes,
  lerSinaisDescobertos,
  registrarDecisao,
  registrarPontuacao,
} from "@/lib/memoria";
import { alterarPreferencias, usePreferencias } from "@/lib/preferencias";
import { falar, pararFala } from "@/lib/voz";
import OpcoesAcessibilidade from "./Acessibilidade";
import { ChipSinal } from "./Caderno";
import { Botao, BotaoOuvir, Fundo, Icone, Modal, Painel } from "./ui";

export interface ResumoFase {
  faseId: string;
  nomeFase: string;
  pontos: number;
  acertos: number;
  erros: number;
  melhorSequencia: number;
}

interface Props {
  faseId: string;
  onJogarFase: (faseId: string) => void;
  onMenu: () => void;
  onFaseConcluida: (resumo: ResumoFase) => void;
  onConcluirJornada: () => void;
}

// ---------- Tutorial guiado (primeira notícia da primeira fase) ----------

type AlvoTutorial = "hud" | "noticia" | "investigacao" | "decisao";

const TUTORIAL: { alvo: AlvoTutorial; titulo: string; texto: string; acima?: boolean }[] = [
  {
    alvo: "hud",
    titulo: "Confiança da comunidade",
    texto:
      "Cada acerto aumenta a confiança em 5%. Cada erro derruba 20%. Se ela chegar a zero, você é demitido!",
  },
  {
    alvo: "noticia",
    titulo: "A notícia",
    texto:
      "Leia com atenção: o título, o texto, quem enviou (autor), onde foi publicada e a data. Tudo isso pode dar pistas.",
  },
  {
    alvo: "investigacao",
    titulo: "Investigue antes de decidir",
    texto:
      "Você tem 2 investigações por notícia. Verifique a fonte, consulte a reputação do autor ou pesquise em outros lugares. Escolha bem!",
    acima: true,
  },
  {
    alvo: "decisao",
    titulo: "Sua decisão",
    texto:
      "Compartilhe só o que for totalmente verdadeiro. Se for falso ou meia verdade, não propague. Depois você descobre se acertou e por quê.",
    acima: true,
  },
];

function rolarPara(alvo: string) {
  const reduzir = document.documentElement.dataset.movimento === "reduzido";
  document
    .querySelector(`[data-tutorial="${alvo}"]`)
    ?.scrollIntoView({ block: "center", behavior: reduzir ? "auto" : "smooth" });
}

// ---------- Textos para leitura em voz alta ----------

function textoNoticia(n: Noticia) {
  return `${n.titulo}. ${n.corpo} Autor: ${n.autor?.nomeExibido ?? "desconhecido"}. Publicado em: ${n.nomeCanal}. Data: ${n.data}.`;
}

function textoExplicacao(n: Noticia, acertou: boolean) {
  return `${acertou ? "Você acertou!" : "Você errou!"} Esta notícia é ${vereditoTexto(n.veredito)}. ${n.explicacao}`;
}

export default function Partida({
  faseId,
  onJogarFase,
  onMenu,
  onFaseConcluida,
  onConcluirJornada,
}: Props) {
  const [s, setS] = useState(() => iniciarPartida(obterFase(faseId)));
  const [novoRecorde, setNovoRecorde] = useState(false);
  const [sinaisNovos, setSinaisNovos] = useState<string[]>([]);
  const [pausa, setPausa] = useState(false);
  const [passo, setPasso] = useState<number | null>(null);
  const [recorde] = useState(() => lerRecordes()[faseId] ?? 0);
  const inicioNoticia = useRef(0);
  const prefs = usePreferencias();
  const noticia = noticiaAtual(s);
  const alvoTutorial = passo !== null ? TUTORIAL[passo].alvo : null;
  const modalAberto = s.etapa !== "jogando" || pausa;

  // ---------- Ações ----------

  function onComecar() {
    setS(comecar(s));
    inicioNoticia.current = performance.now();
    if (s.fase.id === conteudo().faseInicial && !prefs.tutorialVisto) setPasso(0);
  }

  function avancarTutorial() {
    if (passo === null) return;
    if (passo + 1 < TUTORIAL.length) {
      setPasso(passo + 1);
      rolarPara(TUTORIAL[passo + 1].alvo);
    } else {
      encerrarTutorial();
    }
  }

  function encerrarTutorial() {
    setPasso(null);
    alterarPreferencias({ tutorialVisto: true });
  }

  function onInvestigar(tipo: Investigacao) {
    setS(investigar(s, tipo));
  }

  function onDecidir(compartilhar: boolean) {
    const prox = decidir(s, compartilhar);
    if (prox === s) return;
    if (passo !== null) encerrarTutorial();
    setS(prox);

    registrarDecisao({
      quando: new Date().toISOString(),
      fase: s.fase.id,
      noticia: noticia.id,
      veredito: noticia.veredito,
      compartilhou: compartilhar,
      acertou: prox.acertouUltima,
      investigacoes: s.investigacoesUsadas,
      segundos: Math.round((performance.now() - inicioNoticia.current) / 1000),
    });

    if (prox.etapa === "gameOver") {
      tocar("gameOver");
      setNovoRecorde(registrarPontuacao(s.fase.id, prox.pontos));
      return;
    }

    tocar(prox.acertouUltima ? "acerto" : "erro");
    const jaVistos = new Set(lerSinaisDescobertos());
    setSinaisNovos(noticia.sinais.filter((x) => !jaVistos.has(x.id)).map((x) => x.id));
    descobrirSinais(noticia.sinais.map((x) => x.id));
    rolarPara("noticia"); // no celular, garante que o carimbo apareça
  }

  function onProximaNoticia() {
    const prox = proximaNoticia(s);
    setS(prox);
    inicioNoticia.current = performance.now();
    if (prox.etapa === "fimDeFase") {
      tocar("fimDeFase");
      setNovoRecorde(registrarPontuacao(s.fase.id, prox.pontos));
      onFaseConcluida({
        faseId: s.fase.id,
        nomeFase: s.fase.nomeFase,
        pontos: prox.pontos,
        acertos: prox.acertos,
        erros: prox.erros,
        melhorSequencia: prox.melhorSequencia,
      });
    } else {
      window.scrollTo({ top: 0 });
    }
  }

  // ---------- Atalhos de teclado ----------

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (s.etapa !== "jogando" || pausa || passo !== null) return;
      const tecla = e.key.toLowerCase();
      const acao: Record<string, () => void> = {
        "1": () => onInvestigar("verificarFonte"),
        "2": () => onInvestigar("consultarReferencia"),
        "3": () => onInvestigar("pesquisar"),
        c: () => onDecidir(true),
        n: () => onDecidir(false),
        l: () => falar(textoNoticia(noticia), "noticia"),
        escape: () => setPausa(true),
      };
      if (!acao[tecla]) return;
      e.preventDefault();
      if (tecla !== "escape" && tecla !== "l") tocar("clique");
      acao[tecla]();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  // ---------- Leitura automática ----------

  useEffect(() => {
    if (!prefs.leituraAutomatica) return;
    if (s.etapa === "jogando") falar(textoNoticia(noticia), "noticia");
    if (s.etapa === "explicacao") falar(textoExplicacao(noticia, s.acertouUltima), "explicacao");
  }, [prefs.leituraAutomatica, s.etapa, noticia, s.acertouUltima]);

  useEffect(() => pararFala, []);

  const dica = passo !== null && (
    <DicaTutorial passo={passo} onProximo={avancarTutorial} onPular={encerrarTutorial} />
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Fundo src="/img/ui/bg_gameplay.png" />

      <div inert={modalAberto} className="flex flex-1 flex-col">
        <Hud s={s} destaque={alvoTutorial === "hud"} onPausa={() => setPausa(true)}>
          {alvoTutorial === "hud" && dica}
        </Hud>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-3 pt-8 pb-48 sm:px-6 lg:pb-8">
          <CartaoNoticia noticia={noticia} s={s} destaque={alvoTutorial === "noticia"}>
            {alvoTutorial === "noticia" && dica}
          </CartaoNoticia>

          <PainelInvestigacao
            s={s}
            onInvestigar={onInvestigar}
            destaque={alvoTutorial === "investigacao"}
          >
            {alvoTutorial === "investigacao" && dica}
          </PainelInvestigacao>

          <BarraDecisao s={s} onDecidir={onDecidir} destaque={alvoTutorial === "decisao"}>
            {alvoTutorial === "decisao" && dica}
          </BarraDecisao>
        </main>
      </div>

      {passo !== null && <div aria-hidden className="fixed inset-0 z-30 bg-black/65" />}

      {s.etapa === "abertura" && (
        <Modal rotulo={s.fase.nomeFase}>
          <Painel titulo={s.fase.nomeFase}>
            <p className="text-xl font-bold">{s.fase.descricao}</p>
            <div className="flex w-full gap-4 rounded-2xl bg-black/5 p-4 text-left">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-azul font-titulo text-xl text-white"
              >
                MR
              </span>
              <div>
                <p className="font-bold">Marta Ribeiro, coordenadora</p>
                <p className="text-lg leading-snug">“{s.fase.abertura}”</p>
              </div>
            </div>
            <p>
              {s.noticias.length} notícias · até 2 investigações por notícia
              {recorde > 0 && <> · Seu recorde: {recorde} pontos</>}
            </p>
            <Botao cor="amarelo" className="text-xl" onClick={onComecar} autoFocus>
              Começar
            </Botao>
          </Painel>
        </Modal>
      )}

      {s.etapa === "explicacao" && (
        <Explicacao s={s} sinaisNovos={sinaisNovos} onProxima={onProximaNoticia} />
      )}

      {s.etapa === "fimDeFase" && (
        <Modal rotulo="Fim de fase" fundo="/img/ui/bg_fimdefase.png">
          <Painel titulo={`${s.fase.nomeFase} concluída!`} corTitulo="text-verde-texto">
            <Resumo
              linhas={[
                ["Acertos", s.acertos],
                ["Erros", s.erros],
                ["Melhor sequência", s.melhorSequencia],
                ["Confiança final", `${Math.round(s.confianca)}%`],
                ["Pontuação", s.pontos],
              ]}
              novoRecorde={novoRecorde}
            />
            <div className="w-full">
              <p className="mb-2 font-bold">Sinais que você estudou nesta fase:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[...new Set(s.noticias.flatMap((n) => n.sinais))].map((sinal) => (
                  <ChipSinal key={sinal.id} sinal={sinal} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Botao cor="azul" className="text-lg" onClick={() => onJogarFase(s.fase.id)}>
                Jogar de novo
              </Botao>
              {s.fase.proximaFase ? (
                <Botao
                  cor="amarelo"
                  className="text-lg"
                  onClick={() => onJogarFase(s.fase.proximaFase!)}
                  autoFocus
                >
                  Próxima fase →
                </Botao>
              ) : (
                <Botao cor="amarelo" className="text-lg" onClick={onConcluirJornada} autoFocus>
                  Concluir jornada →
                </Botao>
              )}
              <Botao cor="claro" className="text-lg" onClick={onMenu}>
                Menu
              </Botao>
            </div>
          </Painel>
        </Modal>
      )}

      {s.etapa === "gameOver" && (
        <Modal rotulo="Game over" fundo="/img/ui/bg_gameover.png">
          <Painel titulo="Você foi demitido!" corTitulo="text-vermelho-texto">
            <p className="text-xl font-semibold">
              A comunidade perdeu a confiança no seu trabalho.
            </p>
            <Resumo
              linhas={[
                ["Acertos", s.acertos],
                ["Erros", s.erros],
                ["Pontuação", s.pontos],
              ]}
              novoRecorde={novoRecorde}
            />
            <p className="rounded-xl bg-black/5 px-4 py-3">
              Dica: use as duas investigações antes de decidir. Quando a fonte é ruim, pesquise se
              outro lugar confirma a notícia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Botao
                cor="amarelo"
                className="text-lg"
                onClick={() => onJogarFase(s.fase.id)}
                autoFocus
              >
                Tentar de novo
              </Botao>
              <Botao cor="claro" className="text-lg" onClick={onMenu}>
                Menu
              </Botao>
            </div>
          </Painel>
        </Modal>
      )}

      {pausa && (
        <Modal rotulo="Pausa" onFechar={() => setPausa(false)}>
          <Painel titulo="Pausa">
            <Botao cor="amarelo" className="text-xl" onClick={() => setPausa(false)} autoFocus>
              Continuar
            </Botao>
            <OpcoesAcessibilidade />
            <Botao cor="claro" onClick={onMenu}>
              Voltar ao menu (perde o progresso da fase)
            </Botao>
          </Painel>
        </Modal>
      )}
    </div>
  );
}

// ---------- HUD ----------

function corConfianca(confianca: number) {
  if (confianca > 60) return "var(--verde)";
  if (confianca > 30) return "var(--amarelo)";
  return "var(--vermelho)";
}

function Hud({
  s,
  destaque,
  onPausa,
  children,
}: {
  s: EstadoPartida;
  destaque: boolean;
  onPausa: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header
      data-tutorial="hud"
      className={`sticky top-0 bg-painel-escuro text-texto-claro shadow-lg ${destaque ? "destaque-tutorial z-40" : "z-20"}`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 basis-44 items-center gap-2 sm:gap-3">
          <Icone src="/img/ui/ico_confianca.png" tamanho={36} className="max-sm:hidden" />
          <div
            role="progressbar"
            aria-label="Confiança da comunidade"
            aria-valuenow={s.confianca}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-5 max-w-56 min-w-20 flex-1 overflow-hidden rounded-full border-2 border-texto-claro/50 bg-black/40"
          >
            <div
              className="h-full rounded-full transition-[width,background-color] duration-300"
              style={{ width: `${s.confianca}%`, background: corConfianca(s.confianca) }}
            />
          </div>
          <span className="font-extrabold whitespace-nowrap">
            <span className="max-sm:sr-only">Confiança: </span>
            {Math.round(s.confianca)}%
          </span>
        </div>

        <div className="order-last flex w-full items-center justify-center gap-3 sm:order-none sm:w-auto sm:flex-col sm:gap-1">
          <span className="text-sm font-semibold text-texto-sutil max-sm:sr-only">
            {s.fase.nomeFase}
          </span>
          <ol
            aria-label={`Notícia ${s.indice + 1} de ${s.noticias.length}`}
            className="flex gap-1.5"
          >
            {s.noticias.map((n, i) => {
              const resultado = s.historico[i];
              const atual = i === s.indice;
              return (
                <li
                  key={n.id}
                  aria-hidden
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[0.65rem] font-black ${
                    resultado === true
                      ? "border-verde bg-verde text-white"
                      : resultado === false
                        ? "border-vermelho bg-vermelho text-white"
                        : atual
                          ? "border-amarelo bg-amarelo/30"
                          : "border-texto-sutil/50"
                  }`}
                >
                  {resultado === true ? "✓" : resultado === false ? "✕" : ""}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex items-center gap-4">
          {s.sequencia > 1 && (
            <span className="flex items-center gap-1 font-extrabold whitespace-nowrap text-amarelo">
              <Icone src="/img/ui/ico_sequencia.png" tamanho={32} />
              {s.sequencia}x<span className="sr-only"> acertos seguidos</span>
            </span>
          )}
          <span className="flex items-center gap-1 font-extrabold whitespace-nowrap">
            <Icone src="/img/ui/ico_pontos.png" tamanho={32} />
            {s.pontos}
            <span className="sr-only"> pontos</span>
          </span>
          <button
            type="button"
            onClick={() => {
              tocar("clique");
              onPausa();
            }}
            aria-label="Pausar e abrir opções de acessibilidade"
            aria-keyshortcuts="Escape"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-texto-claro/60 text-lg hover:bg-white/10"
          >
            <span aria-hidden>❚❚</span>
          </button>
        </div>
      </div>
      {children}
    </header>
  );
}

// ---------- Cartão da notícia ----------

const CARIMBO: Record<Veredito, { texto: string; cor: string }> = {
  Verdadeira: { texto: "VERDADEIRA", cor: "text-verde-texto" },
  Falsa: { texto: "FALSA", cor: "text-vermelho-texto" },
  ParcialmenteVerdadeira: { texto: "MEIA VERDADE", cor: "text-[#8a5a00]" },
};

function CartaoNoticia({
  noticia,
  s,
  destaque,
  children,
}: {
  noticia: Noticia;
  s: EstadoPartida;
  destaque: boolean;
  children?: React.ReactNode;
}) {
  const autor = noticia.autor;
  const carimbo = CARIMBO[noticia.veredito];
  return (
    <article
      data-tutorial="noticia"
      aria-labelledby="noticia-titulo"
      className={`papel px-4 pt-9 pb-5 sm:px-8 ${destaque ? "destaque-tutorial z-40" : ""}`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
        {noticia.imagem && (
          <Image
            key={noticia.id}
            src={noticia.imagem}
            alt={`Imagem ilustrativa do canal: ${noticia.nomeCanal}`}
            width={800}
            height={450}
            sizes="(min-width: 768px) 40vw, 100vw"
            unoptimized={!noticia.imagem.startsWith("/")} // imagens externas de pacotes do professor
            className="aspect-video w-full rounded-lg border-2 border-papel-texto/20 object-cover shadow-md"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1
              id="noticia-titulo"
              className="font-titulo text-2xl leading-tight sm:text-3xl lg:text-4xl"
            >
              {noticia.titulo}
            </h1>
            <BotaoOuvir id="noticia" texto={textoNoticia(noticia)} className="mt-1" />
          </div>
          <p className="mt-3 text-lg leading-relaxed">{noticia.corpo}</p>
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 border-t-2 border-dashed border-papel-texto/25 pt-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-azul text-lg font-extrabold text-white"
          >
            {(autor?.nomeExibido ?? "?").replace(/^@/, "").charAt(0).toUpperCase()}
          </span>
          <dt className="font-bold">Autor:</dt>
          <dd>{autor?.nomeExibido ?? "Desconhecido"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">Publicado em:</dt>
          <dd>{noticia.nomeCanal}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">Data:</dt>
          <dd>{noticia.data}</dd>
        </div>
      </dl>

      {s.decisaoTomada && (
        <span aria-hidden className={`carimbo ${carimbo.cor}`}>
          {carimbo.texto}
        </span>
      )}
      {children}
    </article>
  );
}

// ---------- Investigação ----------

const INVESTIGACOES: { tipo: Investigacao; rotulo: string; icone: string; atalho: string }[] = [
  {
    tipo: "verificarFonte",
    rotulo: "Verificar Fonte",
    icone: "/img/ui/ico_verificar_fonte.png",
    atalho: "1",
  },
  {
    tipo: "consultarReferencia",
    rotulo: "Consultar Referência",
    icone: "/img/ui/ico_consultar_referencia.png",
    atalho: "2",
  },
  { tipo: "pesquisar", rotulo: "Pesquisar", icone: "/img/ui/ico_pesquisar.png", atalho: "3" },
];

// O status nunca depende só da cor: também tem símbolo e texto.
const STATUS: Record<StatusFonte, { simbolo: string; classe: string }> = {
  Confiavel: { simbolo: "✔", classe: "bg-verde text-white" },
  NaoConfiavel: { simbolo: "✖", classe: "bg-vermelho text-white" },
  Desconhecida: { simbolo: "?", classe: "bg-amarelo text-marinho" },
};

function PainelInvestigacao({
  s,
  onInvestigar,
  destaque,
  children,
}: {
  s: EstadoPartida;
  onInvestigar: (tipo: Investigacao) => void;
  destaque: boolean;
  children?: React.ReactNode;
}) {
  const restantes = investigacoesRestantes(s);
  const liberado = podeInvestigar(s);
  const resultado = INVESTIGACOES.find((i) => i.tipo === s.resultado);
  const noticia = noticiaAtual(s);

  let textoResultado = "";
  let corpo: React.ReactNode = null;
  if (s.resultado === "verificarFonte") {
    textoResultado = noticia.textoVerificarFonte;
    corpo = <p>{textoResultado}</p>;
  } else if (s.resultado === "pesquisar") {
    textoResultado = noticia.textoPesquisar;
    corpo = <p>{textoResultado}</p>;
  } else if (s.resultado === "consultarReferencia") {
    const f = noticia.autor;
    if (!f) {
      textoResultado = "Nenhuma informação sobre o autor.";
      corpo = <p>{textoResultado}</p>;
    } else {
      const st = STATUS[f.status];
      textoResultado = `${f.nomeExibido}. Status: ${statusTexto(f.status)}. ${f.historico}`;
      corpo = (
        <>
          <p className="flex flex-wrap items-center gap-2">
            <b>{f.nomeExibido}</b>
            <span className={`rounded-full px-3 py-0.5 text-sm font-extrabold ${st.classe}`}>
              <span aria-hidden>{st.simbolo} </span>
              {statusTexto(f.status)}
            </span>
          </p>
          <p className="mt-1">{f.historico}</p>
        </>
      );
    }
  }

  return (
    <section
      data-tutorial="investigacao"
      aria-labelledby="titulo-investigar"
      className={`relative rounded-2xl ${destaque ? "destaque-tutorial z-40" : ""}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-painel-escuro px-3 py-1.5 text-texto-claro">
        <h2 id="titulo-investigar" className="font-titulo text-xl">
          Investigar
        </h2>
        {restantes !== null && (
          <p className="flex items-center gap-2 font-bold">
            <Icone src="/img/ui/ico_investigacoes.png" tamanho={28} />
            Investigações restantes: {restantes}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {INVESTIGACOES.map(({ tipo, rotulo, icone, atalho }) => (
          <Botao
            key={tipo}
            cor="azul"
            atalho={atalho}
            className="min-h-20 flex-col gap-1 rounded-2xl px-2 text-sm sm:flex-row sm:gap-2 sm:px-4 sm:text-lg"
            disabled={!liberado || s.investigacoesUsadas.includes(tipo)}
            onClick={() => onInvestigar(tipo)}
          >
            <Icone src={icone} tamanho={36} />
            <span className="text-center">{rotulo}</span>
          </Botao>
        ))}
      </div>

      <div
        aria-live="polite"
        className="mt-3 min-h-28 rounded-2xl border-3 border-amarelo bg-painel-escuro px-4 py-3 text-lg leading-snug text-texto-claro sm:px-6"
      >
        {resultado ? (
          <>
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-extrabold text-amarelo">
                <Icone src={resultado.icone} tamanho={28} />
                {resultado.rotulo}
              </h3>
              <BotaoOuvir id="resultado" texto={`${resultado.rotulo}. ${textoResultado}`} />
            </div>
            {corpo}
          </>
        ) : (
          <p className="flex min-h-20 items-center justify-center text-center text-texto-sutil">
            Escolha uma investigação para ver o resultado aqui.
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

// ---------- Decisão (barra fixa no celular, ao alcance do polegar) ----------

function BarraDecisao({
  s,
  onDecidir,
  destaque,
  children,
}: {
  s: EstadoPartida;
  onDecidir: (compartilhar: boolean) => void;
  destaque: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      data-tutorial="decisao"
      aria-label="Decisão"
      className={`fixed inset-x-0 bottom-0 border-t-2 border-amarelo/50 bg-painel-escuro px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:relative lg:rounded-2xl lg:border-0 lg:bg-transparent lg:p-0 ${
        destaque ? "destaque-tutorial z-40" : "z-20 lg:z-auto"
      }`}
    >
      <div className="mx-auto flex max-w-3xl gap-3 sm:gap-8">
        <Botao
          cor="verde"
          atalho="C"
          className="flex-1 py-3 text-lg sm:text-2xl"
          disabled={s.decisaoTomada}
          onClick={() => onDecidir(true)}
        >
          <Icone src="/img/ui/ico_compartilhar.png" tamanho={36} className="max-sm:hidden" />
          Compartilhar
        </Botao>
        <Botao
          cor="vermelho"
          atalho="N"
          className="flex-1 py-3 text-lg sm:text-2xl"
          disabled={s.decisaoTomada}
          onClick={() => onDecidir(false)}
        >
          <Icone src="/img/ui/ico_bloquear.png" tamanho={36} className="max-sm:hidden" />
          Não Propagar
        </Botao>
      </div>
      <p
        aria-live="polite"
        className="mx-auto mt-2 w-fit max-w-full rounded-full bg-black/70 px-4 text-center text-sm font-bold empty:hidden sm:text-base"
        style={{ color: s.feedback?.acertou ? "#7ee08a" : "#ff9a9a" }}
      >
        {s.feedback?.texto}
      </p>
      {children}
    </section>
  );
}

// ---------- Tutorial ----------

function DicaTutorial({
  passo,
  onProximo,
  onPular,
}: {
  passo: number;
  onProximo: () => void;
  onPular: () => void;
}) {
  const dica = TUTORIAL[passo];
  const ultimo = passo === TUTORIAL.length - 1;
  return (
    <div
      role="dialog"
      aria-label={`Tutorial, passo ${passo + 1} de ${TUTORIAL.length}`}
      className={`papel surgir absolute inset-x-0 z-50 mx-auto w-[min(calc(100%-1rem),30rem)] px-5 pt-8 pb-4 text-left ${
        dica.acima ? "bottom-full mb-5" : "top-full mt-5"
      }`}
    >
      <p className="text-sm font-bold opacity-70">
        Passo {passo + 1} de {TUTORIAL.length}
      </p>
      <h2 className="font-titulo text-2xl">{dica.titulo}</h2>
      <p className="mt-1 text-lg leading-snug">{dica.texto}</p>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onPular}
          className="cursor-pointer px-2 font-bold underline underline-offset-4"
        >
          Pular tutorial
        </button>
        <Botao cor="amarelo" onClick={onProximo} autoFocus key={passo}>
          {ultimo ? "Entendi, vamos lá!" : "Próximo"}
        </Botao>
      </div>
    </div>
  );
}

// ---------- Painéis modais ----------

const ICONES_VEREDITO: Record<Veredito, string> = {
  Verdadeira: "/img/ui/ico_verdadeiro.png",
  Falsa: "/img/ui/ico_falso.png",
  ParcialmenteVerdadeira: "/img/ui/ico_parcial.png",
};

function Explicacao({
  s,
  sinaisNovos,
  onProxima,
}: {
  s: EstadoPartida;
  sinaisNovos: string[];
  onProxima: () => void;
}) {
  const noticia = noticiaAtual(s);
  return (
    <Modal rotulo="Explicação" atrasado>
      <Painel
        titulo={s.acertouUltima ? "Você acertou!" : "Você errou!"}
        corTitulo={s.acertouUltima ? "text-verde-texto" : "text-vermelho-texto"}
        largura="max-w-3xl"
      >
        <p className="flex items-center gap-3 text-xl font-extrabold sm:text-2xl">
          <Icone src={ICONES_VEREDITO[noticia.veredito]} tamanho={52} />
          Esta notícia é {vereditoTexto(noticia.veredito)}
        </p>
        <p className="text-lg leading-relaxed">{noticia.explicacao}</p>
        <div className="w-full rounded-2xl bg-black/5 px-4 py-3">
          <p className="mb-2 font-bold">O que observar nesta notícia:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {noticia.sinais.map((sinal) => (
              <ChipSinal key={sinal.id} sinal={sinal} novo={sinaisNovos.includes(sinal.id)} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <BotaoOuvir
            id="explicacao"
            texto={textoExplicacao(noticia, s.acertouUltima)}
            className="px-4 py-2 text-base"
          />
          <Botao cor="amarelo" className="text-xl" onClick={onProxima} autoFocus>
            Próxima notícia →
          </Botao>
        </div>
      </Painel>
    </Modal>
  );
}

function Resumo({
  linhas,
  novoRecorde,
}: {
  linhas: [string, string | number][];
  novoRecorde: boolean;
}) {
  return (
    <>
      <dl className="grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-8 gap-y-1 text-left text-xl">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt>{rotulo}:</dt>
            <dd className="text-right font-extrabold">{valor}</dd>
          </div>
        ))}
      </dl>
      {novoRecorde && (
        <p className="rounded-full bg-amarelo px-6 py-1 text-lg font-extrabold text-marinho">
          Novo recorde nesta fase!
        </p>
      )}
    </>
  );
}
