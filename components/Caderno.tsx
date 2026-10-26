"use client";

import { useState } from "react";
import { conteudo, type Sinal } from "@/lib/conteudo";
import { lerSinaisDescobertos } from "@/lib/memoria";

export function ChipSinal({ sinal, novo = false }: { sinal: Sinal; novo?: boolean }) {
  const alerta = sinal.tipo === "alerta";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold ${
        alerta
          ? "border-vermelho-texto bg-vermelho/10 text-vermelho-texto"
          : "border-verde-texto bg-verde/10 text-verde-texto"
      }`}
    >
      <span aria-hidden>{alerta ? "⚠" : "✔"}</span>
      <span className="sr-only">{alerta ? "Sinal de alerta:" : "Boa prática:"}</span>
      {sinal.nome}
      {novo && (
        <span className="rounded-full bg-amarelo px-2 text-xs text-marinho">novo no caderno!</span>
      )}
    </span>
  );
}

// Lista do Caderno do Checador: sinais descobertos ficam visíveis, os outros aparecem bloqueados.
export default function Caderno() {
  const [descobertos] = useState(() => new Set(lerSinaisDescobertos()));
  const { sinais, noticias } = conteudo();

  const grupos: { titulo: string; tipo: Sinal["tipo"] }[] = [
    { titulo: "Sinais de alerta", tipo: "alerta" },
    { titulo: "Boas práticas de checagem", tipo: "boa-pratica" },
  ];

  return (
    <div className="w-full text-left">
      <p className="mb-4 text-center font-bold">
        {descobertos.size} de {sinais.length} anotações descobertas
      </p>
      {grupos.map((g) => (
        <section key={g.tipo} className="mb-5">
          <h3 className="mb-2 font-titulo text-2xl">{g.titulo}</h3>
          <ul className="flex flex-col gap-2">
            {sinais
              .filter((s) => s.tipo === g.tipo)
              .map((s) => {
                const visto = descobertos.has(s.id);
                const exemplo = noticias.find((n) => n.sinais.includes(s));
                return (
                  <li
                    key={s.id}
                    className="rounded-xl border-2 border-dashed border-papel-texto/40 bg-white/40 px-4 py-3"
                  >
                    {visto ? (
                      <>
                        <ChipSinal sinal={s} />
                        <p className="mt-1.5">{s.descricao}</p>
                        {exemplo && (
                          <p className="mt-1 text-sm italic opacity-80">
                            Exemplo: “{exemplo.titulo}”
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="font-bold opacity-70">
                        <span aria-hidden>🔒 </span>Anotação bloqueada — aparece ao concluir uma
                        notícia que mostra este sinal.
                      </p>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
