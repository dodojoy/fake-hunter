# 2. Game design

## Narrativa

O jogador é contratado pelo **Vale Verde Checa**, a agência de checagem da cidade fictícia de
Vale Verde. A coordenadora, Marta Ribeiro, apresenta a missão numa mensagem de boas-vindas e
reaparece na abertura de cada fase, comentando a evolução dos boatos:

| Fase | Tema | Abertura (resumo) |
| --- | --- | --- |
| 1 – Primeiros passos | Casos simples, aprender as ferramentas | "Primeiro dia… use as ferramentas sem pressa" |
| 2 – Meia verdade | Exagero, dado velho, manchete distorcida | "Os boatos ficam mais espertos" |
| 3 – Caçador experiente | Site clonado, foto antiga, fonte enganosa | "Os golpistas perceberam que você está de olho" |

Ao concluir a Fase 3, o jogador recebe um **certificado de Caçador de Fake News** com nome,
pontuação, acertos, sinais aprendidos e um nível (Aprendiz, Experiente ou Lendário).

## Fluxo de telas

```
Menu ─► Introdução (só na 1ª vez) ─► Abertura da fase ─► Tutorial (só na 1ª notícia da 1ª vez)
                                          │
                                          ▼
                     ┌──── Notícia: ler → investigar (até 2) → decidir ◄───┐
                     │                         │                           │
                     │                 carimbo + explicação ───────────────┘
                     │                         │ (última notícia)
                     │                         ▼
                     │                  Fim de fase ─► próxima fase / certificado
                     │
                     └─ confiança chegou a 0 ─► Game over ("Você foi demitido!")
```

O menu também dá acesso a: Como jogar, Caderno do Checador, Acessibilidade, Relatório de
partidas e Modo professor. Durante a partida, o botão de pausa (ou Esc) abre as opções de
acessibilidade.

## Loop de cada notícia

1. **Leitura** — cartão com título, texto, autor, canal de publicação, data e imagem.
2. **Investigação** — até 2 das 3 ferramentas; cada uma só pode ser usada uma vez:
   - *Verificar Fonte*: procedência da mensagem (ex.: "o link leva a um site que não é o do banco").
   - *Consultar Referência*: nome, status (Confiável / Não confiável / Desconhecida) e histórico do autor.
   - *Pesquisar*: o que uma busca em outros lugares revela.
3. **Decisão** — *Compartilhar* ou *Não Propagar*.
4. **Carimbo e explicação** — o cartão recebe um carimbo (VERDADEIRA / FALSA / MEIA VERDADE) e
   abre o painel com "Você acertou/errou", o veredito, a explicação educativa e os sinais
   daquela notícia (os inéditos aparecem como "novo no caderno!").

## Regras exatas

### Acerto

- Cada notícia tem veredito `Verdadeira`, `Falsa` ou `ParcialmenteVerdadeira`.
- **Só notícias totalmente verdadeiras devem ser compartilhadas.**
- `acertou = (compartilhou == (veredito == Verdadeira))`.

### Confiança da comunidade

- Barra de 0 a 100, começa em 100.
- Acerto: **+5** (teto 100). Erro: **−20** (piso 0).
- Cor: > 60 verde, 31–60 amarelo, ≤ 30 vermelho.
- Chegar a 0 encerra a fase na hora (game over), sem mostrar a explicação.

### Pontuação

- Multiplicador por dificuldade: Fácil 1, Média 2, Difícil 3.
- Acerto: `pontos += 100 × multiplicador + 25 × (sequência − 1)`, em que a sequência já inclui o
  acerto atual (o primeiro acerto não ganha bônus).
- Erro: a sequência zera; não há perda de pontos.
- Registra acertos, erros e melhor sequência.

Exemplo verificado em teste: acertar as 6 notícias da Fase 1 dá **975 pontos**.

### Progressão

- Fases encadeadas, 6 notícias cada, em ordem fixa (há a opção `embaralhar`, desligada).
- Confiança e pontuação **reiniciam a cada fase**.
- No fim de fase: *Jogar de novo*, *Próxima fase* (ou *Concluir jornada* na última) e *Menu*.
- *Jogar* no menu sempre começa uma nova jornada pela primeira fase.

Todas essas regras estão em [`lib/regras.ts`](../lib/regras.ts) e cobertas por
[`tests/regras.test.ts`](../tests/regras.test.ts).

## Conteúdo

18 notícias (7 verdadeiras, 7 falsas, 4 parcialmente verdadeiras; 6 de cada dificuldade),
11 fontes e 15 sinais no Caderno do Checador (12 sinais de alerta e 3 boas práticas). Os textos
das notícias e das fontes vieram na íntegra do protótipo em Unity.

### Casos de destaque

| Notícia | Por que está no jogo |
| --- | --- |
| Lote falsificado de remédio (Fase 3) | Fonte **não confiável** compartilha alerta **verdadeiro**: quem bloqueia, erra |
| Nova espécie de sapo (Fase 3) | Fonte **desconhecida** e texto informal, mas conteúdo verdadeiro |
| Prefeito investigado (Fase 3) | Usa o nome do jornal confiável num **site clonado** |
| Ônibus de graça (Fase 2) | Fato real **exagerado** ("todos os domingos"): meia verdade |
| Celular causa câncer (Fase 2) | Estudo real em ratos, **manchete distorcida** |
