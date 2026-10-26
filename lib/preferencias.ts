// Preferências do jogador (acessibilidade e progresso do tutorial), salvas no navegador
// e aplicadas como atributos data-* no <html>, onde o CSS as interpreta.

import { useSyncExternalStore } from "react";

export interface Preferencias {
  fonte: 0 | 1 | 2; // 100%, 115%, 130%
  contraste: boolean;
  reduzirMovimento: boolean;
  som: boolean;
  legendas: boolean; // aviso visual quando um som toca
  leituraAutomatica: boolean; // lê a notícia e a explicação em voz alta
  introVista: boolean;
  tutorialVisto: boolean;
}

const PADRAO: Preferencias = {
  fonte: 0,
  contraste: false,
  reduzirMovimento: false,
  som: true,
  legendas: true,
  leituraAutomatica: false,
  introVista: false,
  tutorialVisto: false,
};

const CHAVE = "fakehunter:preferencias";
const ouvintes = new Set<() => void>();
let atual: Preferencias | null = null;

function aplicarNoDocumento(p: Preferencias) {
  const html = document.documentElement;
  html.dataset.fonte = String(p.fonte);
  html.dataset.contraste = p.contraste ? "alto" : "normal";
  html.dataset.movimento = p.reduzirMovimento ? "reduzido" : "normal";
}

export function lerPreferencias(): Preferencias {
  if (atual) return atual;
  try {
    atual = { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? "{}") };
  } catch {
    atual = { ...PADRAO };
  }
  aplicarNoDocumento(atual!);
  return atual!;
}

export function alterarPreferencias(mudancas: Partial<Preferencias>) {
  atual = { ...lerPreferencias(), ...mudancas };
  aplicarNoDocumento(atual);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch {
    // armazenamento indisponível: vale só para esta sessão
  }
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}

export function usePreferencias(): Preferencias {
  return useSyncExternalStore(assinar, lerPreferencias, () => PADRAO);
}
