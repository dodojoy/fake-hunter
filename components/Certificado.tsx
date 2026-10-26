"use client";

import Image from "next/image";
import { useState } from "react";
import { conteudo } from "@/lib/conteudo";
import { lerSinaisDescobertos } from "@/lib/memoria";
import type { ResumoFase } from "./Partida";
import { Botao, Fundo } from "./ui";

function nivel(taxa: number) {
  if (taxa >= 0.9) return "Caçador(a) Lendário(a)";
  if (taxa >= 0.7) return "Caçador(a) Experiente";
  return "Caçador(a) Aprendiz";
}

export default function Certificado({
  jornada,
  onJogarDeNovo,
  onMenu,
}: {
  jornada: ResumoFase[];
  onJogarDeNovo: () => void;
  onMenu: () => void;
}) {
  const [nome, setNome] = useState("");
  const [sinais] = useState(() => lerSinaisDescobertos().length);
  const [hoje] = useState(() =>
    new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }),
  );

  const total = conteudo().totalNoticias;
  const pontos = jornada.reduce((t, f) => t + f.pontos, 0);
  const acertos = jornada.reduce((t, f) => t + f.acertos, 0);
  const melhorSequencia = Math.max(0, ...jornada.map((f) => f.melhorSequencia));
  const taxa = acertos / total;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Fundo src="/img/ui/bg_fimdefase.png" />

      <article
        aria-labelledby="cert-titulo"
        className="imprimir papel surgir w-full max-w-3xl px-6 pt-12 pb-10 text-center sm:px-14"
      >
        <div className="rounded-xl border-4 border-double border-papel-texto/60 px-4 py-8 sm:px-10">
          <Image
            src="/img/ui/logo_fakehunter.png"
            alt=""
            width={820}
            height={626}
            className="mx-auto h-auto w-32"
          />
          <p className="mt-2 text-sm font-bold tracking-[0.2em] uppercase">Vale Verde Checa</p>
          <h1 id="cert-titulo" className="mt-2 font-titulo text-3xl text-azul sm:text-5xl">
            Certificado de Caçador de Fake News
          </h1>
          <p className="mt-6 text-lg">Certificamos que</p>
          <p className="mx-auto mt-1 min-h-[1.5em] max-w-lg border-b-2 border-papel-texto font-titulo text-3xl">
            {nome.trim() || " "}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed">
            concluiu as {jornada.length} fases do Fake Hunter como checador(a) de fatos da
            comunidade de Vale Verde, protegendo a cidade da desinformação.
          </p>

          <dl className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Pontuação", pontos],
              ["Acertos", `${acertos}/${total}`],
              ["Melhor sequência", melhorSequencia],
              ["Sinais aprendidos", `${sinais}/${conteudo().sinais.length}`],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="rounded-xl bg-black/5 px-2 py-3">
                <dt className="text-sm">{rotulo}</dt>
                <dd className="font-titulo text-2xl">{valor}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-xl font-extrabold text-verde-texto">Nível: {nivel(taxa)}</p>
          <p className="mt-2 text-sm">{hoje}</p>
        </div>

        <div className="nao-imprimir mt-8 flex flex-col items-center gap-4">
          <label className="flex w-full max-w-sm flex-col gap-1 text-left font-bold">
            Seu nome no certificado
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={60}
              autoComplete="name"
              className="rounded-xl border-3 border-papel-texto bg-white px-4 py-3 text-lg font-normal text-black"
            />
          </label>
          <div className="flex flex-wrap justify-center gap-4">
            <Botao cor="amarelo" className="text-lg" onClick={() => window.print()}>
              Imprimir / salvar PDF
            </Botao>
            <Botao cor="azul" className="text-lg" onClick={onJogarDeNovo}>
              Jogar de novo
            </Botao>
            <Botao cor="claro" className="text-lg" onClick={onMenu}>
              Menu
            </Botao>
          </div>
        </div>
      </article>
    </div>
  );
}
