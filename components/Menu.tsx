"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { iniciarMusicaMenu, pararMusicaMenu } from "@/lib/audio";
import { SELOS, type Selo } from "@/lib/classificacao";
import OpcoesAcessibilidade from "./Acessibilidade";
import Caderno from "./Caderno";
import ModoProfessor from "./ModoProfessor";
import Relatorio from "./Relatorio";
import { Botao, Fundo, Modal, Painel } from "./ui";

type Painel = "comoJogar" | "caderno" | "acessibilidade" | "relatorio" | "professor" | null;

export default function Menu({ onJogar }: { onJogar: () => void }) {
  const [painel, setPainel] = useState<Painel>(null);
  const [despedida, setDespedida] = useState(false);
  const fechar = () => setPainel(null);

  // O navegador só libera áudio depois de uma interação, então a música
  // começa no primeiro clique/tecla dentro do menu.
  useEffect(() => {
    iniciarMusicaMenu();
    window.addEventListener("pointerdown", iniciarMusicaMenu);
    window.addEventListener("keydown", iniciarMusicaMenu);
    return () => {
      window.removeEventListener("pointerdown", iniciarMusicaMenu);
      window.removeEventListener("keydown", iniciarMusicaMenu);
      pararMusicaMenu();
    };
  }, []);

  function sair() {
    // Só funciona em janelas abertas por script; caso contrário, mostra a despedida.
    window.close();
    setDespedida(true);
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Fundo src="/img/ui/bg_menu.png" />
      {/* Escurece o lado esquerdo para o menu ficar legível sobre a ilustração. */}
      <div
        aria-hidden
        className="fundo-img fixed inset-0 -z-10 bg-gradient-to-r from-marinho/90 via-marinho/60 to-transparent max-lg:bg-marinho/70"
      />

      <main
        inert={painel !== null}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 lg:w-1/2 lg:max-w-3xl"
      >
        <h1 className="sr-only">Fake Hunter</h1>
        <Image
          src="/img/ui/logo_fakehunter.png"
          alt="Fake Hunter"
          width={820}
          height={626}
          priority
          className="h-auto w-64 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] sm:w-96"
        />
        <p className="max-w-md text-center text-lg font-semibold text-texto-claro">
          Seja o checador de fatos de Paulo Afonso: investigue cada notícia antes de decidir se ela
          merece ser compartilhada.
        </p>
        <nav aria-label="Menu principal" className="flex w-full max-w-xs flex-col gap-4">
          <Botao cor="verde" icone="jogar" className="text-3xl" onClick={onJogar} autoFocus>
            Jogar
          </Botao>
          <Botao
            cor="azul"
            icone="ajuda"
            className="text-2xl"
            onClick={() => setPainel("comoJogar")}
          >
            Como jogar
          </Botao>
          <Botao cor="azul" className="text-2xl" onClick={() => setPainel("caderno")}>
            Caderno do Checador
          </Botao>
          <Botao cor="azul" className="text-2xl" onClick={() => setPainel("acessibilidade")}>
            Acessibilidade
          </Botao>
          <Botao cor="azul" className="text-2xl" onClick={() => setPainel("relatorio")}>
            Relatório de partidas
          </Botao>
          <Botao cor="azul" className="text-2xl" onClick={() => setPainel("professor")}>
            Modo professor
          </Botao>
          <Botao cor="vermelho" icone="sair" className="text-2xl" onClick={sair}>
            Sair
          </Botao>
        </nav>
        {despedida && (
          <p role="status" className="text-center text-lg font-bold text-amarelo">
            Obrigado por jogar! Você já pode fechar esta aba.
          </p>
        )}
      </main>

      <footer className="px-4 pb-4 text-center text-sm text-texto-sutil lg:text-left">
        Projeto acadêmico – Fake Hunter
      </footer>

      {painel === "comoJogar" && <ComoJogar onFechar={fechar} />}

      {painel === "caderno" && (
        <Modal rotulo="Caderno do Checador" onFechar={fechar}>
          <Painel titulo="Caderno do Checador">
            <Caderno />
            <Botao cor="amarelo" icone="fechar" className="text-xl" onClick={fechar} autoFocus>
              Fechar
            </Botao>
          </Painel>
        </Modal>
      )}

      {painel === "relatorio" && (
        <Modal rotulo="Relatório de partidas" onFechar={fechar}>
          <Painel titulo="Relatório de partidas" largura="max-w-3xl">
            <Relatorio />
            <Botao cor="amarelo" icone="fechar" className="text-xl" onClick={fechar} autoFocus>
              Fechar
            </Botao>
          </Painel>
        </Modal>
      )}

      {painel === "professor" && (
        <Modal rotulo="Modo professor" onFechar={fechar}>
          <Painel titulo="Modo professor">
            <ModoProfessor />
            <Botao cor="amarelo" icone="fechar" className="text-xl" onClick={fechar} autoFocus>
              Fechar
            </Botao>
          </Painel>
        </Modal>
      )}

      {painel === "acessibilidade" && (
        <Modal rotulo="Acessibilidade" onFechar={fechar}>
          <Painel titulo="Acessibilidade">
            <OpcoesAcessibilidade />
            <Botao cor="amarelo" icone="fechar" className="text-xl" onClick={fechar} autoFocus>
              Fechar
            </Botao>
          </Painel>
        </Modal>
      )}
    </div>
  );
}

// Ordem da página de selos: do melhor para o pior desempenho.
const ORDEM_SELOS: Selo[] = [
  "Especialista",
  "CacadorVoraz",
  "CacadorVegetariano",
  "CacadoPelasFakeNews",
];

// "Como jogar" em duas páginas: regras e selos. A página de selos não revela os números,
// para o jogador não jogar "contando" acertos.
function ComoJogar({ onFechar }: { onFechar: () => void }) {
  const [pagina, setPagina] = useState<"regras" | "selos">("regras");
  return (
    <Modal rotulo={pagina === "regras" ? "Como jogar" : "Selos"} onFechar={onFechar}>
      <Painel titulo={pagina === "regras" ? "Como jogar" : "Selos"}>
        {pagina === "regras" ? (
          <div className="space-y-4 text-left text-lg leading-snug">
            <p>Você é o novo checador de fatos da comunidade.</p>
            <p>
              A cada notícia, use até 2 investigações (Verificar Fonte, Consultar Referência ou
              Pesquisar) e decida: <b>Compartilhar</b> ou <b>Não Propagar</b>.
            </p>
            <p>
              Só compartilhe o que for totalmente verdadeiro. Notícias parcialmente verdadeiras
              também espalham desinformação.
            </p>
            <p>Cada erro derruba a confiança da comunidade. Se chegar a zero, você é demitido!</p>
            <p>
              Depois de cada decisão, você descobre os sinais que entregavam a notícia. Eles ficam
              guardados no <b>Caderno do Checador</b>.
            </p>
            <div className="rounded-xl bg-black/5 p-4 text-base">
              <p className="mb-2 font-bold">Atalhos de teclado</p>
              <ul className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <li className="contents">
                  <kbd className="font-bold">1 2 3</kbd>
                  <span>Verificar Fonte, Consultar Referência, Pesquisar</span>
                </li>
                <li className="contents">
                  <kbd className="font-bold">C</kbd>
                  <span>Compartilhar</span>
                </li>
                <li className="contents">
                  <kbd className="font-bold">N</kbd>
                  <span>Não Propagar</span>
                </li>
                <li className="contents">
                  <kbd className="font-bold">L</kbd>
                  <span>Ouvir a notícia em voz alta</span>
                </li>
                <li className="contents">
                  <kbd className="font-bold">D</kbd>
                  <span>Abrir a dica (nas fases que têm dica)</span>
                </li>
                <li className="contents">
                  <kbd className="font-bold">Esc</kbd>
                  <span>Pausar / fechar painéis</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="w-full text-left text-lg">
            <p className="mb-4">
              No fim do jogo, você recebe um selo de acordo com o seu desempenho em todas as fases:
            </p>
            <ul className="flex flex-col gap-3">
              {ORDEM_SELOS.map((id) => {
                const selo = SELOS[id];
                return (
                  <li key={id} className="flex items-center gap-4 rounded-2xl bg-black/5 px-3 py-2">
                    <Image
                      src={selo.imagem}
                      alt=""
                      width={512}
                      height={512}
                      className="h-16 w-16 shrink-0"
                    />
                    <div>
                      <p className="font-titulo text-3xl leading-none" style={{ color: selo.cor }}>
                        {selo.titulo}
                      </p>
                      <p>{selo.descricaoCurta}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          <Botao cor="amarelo" icone="fechar" className="text-xl" onClick={onFechar}>
            Fechar
          </Botao>
          {pagina === "regras" ? (
            <Botao
              cor="azul"
              icone="proxima"
              iconeADireita
              className="text-xl"
              onClick={() => setPagina("selos")}
              autoFocus
            >
              Selos
            </Botao>
          ) : (
            <Botao
              cor="azul"
              icone="voltar"
              className="text-xl"
              onClick={() => setPagina("regras")}
              autoFocus
            >
              Voltar
            </Botao>
          )}
        </div>
      </Painel>
    </Modal>
  );
}
