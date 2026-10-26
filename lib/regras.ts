import { deveCompartilhar, multiplicador, type Fase, type Noticia } from "./conteudo";

export const REGRAS = {
  confiancaInicial: 100,
  ganhoPorAcerto: 5,
  perdaPorErro: 20,
  pontosBase: 100, // multiplicado pela dificuldade (1, 2 ou 3)
  bonusPorSequencia: 25, // bônus extra a cada acerto seguido
  investigacoesPorNoticia: 2, // 0 = ilimitado
};

export type Investigacao = "verificarFonte" | "consultarReferencia" | "pesquisar";
export type Etapa = "abertura" | "jogando" | "explicacao" | "fimDeFase" | "gameOver";

export interface EstadoPartida {
  fase: Fase;
  noticias: Noticia[];
  indice: number;
  investigacoesUsadas: Investigacao[];
  resultado: Investigacao | null;
  decisaoTomada: boolean;
  acertouUltima: boolean;
  feedback: { texto: string; acertou: boolean } | null;
  etapa: Etapa;
  historico: boolean[]; // acerto/erro de cada notícia já decidida

  confianca: number;
  pontos: number;
  sequencia: number;
  melhorSequencia: number;
  acertos: number;
  erros: number;
}

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function iniciarPartida(fase: Fase): EstadoPartida {
  return {
    fase,
    noticias: fase.embaralhar ? embaralhar(fase.noticias) : fase.noticias,
    indice: 0,
    investigacoesUsadas: [],
    resultado: null,
    decisaoTomada: false,
    acertouUltima: false,
    feedback: null,
    etapa: "abertura",
    historico: [],
    confianca: REGRAS.confiancaInicial,
    pontos: 0,
    sequencia: 0,
    melhorSequencia: 0,
    acertos: 0,
    erros: 0,
  };
}

export function comecar(s: EstadoPartida): EstadoPartida {
  return s.etapa === "abertura" ? { ...s, etapa: "jogando" } : s;
}

export function noticiaAtual(s: EstadoPartida): Noticia {
  return s.noticias[s.indice];
}

export function podeInvestigar(s: EstadoPartida): boolean {
  if (s.decisaoTomada || s.etapa !== "jogando") return false;
  if (REGRAS.investigacoesPorNoticia <= 0) return true;
  return s.investigacoesUsadas.length < REGRAS.investigacoesPorNoticia;
}

export function investigacoesRestantes(s: EstadoPartida): number | null {
  if (REGRAS.investigacoesPorNoticia <= 0) return null;
  return Math.max(0, REGRAS.investigacoesPorNoticia - s.investigacoesUsadas.length);
}

export function investigar(s: EstadoPartida, tipo: Investigacao): EstadoPartida {
  if (!podeInvestigar(s) || s.investigacoesUsadas.includes(tipo)) return s;
  return { ...s, investigacoesUsadas: [...s.investigacoesUsadas, tipo], resultado: tipo };
}

export function decidir(s: EstadoPartida, compartilhar: boolean): EstadoPartida {
  if (s.decisaoTomada || s.etapa !== "jogando") return s;

  const noticia = noticiaAtual(s);
  const acertou = compartilhar === deveCompartilhar(noticia);
  const prox: EstadoPartida = {
    ...s,
    decisaoTomada: true,
    acertouUltima: acertou,
    historico: [...s.historico, acertou],
  };

  if (acertou) {
    prox.acertos++;
    prox.sequencia++;
    prox.melhorSequencia = Math.max(prox.melhorSequencia, prox.sequencia);
    prox.pontos +=
      REGRAS.pontosBase * multiplicador(noticia.dificuldade) +
      REGRAS.bonusPorSequencia * (prox.sequencia - 1);
    prox.confianca = Math.min(100, prox.confianca + REGRAS.ganhoPorAcerto);
    prox.feedback = { texto: "Decisão correta! A confiança da comunidade aumentou.", acertou };
  } else {
    prox.erros++;
    prox.sequencia = 0;
    prox.confianca = Math.max(0, prox.confianca - REGRAS.perdaPorErro);
    const motivo = compartilhar
      ? "Você espalhou uma informação que não era totalmente verdadeira."
      : "Você bloqueou uma informação verdadeira e importante.";
    prox.feedback = { texto: `Decisão incorreta. ${motivo}`, acertou };
  }

  // Confiança zerada encerra o loop na hora, sem mostrar a explicação.
  prox.etapa = prox.confianca <= 0 ? "gameOver" : "explicacao";
  return prox;
}

export function proximaNoticia(s: EstadoPartida): EstadoPartida {
  if (s.etapa !== "explicacao") return s;
  if (s.indice + 1 >= s.noticias.length) return { ...s, etapa: "fimDeFase" };
  return {
    ...s,
    indice: s.indice + 1,
    investigacoesUsadas: [],
    resultado: null,
    decisaoTomada: false,
    etapa: "jogando",
  };
}
