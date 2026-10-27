"use client";

import { Botao, BotaoOuvir, Fundo } from "./ui";

// Abertura da história: a coordenadora da agência de checagem contrata o jogador.
const PARAGRAFOS = [
  "Bem-vindo(a) ao Paulo Afonso Checa!",
  "Nas últimas semanas, boatos tomaram conta da cidade. Gente faltou ao trabalho por causa de um feriado que não existia, e teve quem perdesse dinheiro clicando em link falso de banco.",
  "A comunidade precisa de alguém que separe fato de boato. A partir de hoje, esse alguém é você.",
  "Todos os dias chegam notícias pelo WhatsApp, redes sociais, blogs e sites. Investigue antes de decidir: compartilhe só o que for totalmente verdadeiro e segure o que for falso ou distorcido.",
  "Cada acerto aumenta a confiança da comunidade no nosso trabalho. Cada erro… bem, vamos torcer para que não sejam muitos.",
  "Boa caçada!",
];

export default function Intro({ onComecar }: { onComecar: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Fundo src="/img/ui/bg_gameplay.png" />
      <article
        aria-labelledby="intro-titulo"
        className="papel surgir w-full max-w-2xl px-6 pt-12 pb-8 sm:px-12"
      >
        <header className="mb-5 flex flex-wrap items-center gap-4 border-b-2 border-dashed border-papel-texto/30 pb-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-azul font-titulo text-2xl text-white"
          >
            MR
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-wide uppercase opacity-70">Nova mensagem</p>
            <h1 id="intro-titulo" className="font-titulo text-2xl leading-tight sm:text-3xl">
              Marta Ribeiro
            </h1>
            <p className="text-sm">Coordenadora do Paulo Afonso Checa</p>
          </div>
          <BotaoOuvir id="intro" texto={PARAGRAFOS.join(" ")} />
        </header>
        <div className="space-y-3 text-lg leading-relaxed">
          {PARAGRAFOS.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Botao cor="amarelo" className="text-xl" onClick={onComecar} autoFocus>
            Aceitar o desafio
          </Botao>
        </div>
      </article>
    </div>
  );
}
