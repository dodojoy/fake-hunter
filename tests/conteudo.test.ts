// Valida os arquivos de data/: quem adicionar uma notícia descobre aqui se esqueceu algo.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fasesJson from "@/data/fases.json";
import fontesJson from "@/data/fontes.json";
import noticiasJson from "@/data/noticias.json";
import { conteudo, obterFase } from "@/lib/conteudo";

const { noticias, sinais: SINAIS, faseInicial } = conteudo();

function contar<T>(itens: T[]) {
  return itens.reduce<Record<string, number>>(
    (c, i) => ({ ...c, [String(i)]: (c[String(i)] ?? 0) + 1 }),
    {},
  );
}

describe("conteúdo migrado do Unity", () => {
  it("tem 24 notícias, 20 fontes e 4 fases", () => {
    expect(noticiasJson).toHaveLength(24);
    expect(fontesJson).toHaveLength(20);
    expect(fasesJson).toHaveLength(4);
  });

  it("mantém a distribuição de vereditos e dificuldades", () => {
    expect(contar(noticias.map((n) => n.veredito))).toEqual({
      Verdadeira: 9,
      Falsa: 10,
      ParcialmenteVerdadeira: 5,
    });
    expect(contar(noticias.map((n) => n.dificuldade))).toEqual({ Facil: 6, Media: 6, Dificil: 12 });
  });

  it("encadeia as 4 fases, cada uma com 6 notícias", () => {
    const nomes: string[] = [];
    let id: string | null = faseInicial;
    while (id) {
      const fase = obterFase(id);
      expect(fase.noticias).toHaveLength(6);
      nomes.push(fase.nomeFase);
      id = fase.proximaFase;
    }
    expect(nomes).toEqual([
      "Fase 1 – Primeiros passos",
      "Fase 2 – Meia verdade",
      "Fase 3 – Caçador experiente",
      "Fase 4 – Olho clínico",
    ]);
  });

  it("usa cada notícia em exatamente uma fase", () => {
    const usadas = fasesJson.flatMap((f) => f.noticias);
    expect(new Set(usadas).size).toBe(usadas.length);
    expect(new Set(usadas)).toEqual(new Set(noticiasJson.map((n) => n.id)));
  });
});

describe("integridade dos dados", () => {
  it("ids são únicos", () => {
    for (const lista of [noticiasJson, fontesJson, fasesJson, SINAIS]) {
      const ids = lista.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(noticias.map((n) => [n.id, n] as const))("notícia %s está completa", (_, n) => {
    expect(n.autor).not.toBeNull();
    expect(n.data).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    for (const campo of [
      "titulo",
      "corpo",
      "nomeCanal",
      "textoVerificarFonte",
      "textoPesquisar",
      "explicacao",
    ] as const) {
      expect(n[campo].trim(), campo).not.toBe("");
    }
    expect(n.sinais.length).toBeGreaterThan(0);
    if (n.imagem) expect(existsSync(join("public", n.imagem))).toBe(true);
  });

  it("todo sinal do Caderno aparece em pelo menos uma notícia", () => {
    const usados = new Set(noticias.flatMap((n) => n.sinais.map((s) => s.id)));
    expect(SINAIS.filter((s) => !usados.has(s.id)).map((s) => s.id)).toEqual([]);
  });

  it("notícia verdadeira não é marcada só com sinais de alerta", () => {
    for (const n of noticias.filter((x) => x.veredito === "Verdadeira")) {
      expect(
        n.sinais.some((s) => s.tipo === "boa-pratica"),
        n.id,
      ).toBe(true);
    }
  });
});

describe("Fase 4 – Olho clínico", () => {
  const fase4 = obterFase("Fase4");

  it("esconde o status das fontes e tem dica; as outras fases não", () => {
    expect(fase4.ocultarStatusDaFonte).toBe(true);
    expect(fase4.dica).toContain("revisa o que publica");
    for (const id of ["Fase1", "Fase2", "Fase3"]) {
      expect(obterFase(id).ocultarStatusDaFonte).toBe(false);
      expect(obterFase(id).dica).toBe("");
    }
  });

  it("fontes falsas copiam nomes reais e só erram, de leve, no que escrevem", () => {
    const falsas = fase4.noticias.filter((n) => n.veredito !== "Verdadeira");
    const nomes = falsas.map((n) => n.autor?.nomeExibido);
    expect(nomes).toContain("Defesa Civil de Paulo Afonso");
    expect(nomes).toContain("Ministério da Previdência Social");
    // erros propositais nos históricos das fontes (não podem ser "corrigidos" por engano)
    const historicos = falsas.map((n) => n.autor?.historico).join(" ");
    for (const erro of ["atravéz", "Nossa missão e levar", "beneficios", "atento as"]) {
      expect(historicos).toContain(erro);
    }
  });

  it("notícias verdadeiras da Fase 4 não têm erros de português nas investigações", () => {
    for (const n of fase4.noticias.filter((x) => x.veredito === "Verdadeira")) {
      expect(`${n.textoVerificarFonte} ${n.textoPesquisar}`).not.toMatch(
        /atravéz|Seje|afim de|excessão/,
      );
    }
  });
});
