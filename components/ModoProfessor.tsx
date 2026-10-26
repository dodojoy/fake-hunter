"use client";

import { useState, type ChangeEvent } from "react";
import { conteudo, ehErroConteudo, pacoteAtivo, restaurarPadrao, usarPacote } from "@/lib/conteudo";
import { tocar } from "@/lib/audio";
import { Botao } from "./ui";

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

function baixarModelo() {
  const json = JSON.stringify(pacoteAtivo(), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `fake-hunter-pacote-${conteudo().id}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// Permite a professores trocarem as notícias do jogo por um pacote JSON próprio,
// sem mexer no código. O pacote fica salvo neste navegador.
export default function ModoProfessor() {
  const [ativo, setAtivo] = useState(conteudo);
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);

  async function carregar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO) {
      setMensagem({ ok: false, texto: "Arquivo grande demais (máximo de 5 MB)." });
      return;
    }
    try {
      const novo = usarPacote(JSON.parse(await arquivo.text()));
      setAtivo(novo);
      tocar("acerto");
      setMensagem({ ok: true, texto: `Pacote “${novo.titulo}” carregado. Bom jogo!` });
    } catch (erro) {
      const texto =
        erro instanceof SyntaxError
          ? "O arquivo não é um JSON válido. Confira vírgulas, aspas e chaves."
          : ehErroConteudo(erro)
            ? erro.message
            : "Não foi possível ler o arquivo.";
      setMensagem({ ok: false, texto: `Pacote não carregado: ${texto}` });
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 text-left text-lg">
      <p>
        Use suas próprias notícias em sala de aula: baixe o modelo, edite os textos (em qualquer
        editor de texto) e carregue o arquivo aqui. O formato é o mesmo dos arquivos em{" "}
        <code className="rounded bg-black/10 px-1">data/</code> do projeto, explicado na
        documentação.
      </p>

      <div className="rounded-2xl bg-black/5 px-4 py-3">
        <p className="text-sm font-bold tracking-wide uppercase opacity-70">Conteúdo em uso</p>
        <p className="font-titulo text-2xl">{ativo.titulo}</p>
        <p>
          {plural(ativo.fases.size, "fase", "fases")} ·{" "}
          {plural(ativo.totalNoticias, "notícia", "notícias")} ·{" "}
          {plural(ativo.sinais.length, "sinal", "sinais")} no caderno
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Botao cor="azul" onClick={baixarModelo}>
          Baixar modelo (.json)
        </Botao>
        <label className="btn btn-amarelo focus-within:outline-4 focus-within:outline-amarelo">
          Carregar pacote
          <input
            type="file"
            accept="application/json,.json"
            onChange={carregar}
            className="sr-only"
          />
        </label>
        {ativo.id !== "padrao" && (
          <Botao
            cor="claro"
            onClick={() => {
              restaurarPadrao();
              setAtivo(conteudo());
              setMensagem({ ok: true, texto: "Conteúdo original restaurado." });
            }}
          >
            Voltar ao original
          </Botao>
        )}
      </div>

      {mensagem && (
        <p
          role={mensagem.ok ? "status" : "alert"}
          className={`rounded-xl border-2 px-4 py-3 font-bold ${
            mensagem.ok
              ? "border-verde-texto text-verde-texto"
              : "border-vermelho-texto text-vermelho-texto"
          }`}
        >
          {mensagem.texto}
        </p>
      )}
      <p className="text-sm opacity-80">
        Cada pacote guarda seus próprios recordes, caderno e relatório neste navegador.
      </p>
    </div>
  );
}
