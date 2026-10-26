"use client";

import { pararMusicaMenu, tocar } from "@/lib/audio";
import { alterarPreferencias, usePreferencias, type Preferencias } from "@/lib/preferencias";
import { pararFala, vozDisponivel } from "@/lib/voz";
import { Interruptor } from "./ui";

const TAMANHOS: { valor: Preferencias["fonte"]; rotulo: string; nome: string }[] = [
  { valor: 0, rotulo: "A", nome: "Texto normal" },
  { valor: 1, rotulo: "A+", nome: "Texto grande" },
  { valor: 2, rotulo: "A++", nome: "Texto muito grande" },
];

// Conteúdo do painel de acessibilidade; usado no menu e na pausa da partida.
export default function OpcoesAcessibilidade() {
  const p = usePreferencias();
  const temVoz = vozDisponivel();

  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <fieldset className="px-3">
        <legend className="mb-2 font-bold">Tamanho do texto</legend>
        <div className="flex gap-2">
          {TAMANHOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              aria-pressed={p.fonte === t.valor}
              aria-label={t.nome}
              onClick={() => {
                tocar("clique");
                alterarPreferencias({ fonte: t.valor });
              }}
              className={`min-h-12 flex-1 cursor-pointer rounded-xl border-3 border-papel-texto font-extrabold ${
                p.fonte === t.valor ? "bg-papel-texto text-papel-fundo" : "hover:bg-black/5"
              }`}
              style={{ fontSize: `${1 + t.valor * 0.25}rem` }}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      <Interruptor
        rotulo="Alto contraste"
        descricao="Fundos sólidos, texto preto e branco, bordas mais fortes."
        ligado={p.contraste}
        onMudar={(v) => alterarPreferencias({ contraste: v })}
      />
      <Interruptor
        rotulo="Reduzir animações"
        descricao="Desliga carimbo animado, transições e destaques pulsantes."
        ligado={p.reduzirMovimento}
        onMudar={(v) => alterarPreferencias({ reduzirMovimento: v })}
      />
      <Interruptor
        rotulo="Som"
        descricao="Efeitos sonoros e música do menu."
        ligado={p.som}
        onMudar={(v) => {
          alterarPreferencias({ som: v });
          if (!v) pararMusicaMenu();
        }}
      />
      <Interruptor
        rotulo="Legendas de som"
        descricao="Mostra um aviso na tela quando toca um som de acerto, erro ou fim de fase."
        ligado={p.legendas}
        onMudar={(v) => alterarPreferencias({ legendas: v })}
      />
      <Interruptor
        rotulo="Leitura automática em voz alta"
        descricao={
          temVoz
            ? "Lê cada notícia e cada explicação assim que aparecem. O botão “Ouvir” funciona sempre."
            : "Seu navegador não oferece síntese de voz."
        }
        ligado={p.leituraAutomatica && temVoz}
        desabilitado={!temVoz}
        onMudar={(v) => {
          alterarPreferencias({ leituraAutomatica: v });
          if (!v) pararFala();
        }}
      />

      <button
        type="button"
        onClick={() => {
          tocar("clique");
          alterarPreferencias({ introVista: false, tutorialVisto: false });
        }}
        disabled={!p.introVista && !p.tutorialVisto}
        className="mx-3 mt-1 cursor-pointer self-start rounded-full border-2 border-papel-texto px-4 py-2 font-bold hover:bg-black/5 disabled:cursor-default disabled:opacity-50"
      >
        {p.introVista || p.tutorialVisto
          ? "Rever introdução e tutorial na próxima partida"
          : "Introdução e tutorial aparecerão na próxima partida"}
      </button>
    </div>
  );
}
