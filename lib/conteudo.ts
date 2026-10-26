// Modelo de dados do jogo e montagem do conteúdo a partir de JSON.
// O conteúdo padrão vem de data/*.json; o modo professor pode trocar por outro pacote.

import fontesJson from "@/data/fontes.json";
import noticiasJson from "@/data/noticias.json";
import fasesJson from "@/data/fases.json";
import sinaisJson from "@/data/sinais.json";

export type StatusFonte = "Confiavel" | "NaoConfiavel" | "Desconhecida";
export type Veredito = "Verdadeira" | "Falsa" | "ParcialmenteVerdadeira";
export type Dificuldade = "Facil" | "Media" | "Dificil";

export interface Sinal {
  id: string;
  tipo: "alerta" | "boa-pratica";
  nome: string;
  descricao: string;
}

export interface Fonte {
  id: string;
  nomeExibido: string;
  avatar: string | null;
  status: StatusFonte;
  historico: string;
}

export interface Noticia {
  id: string;
  titulo: string;
  corpo: string;
  imagem: string | null;
  nomeCanal: string;
  data: string;
  autor: Fonte | null;
  textoVerificarFonte: string;
  textoPesquisar: string;
  veredito: Veredito;
  dificuldade: Dificuldade;
  explicacao: string;
  sinais: Sinal[];
}

export interface Fase {
  id: string;
  nomeFase: string;
  descricao: string;
  abertura: string;
  noticias: Noticia[];
  embaralhar: boolean;
  proximaFase: string | null;
}

export function statusTexto(status: StatusFonte): string {
  switch (status) {
    case "Confiavel":
      return "Confiável";
    case "NaoConfiavel":
      return "Não confiável";
    default:
      return "Desconhecida";
  }
}

// Só notícias totalmente verdadeiras devem ser compartilhadas.
// Uma notícia parcialmente verdadeira ainda espalha desinformação.
export function deveCompartilhar(noticia: Noticia): boolean {
  return noticia.veredito === "Verdadeira";
}

export function vereditoTexto(veredito: Veredito): string {
  switch (veredito) {
    case "Verdadeira":
      return "VERDADEIRA";
    case "Falsa":
      return "FALSA";
    default:
      return "PARCIALMENTE VERDADEIRA";
  }
}

export function multiplicador(dificuldade: Dificuldade): number {
  return { Facil: 1, Media: 2, Dificil: 3 }[dificuldade];
}

// ---------- Pacote de conteúdo ----------
// Um pacote é um único JSON com as mesmas listas de data/*.json. É o formato que o modo
// professor importa e exporta. "sinais" é opcional (usa os sinais padrão).

export interface Pacote {
  id: string;
  titulo: string;
  sinais?: unknown[];
  fontes: unknown[];
  noticias: unknown[];
  fases: unknown[];
}

export interface Conteudo {
  id: string;
  titulo: string;
  sinais: Sinal[];
  noticias: Noticia[];
  faseInicial: string;
  totalNoticias: number;
  fases: Map<string, Fase>;
}

export const PACOTE_PADRAO: Pacote = {
  id: "padrao",
  titulo: "Vale Verde (conteúdo original)",
  sinais: sinaisJson,
  fontes: fontesJson,
  noticias: noticiasJson,
  fases: fasesJson,
};

class ErroConteudo extends Error {}

type Registro = Record<string, unknown>;

function objeto(valor: unknown, contexto: string): Registro {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor))
    throw new ErroConteudo(`${contexto} deveria ser um objeto.`);
  return valor as Registro;
}

function lista(obj: Registro, campo: string, contexto: string): unknown[] {
  const valor = obj[campo];
  if (!Array.isArray(valor))
    throw new ErroConteudo(`${contexto}: "${campo}" deveria ser uma lista.`);
  return valor;
}

function texto(obj: Registro, campo: string, contexto: string, padrao?: string): string {
  const valor = obj[campo] ?? padrao;
  if (typeof valor !== "string" || (padrao === undefined && valor.trim() === ""))
    throw new ErroConteudo(`${contexto}: o campo "${campo}" é obrigatório e deve ser um texto.`);
  return valor;
}

function opcional(obj: Registro, campo: string, contexto: string): string | null {
  const valor = obj[campo];
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string")
    throw new ErroConteudo(`${contexto}: "${campo}" deve ser um texto.`);
  return valor;
}

function umDe<T extends string>(obj: Registro, campo: string, opcoes: T[], contexto: string): T {
  const valor = obj[campo];
  if (!opcoes.includes(valor as T))
    throw new ErroConteudo(
      `${contexto}: "${campo}" deve ser ${opcoes.map((o) => `"${o}"`).join(", ")} (veio ${JSON.stringify(valor)}).`,
    );
  return valor as T;
}

function indexar<T extends { id: string }>(itens: T[], tipo: string): Map<string, T> {
  const mapa = new Map<string, T>();
  for (const item of itens) {
    if (mapa.has(item.id)) throw new ErroConteudo(`Há duas ${tipo} com o id "${item.id}".`);
    mapa.set(item.id, item);
  }
  return mapa;
}

function exigir<T>(mapa: Map<string, T>, id: string, contexto: string): T {
  const item = mapa.get(id);
  if (!item) throw new ErroConteudo(`${contexto} referencia "${id}", que não existe.`);
  return item;
}

// Valida um pacote (vindo de arquivo ou dos JSON do projeto) e resolve as referências por id.
// Lança um erro com mensagem em português explicando o primeiro problema encontrado.
export function montarConteudo(entrada: unknown): Conteudo {
  const raiz = objeto(entrada, "O pacote");
  const id = texto(raiz, "id", "Pacote");
  const titulo = texto(raiz, "titulo", "Pacote");

  const sinais = indexar(
    (Array.isArray(raiz.sinais) ? raiz.sinais : (PACOTE_PADRAO.sinais as unknown[])).map(
      (bruto, i): Sinal => {
        const o = objeto(bruto, `Sinal nº ${i + 1}`);
        const ctx = `Sinal "${o.id ?? i + 1}"`;
        return {
          id: texto(o, "id", ctx),
          tipo: umDe(o, "tipo", ["alerta", "boa-pratica"], ctx),
          nome: texto(o, "nome", ctx),
          descricao: texto(o, "descricao", ctx),
        };
      },
    ),
    "sinais",
  );

  const fontes = indexar(
    lista(raiz, "fontes", "Pacote").map((bruto, i): Fonte => {
      const o = objeto(bruto, `Fonte nº ${i + 1}`);
      const ctx = `Fonte "${o.id ?? i + 1}"`;
      return {
        id: texto(o, "id", ctx),
        nomeExibido: texto(o, "nomeExibido", ctx),
        avatar: opcional(o, "avatar", ctx),
        status: umDe(o, "status", ["Confiavel", "NaoConfiavel", "Desconhecida"], ctx),
        historico: texto(o, "historico", ctx),
      };
    }),
    "fontes",
  );

  const noticias = indexar(
    lista(raiz, "noticias", "Pacote").map((bruto, i): Noticia => {
      const o = objeto(bruto, `Notícia nº ${i + 1}`);
      const ctx = `Notícia "${o.id ?? i + 1}"`;
      const autor = opcional(o, "autor", ctx);
      return {
        id: texto(o, "id", ctx),
        titulo: texto(o, "titulo", ctx),
        corpo: texto(o, "corpo", ctx),
        imagem: opcional(o, "imagem", ctx),
        nomeCanal: texto(o, "nomeCanal", ctx),
        data: texto(o, "data", ctx),
        autor: autor ? exigir(fontes, autor, ctx) : null,
        textoVerificarFonte: texto(o, "textoVerificarFonte", ctx),
        textoPesquisar: texto(o, "textoPesquisar", ctx),
        veredito: umDe(o, "veredito", ["Verdadeira", "Falsa", "ParcialmenteVerdadeira"], ctx),
        dificuldade: umDe(o, "dificuldade", ["Facil", "Media", "Dificil"], ctx),
        explicacao: texto(o, "explicacao", ctx),
        sinais: (Array.isArray(o.sinais) ? o.sinais : []).map((s) =>
          exigir(sinais, String(s), ctx),
        ),
      };
    }),
    "notícias",
  );

  const brutas = lista(raiz, "fases", "Pacote");
  if (brutas.length === 0) throw new ErroConteudo("O pacote precisa de pelo menos uma fase.");
  const fases = indexar(
    brutas.map((bruto, i): Fase => {
      const o = objeto(bruto, `Fase nº ${i + 1}`);
      const ctx = `Fase "${o.id ?? i + 1}"`;
      const ids = lista(o, "noticias", ctx);
      if (ids.length === 0) throw new ErroConteudo(`${ctx} não tem nenhuma notícia.`);
      return {
        id: texto(o, "id", ctx),
        nomeFase: texto(o, "nomeFase", ctx),
        descricao: texto(o, "descricao", ctx, ""),
        abertura: texto(o, "abertura", ctx, ""),
        noticias: ids.map((n) => exigir(noticias, String(n), ctx)),
        embaralhar: o.embaralhar === true,
        proximaFase: opcional(o, "proximaFase", ctx),
      };
    }),
    "fases",
  );

  // A partir da primeira fase, a corrente de "proximaFase" não pode quebrar nem voltar.
  const faseInicial = [...fases.keys()][0];
  const visitadas = new Set<string>();
  for (let atual: string | null = faseInicial; atual;) {
    if (visitadas.has(atual)) throw new ErroConteudo(`A fase "${atual}" aparece em ciclo.`);
    visitadas.add(atual);
    atual = exigir(fases, atual, "A sequência de fases").proximaFase;
  }

  return {
    id,
    titulo,
    sinais: [...sinais.values()],
    noticias: [...noticias.values()],
    faseInicial,
    totalNoticias: [...visitadas].reduce((t, f) => t + fases.get(f)!.noticias.length, 0),
    fases,
  };
}

export function ehErroConteudo(e: unknown): e is Error {
  return e instanceof ErroConteudo;
}

// ---------- Conteúdo ativo ----------

const CHAVE_PACOTE = "fakehunter:pacote";
const PADRAO = montarConteudo(PACOTE_PADRAO);
let ativo = PADRAO;
let ativoBruto: unknown = PACOTE_PADRAO; // o JSON original, para exportar como modelo

// No navegador, recupera o pacote do modo professor salvo numa visita anterior.
if (typeof window !== "undefined") {
  try {
    const salvo = localStorage.getItem(CHAVE_PACOTE);
    if (salvo) {
      ativoBruto = JSON.parse(salvo);
      ativo = montarConteudo(ativoBruto);
    }
  } catch {
    // pacote salvo inválido ou armazenamento indisponível: fica com o padrão
  }
}

export function conteudo(): Conteudo {
  return ativo;
}

export function usarPacote(entrada: unknown): Conteudo {
  ativo = montarConteudo(entrada);
  ativoBruto = entrada;
  try {
    localStorage.setItem(CHAVE_PACOTE, JSON.stringify(entrada));
  } catch {
    // sem armazenamento: o pacote vale só até fechar a página
  }
  return ativo;
}

export function restaurarPadrao() {
  ativo = PADRAO;
  ativoBruto = PACOTE_PADRAO;
  try {
    localStorage.removeItem(CHAVE_PACOTE);
  } catch {
    // nada a fazer
  }
}

export function pacoteAtivo(): unknown {
  return ativoBruto;
}

export function obterFase(id: string): Fase {
  return exigir(ativo.fases, id, "O jogo");
}
