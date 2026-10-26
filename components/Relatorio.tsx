"use client";

import { useState } from "react";
import { conteudo, vereditoTexto, type Veredito } from "@/lib/conteudo";
import { apagarRelatorio, lerRelatorio, type RegistroDecisao } from "@/lib/memoria";
import { Botao } from "./ui";

// Relatório das decisões salvas neste navegador. Serve para os testes com usuários:
// mostra onde os jogadores mais erram e exporta os dados brutos em CSV.

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nome });
  a.click();
  URL.revokeObjectURL(url);
}

function paraCsv(registros: RegistroDecisao[]) {
  const colunas = [
    "quando",
    "fase",
    "noticia",
    "veredito",
    "compartilhou",
    "acertou",
    "investigacoes",
    "segundos",
  ];
  const linhas = registros.map((r) =>
    [
      r.quando,
      r.fase,
      r.noticia,
      r.veredito,
      r.compartilhou,
      r.acertou,
      r.investigacoes.join("+"),
      r.segundos,
    ]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(","),
  );
  // BOM para o Excel reconhecer os acentos.
  return "﻿" + [colunas.join(","), ...linhas].join("\n");
}

function pct(parte: number, total: number) {
  return total ? `${Math.round((parte / total) * 100)}%` : "–";
}

export default function Relatorio() {
  const [registros, setRegistros] = useState(lerRelatorio);
  const titulos = new Map(conteudo().noticias.map((n) => [n.id, n.titulo]));

  if (registros.length === 0) {
    return (
      <p className="text-lg">
        Nenhuma decisão registrada ainda neste navegador. Jogue uma partida e volte aqui.
      </p>
    );
  }

  const acertos = registros.filter((r) => r.acertou).length;
  const media = (f: (r: RegistroDecisao) => number) =>
    (registros.reduce((t, r) => t + f(r), 0) / registros.length).toFixed(1).replace(".", ",");

  const porVeredito = (["Verdadeira", "Falsa", "ParcialmenteVerdadeira"] as Veredito[]).map((v) => {
    const doTipo = registros.filter((r) => r.veredito === v);
    return { v, total: doTipo.length, acertos: doTipo.filter((r) => r.acertou).length };
  });

  const porNoticia = new Map<string, { total: number; erros: number }>();
  for (const r of registros) {
    const n = porNoticia.get(r.noticia) ?? { total: 0, erros: 0 };
    n.total++;
    if (!r.acertou) n.erros++;
    porNoticia.set(r.noticia, n);
  }
  const maisErradas = [...porNoticia.entries()]
    .filter(([, n]) => n.erros > 0)
    .sort((a, b) => b[1].erros / b[1].total - a[1].erros / a[1].total || b[1].erros - a[1].erros)
    .slice(0, 5);

  const semInvestigar = registros.filter((r) => r.investigacoes.length === 0);

  return (
    <div className="flex w-full flex-col gap-5 text-left">
      <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[
          ["Decisões", registros.length],
          ["Acertos", pct(acertos, registros.length)],
          ["Investigações por notícia", media((r) => r.investigacoes.length)],
          ["Segundos por notícia", media((r) => r.segundos)],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl bg-black/5 px-2 py-3">
            <dt className="text-sm">{rotulo}</dt>
            <dd className="font-titulo text-2xl">{valor}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="mb-1 font-titulo text-xl">Acerto por tipo de notícia</h3>
        <ul>
          {porVeredito.map(({ v, total, acertos }) => (
            <li key={v}>
              {vereditoTexto(v)}: <b>{pct(acertos, total)}</b> ({acertos} de {total})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 font-titulo text-xl">Notícias com mais erros</h3>
        {maisErradas.length ? (
          <ol className="list-decimal pl-6">
            {maisErradas.map(([id, n]) => (
              <li key={id}>
                “{titulos.get(id) ?? id}”: <b>{pct(n.erros, n.total)}</b> de erro ({n.erros}/
                {n.total})
              </li>
            ))}
          </ol>
        ) : (
          <p>Nenhum erro registrado.</p>
        )}
      </section>

      <section>
        <h3 className="mb-1 font-titulo text-xl">Decidir sem investigar</h3>
        <p>
          {semInvestigar.length} decisões sem nenhuma investigação, com{" "}
          <b>{pct(semInvestigar.filter((r) => r.acertou).length, semInvestigar.length)}</b> de
          acerto (contra {pct(acertos, registros.length)} no geral).
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Botao
          cor="amarelo"
          onClick={() =>
            baixar("fake-hunter-relatorio.csv", paraCsv(registros), "text/csv;charset=utf-8")
          }
        >
          Baixar CSV
        </Botao>
        <Botao
          cor="claro"
          onClick={() => {
            if (confirm("Apagar todas as decisões registradas neste navegador?")) {
              apagarRelatorio();
              setRegistros([]);
            }
          }}
        >
          Apagar dados
        </Botao>
      </div>
      <p className="text-sm opacity-80">
        Os dados ficam só neste navegador; nada é enviado para a internet.
      </p>
    </div>
  );
}
