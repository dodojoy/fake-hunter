"use client";

import Image from "next/image";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ouvirLegendas, tocar } from "@/lib/audio";
import { falar, pararFala, useFalandoId, vozDisponivel } from "@/lib/voz";

export function Fundo({ src }: { src: string }) {
  return (
    <div className="fundo-img fixed inset-0 -z-10" aria-hidden>
      <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-marinho/30" />
    </div>
  );
}

export function Icone({
  src,
  tamanho = 48,
  className = "",
}: {
  src: string;
  tamanho?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={tamanho}
      height={tamanho}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: tamanho, height: tamanho }}
    />
  );
}

// ---------- Botões: todos tocam o clique ----------

type Cor = "azul" | "verde" | "vermelho" | "amarelo" | "claro";

type IconeBotao =
  | "ajuda"
  | "compartilhar"
  | "consultar_referencia"
  | "fechar"
  | "jogar"
  | "menu"
  | "nao_propagar"
  | "pesquisar"
  | "proxima"
  | "repetir"
  | "sair"
  | "verificar_fonte"
  | "voltar";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  cor: Cor;
  icone?: IconeBotao; // ícones Lucide de public/img/ui/icones
  iconeADireita?: boolean;
  atalho?: string; // tecla exibida como dica (só para quem usa teclado)
}

export function Botao({
  cor,
  icone,
  iconeADireita = false,
  atalho,
  className = "",
  onClick,
  children,
  ...resto
}: BotaoProps) {
  // Ícone branco nos botões escuros, azul-marinho nos claros (mesma regra do protótipo).
  const variante = cor === "amarelo" || cor === "claro" ? "azul" : "branco";
  const imagem = icone && (
    <Image
      src={`/img/ui/icones/ico_${icone}_${variante}.png`}
      alt=""
      width={128}
      height={128}
      className="shrink-0"
      style={{ width: "1.3em", height: "1.3em" }}
    />
  );
  return (
    <button
      type="button"
      className={`btn btn-${cor} ${className}`}
      aria-keyshortcuts={atalho}
      onClick={(e) => {
        tocar("clique");
        onClick?.(e);
      }}
      {...resto}
    >
      {!iconeADireita && imagem}
      {children}
      {iconeADireita && imagem}
      {atalho && (
        <kbd className="atalho so-teclado" aria-hidden>
          {atalho}
        </kbd>
      )}
    </button>
  );
}

// ---------- Leitura em voz alta ----------

export function BotaoOuvir({
  texto,
  id,
  className = "",
}: {
  texto: string;
  id: string;
  className?: string;
}) {
  const falandoId = useFalandoId();
  if (!vozDisponivel()) return null;
  const falando = falandoId === id;
  return (
    <button
      type="button"
      onClick={() => (falando ? pararFala() : falar(texto, id))}
      aria-pressed={falando}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-current px-3 py-1 text-sm font-bold hover:bg-black/10 ${className}`}
    >
      <span aria-hidden>{falando ? "■" : "🔊"}</span>
      {falando ? "Parar" : "Ouvir"}
    </button>
  );
}

// ---------- Modal sobre fundo escurecido ----------

export function Modal({
  children,
  rotulo,
  fundo,
  onFechar,
  atrasado = false,
}: {
  children: ReactNode;
  rotulo: string;
  fundo?: string;
  onFechar?: () => void; // habilita Esc para fechar
  atrasado?: boolean; // aparece depois da animação do carimbo
}) {
  useEffect(() => {
    if (!onFechar) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const animacao = atrasado ? "surgir-atrasado" : "surgir";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={rotulo}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {fundo && <Fundo src={fundo} />}
      <div className={`fixed inset-0 bg-black/60 ${animacao}`} aria-hidden />
      <div className="relative flex min-h-full items-center justify-center px-4 py-10">
        <div className={`flex w-full justify-center ${animacao}`}>{children}</div>
      </div>
    </div>
  );
}

// Folha de papel com título, usada no conteúdo dos modais.
export function Painel({
  titulo,
  corTitulo = "text-azul",
  largura = "max-w-2xl",
  children,
}: {
  titulo: ReactNode;
  corTitulo?: string;
  largura?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`papel flex w-full ${largura} flex-col items-center gap-5 px-5 pt-12 pb-8 text-center sm:px-12`}
    >
      <h2 className={`font-titulo text-3xl leading-tight sm:text-5xl ${corTitulo}`}>{titulo}</h2>
      {children}
    </div>
  );
}

// ---------- Interruptor (acessibilidade) ----------

export function Interruptor({
  rotulo,
  descricao,
  ligado,
  onMudar,
  desabilitado,
}: {
  rotulo: string;
  descricao?: string;
  ligado: boolean;
  onMudar: (ligado: boolean) => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={desabilitado}
      onClick={() => {
        tocar("clique");
        onMudar(!ligado);
      }}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-left hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        <span className="block font-bold">{rotulo}</span>
        {descricao && <span className="block text-sm opacity-80">{descricao}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-papel-texto transition-colors ${ligado ? "bg-verde" : "bg-cinza/50"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full border-2 border-papel-texto bg-white transition-[left] ${ligado ? "left-6" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

// ---------- Legendas dos efeitos sonoros ----------

export function Legendas() {
  const [legenda, setLegenda] = useState<{ texto: string; chave: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const parar = ouvirLegendas((texto) => {
      setLegenda({ texto, chave: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setLegenda(null), 1800);
    });
    return () => {
      parar();
      clearTimeout(timer);
    };
  }, []);

  if (!legenda) return null;
  // aria-hidden: o resultado já é anunciado em texto; a legenda é para quem não ouve o som.
  return (
    <div
      key={legenda.chave}
      aria-hidden
      className="surgir pointer-events-none fixed inset-x-0 top-2 z-[60] mx-auto w-fit rounded-full border-2 border-amarelo bg-black/85 px-5 py-2 text-base font-bold whitespace-nowrap text-white"
    >
      {legenda.texto}
    </div>
  );
}
