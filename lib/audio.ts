// Efeitos e música. Os arquivos ficam em public/audio/<nome>.mp3; se algum não existir,
// os efeitos caem num bipe sintetizado e a música simplesmente não toca.
// Cada efeito também gera uma legenda visual (para quem joga sem som).

import { lerPreferencias } from "./preferencias";

export type Efeito = "clique" | "acerto" | "erro" | "fimDeFase" | "gameOver";

const ARQUIVOS: Record<Efeito, string> = {
  clique: "/audio/clique.mp3",
  acerto: "/audio/acerto.mp3",
  erro: "/audio/erro.mp3",
  fimDeFase: "/audio/proxima_fase.mp3",
  gameOver: "/audio/game_over.mp3",
};

const FAIXAS_MENU = ["/audio/menu_1.mp3", "/audio/menu_2.mp3", "/audio/menu_3.mp3"];

// Notas (Hz) e duração de cada nota para o bipe substituto.
const BIPES: Record<Efeito, { notas: number[]; duracao: number; volume: number }> = {
  clique: { notas: [880], duracao: 0.04, volume: 0.08 },
  acerto: { notas: [660, 880], duracao: 0.1, volume: 0.15 },
  erro: { notas: [220, 165], duracao: 0.16, volume: 0.15 },
  fimDeFase: { notas: [523, 659, 784, 1047], duracao: 0.12, volume: 0.15 },
  gameOver: { notas: [392, 330, 262, 196], duracao: 0.22, volume: 0.15 },
};

// Legendas: o clique não gera legenda, seria ruído a cada botão.
const LEGENDAS: Partial<Record<Efeito, string>> = {
  acerto: "♪ Som de acerto",
  erro: "♪ Som de erro",
  fimDeFase: "♪ Fanfarra de fase concluída",
  gameOver: "♪ Som de fim de jogo",
};

type OuvinteLegenda = (texto: string) => void;
const ouvintesLegenda = new Set<OuvinteLegenda>();

export function ouvirLegendas(ouvinte: OuvinteLegenda) {
  ouvintesLegenda.add(ouvinte);
  return () => {
    ouvintesLegenda.delete(ouvinte);
  };
}

const indisponiveis = new Set<string>();
let contexto: AudioContext | null = null;
let musica: HTMLAudioElement | null = null;

function bipe(efeito: Efeito) {
  contexto ??= new AudioContext();
  const { notas, duracao, volume } = BIPES[efeito];
  const inicio = contexto.currentTime;
  notas.forEach((freq, i) => {
    const osc = contexto!.createOscillator();
    const ganho = contexto!.createGain();
    const t = inicio + i * duracao;
    osc.type = "triangle";
    osc.frequency.value = freq;
    ganho.gain.setValueAtTime(volume, t);
    ganho.gain.exponentialRampToValueAtTime(0.001, t + duracao);
    osc.connect(ganho).connect(contexto!.destination);
    osc.start(t);
    osc.stop(t + duracao);
  });
}

export function tocar(efeito: Efeito) {
  const prefs = lerPreferencias();
  const legenda = LEGENDAS[efeito];
  if (legenda && prefs.legendas) ouvintesLegenda.forEach((o) => o(legenda));
  if (!prefs.som) return;

  const src = ARQUIVOS[efeito];
  if (indisponiveis.has(src)) return bipe(efeito);
  new Audio(src).play().catch((e: DOMException) => {
    // NotAllowedError = navegador bloqueou o autoplay; não é arquivo faltando.
    if (e.name === "NotAllowedError") return;
    indisponiveis.add(src);
    bipe(efeito);
  });
}

export function iniciarMusicaMenu() {
  if (musica || !lerPreferencias().som) return;
  const disponiveis = FAIXAS_MENU.filter((f) => !indisponiveis.has(f));
  if (disponiveis.length === 0) return;
  const src = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  const faixa = new Audio(src);
  faixa.loop = true;
  faixa.volume = 0.4;
  musica = faixa;
  faixa.play().catch((e: DOMException) => {
    if (musica === faixa) musica = null;
    if (e.name !== "NotAllowedError") {
      indisponiveis.add(src);
      iniciarMusicaMenu();
    }
  });
}

export function pararMusicaMenu() {
  musica?.pause();
  musica = null;
}
