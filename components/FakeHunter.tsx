"use client";

import { useEffect, useState } from "react";
import { conteudo } from "@/lib/conteudo";
import { alterarPreferencias, lerPreferencias } from "@/lib/preferencias";
import Certificado from "./Certificado";
import Intro from "./Intro";
import Menu from "./Menu";
import Partida, { type ResumoFase } from "./Partida";
import { Legendas } from "./ui";

// Estado global de progresso: qual tela está aberta, qual fase jogar e o resultado de cada
// fase concluída nesta jornada (para o certificado). "partida" muda a cada (re)início para
// remontar a Partida com estado zerado.
type Tela =
  | { nome: "menu" }
  | { nome: "intro" }
  | { nome: "jogo"; faseId: string; partida: number }
  | { nome: "certificado" };

export default function FakeHunter() {
  const [tela, setTela] = useState<Tela>({ nome: "menu" });
  const [jornada, setJornada] = useState<Record<string, ResumoFase>>({});

  // PWA: só em produção, para o cache não atrapalhar o desenvolvimento.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const jogar = (faseId: string) =>
    setTela((t) => ({ nome: "jogo", faseId, partida: t.nome === "jogo" ? t.partida + 1 : 0 }));

  function novaJornada() {
    setJornada({});
    if (lerPreferencias().introVista) jogar(conteudo().faseInicial);
    else setTela({ nome: "intro" });
  }

  let pagina;
  switch (tela.nome) {
    case "menu":
      pagina = <Menu onJogar={novaJornada} />;
      break;
    case "intro":
      pagina = (
        <Intro
          onComecar={() => {
            alterarPreferencias({ introVista: true });
            jogar(conteudo().faseInicial);
          }}
        />
      );
      break;
    case "jogo":
      pagina = (
        <Partida
          key={tela.partida}
          faseId={tela.faseId}
          onJogarFase={jogar}
          onMenu={() => setTela({ nome: "menu" })}
          onFaseConcluida={(resumo) => setJornada((j) => ({ ...j, [resumo.faseId]: resumo }))}
          onConcluirJornada={() => setTela({ nome: "certificado" })}
        />
      );
      break;
    case "certificado":
      pagina = (
        <Certificado
          jornada={Object.values(jornada)}
          onJogarDeNovo={novaJornada}
          onMenu={() => setTela({ nome: "menu" })}
        />
      );
      break;
  }

  return (
    <>
      {pagina}
      <Legendas />
    </>
  );
}
