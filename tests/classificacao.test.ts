import { describe, expect, it } from "vitest";
import { aproveitamento, calcularSelo } from "@/lib/classificacao";

describe("selo da tela de conclusão", () => {
  it("Especialista só com 100% de acerto", () => {
    expect(calcularSelo(24, 0)).toBe("Especialista");
    expect(calcularSelo(23, 1)).toBe("CacadorVoraz");
  });

  it("usa os limites de 80% e 60%, inclusive", () => {
    expect(calcularSelo(8, 2)).toBe("CacadorVoraz"); // 80%
    expect(calcularSelo(79, 21)).toBe("CacadorVegetariano"); // 79%
    expect(calcularSelo(6, 4)).toBe("CacadorVegetariano"); // 60%
    expect(calcularSelo(59, 41)).toBe("CacadoPelasFakeNews"); // 59%
  });

  it("sem nenhuma notícia decidida não é Especialista", () => {
    expect(aproveitamento(0, 0)).toBe(0);
    expect(calcularSelo(0, 0)).toBe("CacadoPelasFakeNews");
  });
});
