"use client";

import Image from "next/image";
import { useState } from "react";
import { aproveitamento, calcularSelo, SELOS } from "@/lib/classificacao";
import { conteudo } from "@/lib/conteudo";
import { lerSinaisDescobertos } from "@/lib/memoria";
import type { ResumoFase } from "./Partida";
import { Botao, Fundo } from "./ui";

// "Fase 2 – Meia verdade" -> "Fase 2"
function nomeCurto(nomeFase: string) {
  const corte = nomeFase.search(/[–\-:]/);
  return corte > 0 ? nomeFase.slice(0, corte).trim() : nomeFase;
}

// Tela de conclusão: selo de desempenho da jornada inteira (como no protótipo) e certificado
// imprimível com o nome do jogador.
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

  const acertos = jornada.reduce((t, f) => t + f.acertos, 0);
  const erros = jornada.reduce((t, f) => t + f.erros, 0);
  const pontos = jornada.reduce((t, f) => t + f.pontos, 0);
  const melhorSequencia = Math.max(0, ...jornada.map((f) => f.melhorSequencia));
  const selo = SELOS[calcularSelo(acertos, erros)];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Fundo src="/img/ui/bg_fimdefase.png" />

      <article
        aria-labelledby="cert-titulo"
        className="imprimir papel surgir w-full max-w-3xl px-5 pt-12 pb-10 text-center sm:px-12"
      >
        <div className="rounded-xl border-4 border-double border-papel-texto/60 px-4 py-8 sm:px-8">
          <p className="text-sm font-bold tracking-[0.2em] uppercase">Vale Verde Checa</p>
          <h1 id="cert-titulo" className="mt-1 font-titulo text-4xl text-azul sm:text-6xl">
            Jornada concluída!
          </h1>

          <Image
            src={selo.imagem}
            alt=""
            width={512}
            height={512}
            priority
            className="mx-auto mt-4 h-auto w-40 drop-shadow-lg sm:w-48"
          />
          <p className="font-titulo text-4xl sm:text-5xl" style={{ color: selo.cor }}>
            <span className="sr-only">Selo recebido: </span>
            {selo.titulo}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-lg">{selo.descricao}</p>

          <table className="mx-auto mt-6 w-full max-w-md text-lg">
            <caption className="sr-only">Resultado por fase</caption>
            <thead>
              <tr className="border-b-2 border-papel-texto/30">
                <th scope="col" className="py-1 text-left">
                  Fase
                </th>
                <th scope="col">Acertos</th>
                <th scope="col">Erros</th>
                <th scope="col" className="text-right">
                  Pontos
                </th>
              </tr>
            </thead>
            <tbody>
              {jornada.map((f) => (
                <tr key={f.faseId}>
                  <th scope="row" className="py-0.5 text-left font-normal">
                    {nomeCurto(f.nomeFase)}
                  </th>
                  <td className="font-bold text-verde-texto">{f.acertos}</td>
                  <td className="font-bold text-vermelho-texto">{f.erros}</td>
                  <td className="text-right">{f.pontos}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-papel-texto/30 font-extrabold">
                <th scope="row" className="py-1 text-left">
                  Total
                </th>
                <td className="text-verde-texto">{acertos}</td>
                <td className="text-vermelho-texto">{erros}</td>
                <td className="text-right">{pontos}</td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-4 text-lg">
            Aproveitamento: <b>{Math.round(aproveitamento(acertos, erros))}%</b> ({acertos} de{" "}
            {acertos + erros} notícias) · Melhor sequência: <b>{melhorSequencia}</b> · Sinais
            aprendidos:{" "}
            <b>
              {sinais}/{conteudo().sinais.length}
            </b>
          </p>

          <div className="mt-8 border-t-2 border-dashed border-papel-texto/30 pt-6">
            <p className="text-lg">Certificamos que</p>
            <p className="mx-auto mt-1 min-h-[1.5em] max-w-lg border-b-2 border-papel-texto font-titulo text-4xl">
              {nome.trim() || " "}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed">
              concluiu as {jornada.length} fases do Fake Hunter como checador(a) de fatos da
              comunidade de Vale Verde.
            </p>
            <p className="mt-2 text-sm">{hoje}</p>
          </div>
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
            <Botao cor="azul" icone="repetir" className="text-xl" onClick={onJogarDeNovo}>
              Jogar de novo
            </Botao>
            <Botao cor="amarelo" icone="menu" className="text-xl" onClick={onMenu}>
              Menu
            </Botao>
            <Botao cor="claro" className="text-xl" onClick={() => window.print()}>
              Imprimir / salvar PDF
            </Botao>
          </div>
        </div>
      </article>
    </div>
  );
}
