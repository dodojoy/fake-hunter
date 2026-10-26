// Leitura em voz alta com a síntese de voz do próprio navegador (Web Speech API).

import { useSyncExternalStore } from "react";

const ouvintes = new Set<() => void>();
let falandoId: string | null = null;

function avisar() {
  ouvintes.forEach((f) => f());
}

export function vozDisponivel(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function vozPortugues(): SpeechSynthesisVoice | undefined {
  const vozes = speechSynthesis.getVoices();
  return vozes.find((v) => v.lang === "pt-BR") ?? vozes.find((v) => v.lang.startsWith("pt"));
}

// `id` identifica quem pediu a leitura, para o botão saber se é ele que está falando.
export function falar(texto: string, id: string) {
  if (!vozDisponivel()) return;
  speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  const voz = vozPortugues();
  if (voz) fala.voice = voz;
  fala.onend = fala.onerror = () => {
    if (falandoId === id) {
      falandoId = null;
      avisar();
    }
  };
  falandoId = id;
  avisar();
  speechSynthesis.speak(fala);
}

export function pararFala() {
  if (!vozDisponivel()) return;
  speechSynthesis.cancel();
  falandoId = null;
  avisar();
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function useFalandoId(): string | null {
  return useSyncExternalStore(
    assinar,
    () => falandoId,
    () => null,
  );
}
