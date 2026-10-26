// O que o jogo lembra entre sessões, salvo no navegador:
// melhor pontuação por fase, sinais do Caderno do Checador e o relatório de decisões.
// Cada pacote de conteúdo (modo professor) tem sua própria memória, para os ids não se misturarem.

import { conteudo } from "./conteudo";

function chave(base: string) {
  const id = conteudo().id;
  return id === "padrao" ? `fakehunter:${base}` : `fakehunter:${base}:${id}`;
}

function ler<T>(chave: string, padrao: T): T {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? "null") ?? padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // armazenamento indisponível (aba anônima, bloqueado): segue sem salvar
  }
}

// ---------- Recordes ----------

export function lerRecordes(): Record<string, number> {
  return ler(chave("recordes"), {});
}

// Retorna true se a pontuação bateu o recorde anterior da fase.
export function registrarPontuacao(faseId: string, pontos: number): boolean {
  const recordes = lerRecordes();
  if (pontos <= (recordes[faseId] ?? 0)) return false;
  recordes[faseId] = pontos;
  gravar(chave("recordes"), recordes);
  return true;
}

// ---------- Caderno do Checador ----------

export function lerSinaisDescobertos(): string[] {
  return ler(chave("caderno"), []);
}

export function descobrirSinais(ids: string[]) {
  const descobertos = new Set(lerSinaisDescobertos());
  ids.forEach((id) => descobertos.add(id));
  gravar(chave("caderno"), [...descobertos]);
}

// ---------- Relatório de decisões ----------

export interface RegistroDecisao {
  quando: string; // ISO 8601
  fase: string;
  noticia: string;
  veredito: string;
  compartilhou: boolean;
  acertou: boolean;
  investigacoes: string[];
  segundos: number; // tempo entre ver a notícia e decidir
}

export function lerRelatorio(): RegistroDecisao[] {
  return ler(chave("relatorio"), []);
}

export function registrarDecisao(registro: RegistroDecisao) {
  gravar(chave("relatorio"), [...lerRelatorio(), registro]);
}

export function apagarRelatorio() {
  gravar(chave("relatorio"), []);
}
