# 6. Metodologia e testes

## Processo de desenvolvimento

O projeto seguiu ciclos curtos e incrementais:

1. **Concepção e conteúdo** — definição do problema, dos sinais de desinformação a ensinar e
   redação dos 18 casos, com explicações educativas e casos-armadilha.
2. **Protótipo em Unity** — modelo de dados (ScriptableObjects), regras e cenas. O protótipo
   não chegou a ser validado rodando (ver [Arquitetura](03-arquitetura.md)).
3. **Porte para a web** — especificação escrita das regras (briefing), migração automática do
   conteúdo (`scripts/migrar_unity.py`, que preserva os textos na íntegra) e reimplementação em
   Next.js, validada no navegador a cada passo.
4. **Avaliação por critérios** — revisão do jogo contra os critérios de avaliação (acessibilidade,
   UX, narrativa, técnica, documentação, impacto) e implementação das melhorias: interface
   responsiva, acessibilidade, narrativa, caderno, certificado, PWA, testes, modo professor.
5. **Teste com usuários** — roteiro abaixo, a ser aplicado pelo grupo.

## Testes automatizados

`npm test` roda 58 testes (Vitest) em quatro arquivos:

| Arquivo | O que garante |
| --- | --- |
| `tests/regras.test.ts` | Acerto por veredito (inclusive meia verdade), confiança com teto e piso, game over imediato, pontuação com bônus de sequência, limite e renovação das investigações, ordem das notícias, decisão única |
| `tests/conteudo.test.ts` | Contagens do conteúdo original, regras especiais da Fase 4 e erros de português propositais das fontes, distribuição de vereditos/dificuldades, cadeia de fases, ids únicos, campos preenchidos, formato da data, imagens existentes, todo sinal usado, notícia verdadeira com boa prática |
| `tests/classificacao.test.ts` | Selos da tela de conclusão: limites de 80% e 60% (inclusive), Especialista só sem erros; a página de selos do Como jogar não revela números |
| `tests/pacote.test.ts` | Validação de pacotes do modo professor: pacote mínimo, campos opcionais e mensagens de erro para cada tipo de problema |

Para confirmar que os testes detectam erros, uma regra foi alterada de propósito (perda por erro
de 20 para 15): dois testes falharam, como esperado, e a regra foi restaurada.

Antes de cada entrega, rode `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.

## Testes de navegador (realizados)

Roteiros automatizados com Playwright, no build de produção:

- **Jornada completa no computador:** menu → introdução → abertura → tutorial (4 passos) →
  investigação por teclado → carimbo → explicação → 4 fases → tela de conclusão com selo e
  certificado com nome → caderno → acessibilidade (alto contraste + texto grande) → nova partida.
- **Fase 4:** *Consultar Referência* sem status da fonte; balão de dica abrindo pelo clique e
  fechando pela tecla D; conclusão com 20 de 24 acertos (83%) mostrando o selo Caçador voraz.
  Resultado: sem erros de JavaScript; 18 decisões registradas no relatório.
- **Celular (iPhone 13):** menu, tutorial, investigação, decisão, explicação.
- **Offline:** após a primeira visita, com a rede desligada, o jogo recarrega e a partida
  começa normalmente.
- **Modo professor:** baixar modelo, rejeitar pacote inválido (com mensagem), carregar pacote
  de turma, persistir após recarregar, jogar e emitir certificado com as notícias novas.
- **Lighthouse (celular):** desempenho 96, acessibilidade 100.

## Roteiro de teste com usuários

Objetivo: verificar se o jogo é fácil de usar e se o jogador **aprende** a identificar sinais
de desinformação.

**Participantes:** 5 a 10 pessoas do público-alvo, idealmente incluindo pelo menos uma pessoa
que use recursos de acessibilidade (texto grande, leitor de tela ou leitura em voz alta).

**Procedimento (cerca de 25 min por pessoa):**

1. **Pré-teste (3 min):** mostrar 4 manchetes que não estão no jogo e pedir que a pessoa diga se
   compartilharia cada uma e por quê. Anotar quantas justificativas citam um sinal concreto
   (fonte, data, urgência, confirmação oficial…).
2. **Jogo (15 min):** a pessoa joga do início, sem ajuda. O observador anota onde ela hesita,
   o que pergunta e se usa as investigações.
3. **Pós-teste (3 min):** 4 manchetes novas, mesma pergunta.
4. **Questionário (4 min):**
   - SUS (System Usability Scale, 10 perguntas) para usabilidade.
   - "De 1 a 5, o jogo me ajudou a entender como checar uma notícia."
   - "Qual sinal de fake news você lembra?" (resposta livre)
   - "O que você mudaria?" (resposta livre)

**Dados do próprio jogo:** depois de cada sessão, abra Menu → **Relatório de partidas** e use
**Baixar CSV**. O relatório mostra taxa de acerto por tipo de notícia, as notícias mais erradas,
quantas investigações a pessoa usou e o acerto quando decidiu sem investigar.

**Indicadores:**

| Indicador | Fonte | Meta sugerida |
| --- | --- | --- |
| Justificativas com sinal concreto (pré → pós) | Pré/pós-teste | Aumentar |
| Nota SUS média | Questionário | ≥ 68 (acima da média) |
| Acerto nas meias verdades | Relatório | > 50% na Fase 2 |
| Decisões sem investigar | Relatório | Diminuir ao longo das fases |
| Concluiu sem pedir ajuda | Observação | ≥ 80% |

### Resultados

> Preencher após aplicar o roteiro: número de participantes, perfis, médias e principais
> observações. Registrar também o que **não** funcionou, para a seção de limitações.

| Participante | Perfil | Pré (sinais citados) | Pós (sinais citados) | SUS | Observações |
| --- | --- | --- | --- | --- | --- |
| P1 | | | | | |
