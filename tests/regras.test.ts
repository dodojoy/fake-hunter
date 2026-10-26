import { describe, expect, it } from "vitest";
import { obterFase, type Fase, type Noticia } from "@/lib/conteudo";
import {
  comecar,
  decidir,
  iniciarPartida,
  investigacoesRestantes,
  investigar,
  noticiaAtual,
  podeInvestigar,
  proximaNoticia,
  type EstadoPartida,
} from "@/lib/regras";

const fase1 = obterFase("Fase1");

// Fase sintética para controlar veredito e dificuldade de cada notícia.
function faseCom(...noticias: Partial<Noticia>[]): Fase {
  const base = fase1.noticias[0];
  return {
    ...fase1,
    noticias: noticias.map((n, i) => ({ ...base, id: `n${i}`, ...n })),
  };
}

function jogando(fase: Fase) {
  return comecar(iniciarPartida(fase));
}

// Decide e avança para a próxima notícia.
function responder(s: EstadoPartida, compartilhar: boolean) {
  return proximaNoticia(decidir(s, compartilhar));
}

describe("acerto", () => {
  it("só compartilhar notícia totalmente verdadeira é acerto", () => {
    const casos: [Noticia["veredito"], boolean, boolean][] = [
      ["Verdadeira", true, true],
      ["Verdadeira", false, false],
      ["Falsa", false, true],
      ["Falsa", true, false],
      ["ParcialmenteVerdadeira", false, true],
      ["ParcialmenteVerdadeira", true, false],
    ];
    for (const [veredito, compartilhou, esperado] of casos) {
      const s = decidir(jogando(faseCom({ veredito })), compartilhou);
      expect(s.acertouUltima, `${veredito} / compartilhou=${compartilhou}`).toBe(esperado);
    }
  });
});

describe("confiança", () => {
  it("começa em 100, +5 por acerto com teto 100 e -20 por erro", () => {
    let s = jogando(faseCom({ veredito: "Falsa" }, { veredito: "Falsa" }, { veredito: "Falsa" }));
    expect(s.confianca).toBe(100);
    s = responder(s, false); // acerto no teto
    expect(s.confianca).toBe(100);
    s = responder(s, true); // erro
    expect(s.confianca).toBe(80);
    s = decidir(s, false); // acerto
    expect(s.confianca).toBe(85);
  });

  it("zerar a confiança encerra na hora, sem explicação", () => {
    let s = jogando(faseCom(...Array.from({ length: 6 }, () => ({ veredito: "Falsa" as const }))));
    for (let i = 0; i < 4; i++) s = responder(s, true);
    expect(s.confianca).toBe(20);
    s = decidir(s, true);
    expect(s.confianca).toBe(0);
    expect(s.etapa).toBe("gameOver");
    expect(proximaNoticia(s)).toBe(s); // não avança depois do game over
  });
});

describe("pontuação", () => {
  it("100 × dificuldade + 25 × (sequência - 1); erro zera a sequência sem tirar pontos", () => {
    let s = jogando(
      faseCom(
        { veredito: "Verdadeira", dificuldade: "Facil" }, // 100
        { veredito: "Verdadeira", dificuldade: "Media" }, // 200 + 25
        { veredito: "Verdadeira", dificuldade: "Dificil" }, // 300 + 50
        { veredito: "Falsa", dificuldade: "Dificil" }, // erro
        { veredito: "Falsa", dificuldade: "Media" }, // 200, sequência recomeça
      ),
    );
    s = responder(s, true);
    expect(s.pontos).toBe(100);
    s = responder(s, true);
    expect(s.pontos).toBe(325);
    s = responder(s, true);
    expect(s.pontos).toBe(675);
    expect(s.melhorSequencia).toBe(3);
    s = responder(s, true);
    expect(s.pontos).toBe(675);
    expect(s.sequencia).toBe(0);
    s = decidir(s, false);
    expect(s.pontos).toBe(875);
    expect([s.acertos, s.erros, s.melhorSequencia]).toEqual([4, 1, 3]);
    expect(s.historico).toEqual([true, true, true, false, true]);
  });
});

describe("investigação", () => {
  it("permite 2 investigações diferentes por notícia e renova na próxima", () => {
    let s = jogando(fase1);
    expect(investigacoesRestantes(s)).toBe(2);
    s = investigar(s, "pesquisar");
    expect(investigar(s, "pesquisar")).toBe(s); // a mesma ferramenta não conta duas vezes
    s = investigar(s, "verificarFonte");
    expect(podeInvestigar(s)).toBe(false);
    expect(investigar(s, "consultarReferencia")).toBe(s);
    s = responder(s, false);
    expect(investigacoesRestantes(s)).toBe(2);
    expect(s.resultado).toBeNull();
  });

  it("não deixa investigar antes de começar nem depois de decidir", () => {
    const abertura = iniciarPartida(fase1);
    expect(abertura.etapa).toBe("abertura");
    expect(podeInvestigar(abertura)).toBe(false);
    expect(podeInvestigar(decidir(comecar(abertura), true))).toBe(false);
  });
});

describe("progressão", () => {
  it("passa pelas 6 notícias em ordem e termina em fim de fase", () => {
    let s = jogando(fase1);
    const vistas: string[] = [];
    while (s.etapa !== "fimDeFase") {
      vistas.push(noticiaAtual(s).id);
      s = responder(s, noticiaAtual(s).veredito === "Verdadeira");
    }
    expect(vistas).toEqual(fase1.noticias.map((n) => n.id));
    expect(s.confianca).toBe(100);
    expect(s.pontos).toBe(975);
  });

  it("decidir duas vezes a mesma notícia não tem efeito", () => {
    const s = decidir(jogando(fase1), true);
    expect(decidir(s, false)).toBe(s);
  });

  it("embaralhar mantém as mesmas notícias", () => {
    const s = iniciarPartida({ ...fase1, embaralhar: true });
    expect([...s.noticias].map((n) => n.id).sort()).toEqual(fase1.noticias.map((n) => n.id).sort());
  });
});
