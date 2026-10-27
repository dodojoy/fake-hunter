// Selo da tela de conclusão, conforme o aproveitamento (acertos ÷ notícias decididas) somando
// todas as fases concluídas. Mesmos limites e textos do protótipo (Classificacao.cs).

export type Selo = "Especialista" | "CacadorVoraz" | "CacadorVegetariano" | "CacadoPelasFakeNews";

export const LIMITES = {
  voraz: 80, // % mínimo para "Caçador voraz"
  vegetariano: 60, // % mínimo para "Caçador vegetariano"; abaixo disso, "Caçado pelas fake news"
};

export function aproveitamento(acertos: number, erros: number): number {
  const total = acertos + erros;
  return total === 0 ? 0 : (100 * acertos) / total;
}

export function calcularSelo(acertos: number, erros: number): Selo {
  const total = acertos + erros;
  if (total > 0 && erros === 0) return "Especialista";
  const a = aproveitamento(acertos, erros);
  if (a >= LIMITES.voraz) return "CacadorVoraz";
  if (a >= LIMITES.vegetariano) return "CacadorVegetariano";
  return "CacadoPelasFakeNews";
}

// As cores do protótipo foram escurecidas para o texto atingir contraste AA sobre o papel.
export const SELOS: Record<
  Selo,
  { titulo: string; descricao: string; imagem: string; cor: string }
> = {
  Especialista: {
    titulo: "Especialista",
    descricao:
      "Nenhuma fake news escapou! Com 100% de acerto, a comunidade confia de olhos fechados no seu trabalho.",
    imagem: "/img/ui/selos/selo_especialista.png",
    cor: "#8a5a00",
  },
  CacadorVoraz: {
    titulo: "Caçador voraz",
    descricao:
      "Poucas fake news escapam de você. Mais um pouco de atenção aos detalhes e você vira especialista.",
    imagem: "/img/ui/selos/selo_voraz.png",
    cor: "#a8460f",
  },
  CacadorVegetariano: {
    titulo: "Caçador vegetariano",
    descricao:
      "Você sai para caçar, mas deixa muita fake news escapar. Investigue com mais calma antes de decidir.",
    imagem: "/img/ui/selos/selo_vegetariano.png",
    cor: "#1f7a40",
  },
  CacadoPelasFakeNews: {
    titulo: "Caçado pelas fake news",
    descricao:
      "Você chegou ao fim, mas as fake news levaram a melhor: muita desinformação passou por você. Revise as explicações e tente de novo!",
    imagem: "/img/ui/selos/selo_cacado.png",
    cor: "#a92e2e",
  },
};
