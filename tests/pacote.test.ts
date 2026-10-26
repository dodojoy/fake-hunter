import { describe, expect, it } from "vitest";
import { PACOTE_PADRAO, montarConteudo } from "@/lib/conteudo";

// Pacote mínimo válido: uma fase, uma notícia, uma fonte.
function pacoteMinimo() {
  return {
    id: "escola-teste",
    titulo: "Turma 8A",
    fontes: [{ id: "f1", nomeExibido: "Grupo da escola", status: "Desconhecida", historico: "…" }],
    noticias: [
      {
        id: "n1",
        titulo: "Aula cancelada amanhã",
        corpo: "Corre no grupo que não vai ter aula.",
        nomeCanal: "WhatsApp",
        data: "01/03/2026",
        autor: "f1",
        textoVerificarFonte: "Sem assinatura.",
        textoPesquisar: "O site da escola não fala nada.",
        veredito: "Falsa",
        dificuldade: "Facil",
        explicacao: "Avisos oficiais saem no site da escola.",
        sinais: ["fonte-nao-identificada"],
      },
    ],
    fases: [{ id: "unica", nomeFase: "Fase única", noticias: ["n1"] }],
  };
}

type Pacote = ReturnType<typeof pacoteMinimo>;

function erroDe(pacote: unknown) {
  try {
    montarConteudo(pacote);
  } catch (e) {
    return (e as Error).message;
  }
  return null;
}

describe("pacote de conteúdo (modo professor)", () => {
  it("o conteúdo original exportado como pacote volta igual", () => {
    const c = montarConteudo(JSON.parse(JSON.stringify(PACOTE_PADRAO)));
    expect(c.totalNoticias).toBe(18);
    expect(c.fases.size).toBe(3);
    expect(c.faseInicial).toBe("Fase1");
  });

  it("aceita um pacote mínimo e completa os campos opcionais", () => {
    const c = montarConteudo(pacoteMinimo());
    const fase = c.fases.get("unica")!;
    expect(fase.descricao).toBe("");
    expect(fase.embaralhar).toBe(false);
    expect(fase.proximaFase).toBeNull();
    expect(fase.noticias[0].imagem).toBeNull();
    expect(fase.noticias[0].autor?.nomeExibido).toBe("Grupo da escola");
    expect(c.sinais.length).toBeGreaterThan(0); // usa os sinais padrão
  });

  it.each([
    [
      "campo obrigatório vazio",
      (p: Pacote) => {
        p.noticias[0].titulo = "";
      },
      'Notícia "n1": o campo "titulo" é obrigatório',
    ],
    [
      "veredito inválido",
      (p: Pacote) => {
        p.noticias[0].veredito = "Mentira";
      },
      'Notícia "n1": "veredito" deve ser',
    ],
    [
      "autor inexistente",
      (p: Pacote) => {
        p.noticias[0].autor = "f9";
      },
      'Notícia "n1" referencia "f9"',
    ],
    [
      "sinal inexistente",
      (p: Pacote) => {
        p.noticias[0].sinais = ["inventado"];
      },
      'referencia "inventado"',
    ],
    [
      "notícia inexistente na fase",
      (p: Pacote) => {
        p.fases[0].noticias = ["n2"];
      },
      'Fase "unica" referencia "n2"',
    ],
    [
      "id repetido",
      (p: Pacote) => {
        p.fontes.push({ ...p.fontes[0] });
      },
      'duas fontes com o id "f1"',
    ],
    [
      "fases em ciclo",
      (p: Pacote) => {
        Object.assign(p.fases[0], { proximaFase: "unica" });
      },
      "ciclo",
    ],
    [
      "fase sem notícias",
      (p: Pacote) => {
        p.fases[0].noticias = [];
      },
      "não tem nenhuma notícia",
    ],
  ] as [string, (p: Pacote) => void, string][])(
    "recusa pacote com %s e explica o motivo",
    (_, estragar, mensagem) => {
      const pacote = pacoteMinimo();
      estragar(pacote);
      expect(erroDe(pacote)).toContain(mensagem);
    },
  );

  it("recusa algo que não é um objeto", () => {
    expect(erroDe([])).toBe("O pacote deveria ser um objeto.");
  });
});
