# Fake Hunter – Briefing para porte de framework

## CONTEXTO DO PROJETO

Você vai portar um jogo 2D educativo chamado **Fake Hunter**, hoje feito em **Unity 6 (URP 2D, C#)**,
para outro framework. É um projeto acadêmico de faculdade, desenvolvido em grupo. O objetivo do porte
é manter **exatamente as mesmas mecânicas, regras e conteúdo**, mudando só a tecnologia.

### Propósito educativo

O jogo ensina, na prática, a identificar desinformação. O jogador assume o papel de **checador de fatos
de uma comunidade** (cidade fictícia de Vale Verde): recebe notícias de vários canais, pode investigá-las
com ferramentas limitadas e decide se as compartilha ou as bloqueia. Depois de cada decisão, o jogo
explica **por que** aquela notícia era verdadeira, falsa ou parcialmente verdadeira — é aí que está o
aprendizado. Os casos cobrem sinais clássicos de fake news: fonte não identificada, urgência artificial,
cura milagrosa, site clonado, foto fora de contexto, dado desatualizado, manchete que distorce estudo real
e golpe financeiro.

Uma decisão de design importante: **fonte não confiável não significa notícia falsa**. Há casos propositais
em que um perfil ruim compartilha algo verdadeiro e em que uma fonte desconhecida acerta. O jogo quer que
o jogador avalie o **conteúdo** e a **confirmação em fontes oficiais**, não apenas quem enviou.

---

## LOOP DE JOGO

Para cada notícia da fase, nesta ordem:

1. **Leitura** — o jogador vê um cartão de notícia com: título, corpo, autor (fonte), canal onde foi
   publicada ("WhatsApp (mensagem encaminhada)", "Portal Oficial da Prefeitura"…), data e uma imagem
   ilustrativa.
2. **Investigação** — até **2 investigações por notícia** (configurável; 0 = ilimitado), escolhidas entre
   três botões. Cada botão usado é desabilitado, e ao atingir o limite todos são desabilitados. O resultado
   aparece em um painel de texto.
   - **Verificar Fonte** → texto específico da notícia sobre a procedência (ex.: "O link leva para um site
     que não é o do banco").
   - **Consultar Referência** → mostra o nome da fonte, o **status** dela (Confiável / Não confiável /
     Desconhecida, colorido em verde / vermelho / amarelo) e um histórico curto.
   - **Pesquisar** → texto específico da notícia simulando uma busca externa (ex.: "O Banco Central
     publicou nota oficial negando").
3. **Decisão** — dois botões: **Compartilhar** (verde) ou **Não Propagar** (vermelho). Após decidir, os
   botões de decisão e de investigação ficam desabilitados.
4. **Explicação** — abre um painel modal com: "Você acertou!" / "Você errou!", o veredito
   ("Esta notícia é VERDADEIRA / FALSA / PARCIALMENTE VERDADEIRA") e o texto educativo da notícia.
   Um botão "Próxima notícia" fecha o painel e avança.
5. Ao acabar a última notícia da fase → painel de **fim de fase**. Se a confiança zerar a qualquer
   momento → painel de **game over** (encerra o loop imediatamente, sem mostrar a explicação).

---

## REGRAS EXATAS

### Veredito e acerto

Cada notícia tem um veredito: `Verdadeira`, `Falsa` ou `ParcialmenteVerdadeira`.

- **Só notícias totalmente verdadeiras devem ser compartilhadas.**
- Parcialmente verdadeira conta como "não propagar" (ela ainda espalha desinformação).
- Portanto: `acertou = (jogadorCompartilhou == (veredito == Verdadeira))`.

### Confiança da comunidade

- Barra de 0 a 100, começa em **100**.
- Acerto: **+5** (teto 100). Erro: **−20** (piso 0).
- A barra muda de cor: **> 60 verde**, **31–60 amarelo**, **≤ 30 vermelho**.
- Chegou a **0 = game over** ("Você foi demitido").

### Pontuação

- Cada notícia tem dificuldade `Facil`, `Media` ou `Dificil` → multiplicador **1, 2 ou 3**.
- Acerto: `pontos += 100 * multiplicador + 25 * (sequenciaAtual - 1)`, onde `sequenciaAtual` é o número
  de acertos consecutivos **já incluindo o atual** (ou seja, o primeiro acerto não ganha bônus).
- Erro: a sequência zera e não há perda de pontos.
- Registra também: total de acertos, total de erros e **melhor sequência**.

### Progressão de fases

- Três fases encadeadas: **Fase 1 – Primeiros passos** → **Fase 2 – Meia verdade** →
  **Fase 3 – Caçador experiente**. Cada uma com **6 notícias**, em ordem fixa (há uma opção
  "embaralhar" por fase, desligada).
- O painel de fim de fase mostra o resumo (nome da fase, acertos, erros, melhor sequência, confiança
  final, pontuação) e três botões: **Jogar de novo**, **Próxima fase** e **Menu**.
  "Próxima fase" só aparece quando a fase tem uma próxima configurada (some na Fase 3).
- A confiança e a pontuação **reiniciam a cada fase** (não são acumulativas entre fases).
- "Menu" e o "Jogar" do menu principal sempre recomeçam da Fase 1.

### Game over

Painel com "Você foi demitido!", a frase "A comunidade perdeu a confiança no seu trabalho", acertos,
erros e pontuação, mais os botões **Tentar de novo** e **Menu**.

---

## MODELO DE DADOS

Todo o conteúdo é **dado, não código** — hoje em ScriptableObjects do Unity, que no porte devem virar
JSON, recursos do engine ou equivalente. São três entidades:

### Fonte (autor da notícia) — 11 instâncias

```
nomeExibido   : string   // "Tia Márcia", "Prefeitura de Vale Verde – Portal Oficial"
avatar        : imagem   // 256x256, opcional
status        : enum     // Confiavel | NaoConfiavel | Desconhecida
historico     : texto    // 1-2 frases sobre o histórico da fonte
```

Métodos auxiliares: `StatusTexto()` (devolve "Confiável" / "Não confiável" / "Desconhecida") e
`StatusCor()` (verde `#3FA34D` / vermelho `#D64545` / amarelo `#E6B333`).

As 11 fontes: Carlos Notícias (não confiável), Prefeitura de Vale Verde (confiável), Jornal da Cidade
(confiável), Tia Márcia (desconhecida), Dr. Saúde Natural (não confiável), Ministério da Saúde
(confiável), Blog Verdade Oculta (não confiável), INMET (confiável), @fofocasdacidade (não confiável),
Universidade Federal de Vale Verde (confiável), Zé do Bairro (desconhecida).

### Notícia — 18 instâncias

```
titulo              : string
corpo               : texto
imagem              : imagem   // 800x450, opcional
nomeCanal           : string   // onde foi publicada
data                : string   // formato dd/MM/yyyy, apenas exibição
autor               : ref Fonte
textoVerificarFonte : texto    // resultado da investigação 1
textoPesquisar      : texto    // resultado da investigação 3
veredito            : enum     // Verdadeira | Falsa | ParcialmenteVerdadeira
dificuldade         : enum     // Facil | Media | Dificil
explicacao          : texto    // mostrado após a decisão (o conteúdo educativo)
```

Distribuição atual: 7 verdadeiras, 7 falsas, 4 parcialmente verdadeiras; 6 fáceis, 6 médias, 6 difíceis.

### Fase

```
nomeFase    : string
descricao   : texto
noticias    : lista de ref Noticia
embaralhar  : bool
proximaFase : ref Fase (ou vazio)
```

**Importante:** os textos de todas as 18 notícias e 11 fontes já existem e estão prontos (em
português do Brasil). Eles devem ser **migrados na íntegra**, não reescritos. No projeto Unity estão em
`Assets/_Project/Data/{Noticias,Fontes,Fases}/*.asset` (arquivos YAML legíveis).

---

## ARQUITETURA ATUAL (para referência do porte)

Quatro scripts de lógica, dois de dados globais e três de áudio:

| Script                                        | Papel                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Noticia.cs`, `Fonte.cs`, `FaseDeNoticias.cs` | Modelos de dados (ScriptableObject).                                                                                                |
| `GameManager.cs`                              | Singleton de regras: confiança, pontuação, sequência, fim de fase, game over, troca de cena, som de acerto/erro.                    |
| `PainelNoticia.cs`                            | Controla o fluxo de uma fase: lista de notícias, índice atual, limite de investigações, preenche a UI, abre o painel de explicação. |
| `MenuPrincipal.cs`                            | Menu: Jogar, Como jogar (abre/fecha painel), Sair.                                                                                  |
| `ProgressoJogo.cs`                            | Classe estática com um único campo (`faseSelecionada`) para passar a fase entre recargas de cena.                                   |
| `UIAudioManager.cs`                           | Singleton persistente que toca o clique dos botões.                                                                                 |
| `MusicaMenu.cs`                               | Música de fundo em loop no menu.                                                                                                    |
| `SomAoClicar.cs`                              | Componente que liga o clique de um botão ao `UIAudioManager`.                                                                       |

Duas cenas: **Menu** (índice 0) e **Gameplay** (índice 1). A troca de fase recarrega a cena Gameplay
lendo `ProgressoJogo.faseSelecionada`.

**No porte, provavelmente vale simplificar:** a separação `GameManager` / `PainelNoticia` existe por
conveniência do Inspector do Unity. Em outro framework, um único controlador de partida + um estado
global de progresso costuma ser mais limpo. Recarregar a cena inteira para trocar de fase também é um
contorno de Unity — em outro engine basta trocar os dados e reiniciar o estado.

---

## INTERFACE (layout de referência, 1920x1080)

Tudo em uma tela única, sem rolagem:

```
┌─ HUD (topo, faixa escura) ─────────────────────────────────────────┐
│ [barra de confiança] Confiança: 100%   Notícia 1 de 6   Seq  Pontos │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ Cartão da notícia (papel creme) ──────────────────────────┐    │
│  │ [imagem 400x225]   TÍTULO                                   │    │
│  │                    corpo da notícia                         │    │
│  │ (o) Autor: ...     Publicado em: ...        Data: ...       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   [Verificar Fonte]  [Consultar Referência]  [Pesquisar]            │
│                 Investigações restantes: 2                          │
│   ┌─ Painel de resultado da investigação ───────────────────┐      │
│   └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│          [ Compartilhar ]            [ Não Propagar ]               │
│                   texto de feedback da decisão                      │
└────────────────────────────────────────────────────────────────────┘
```

Mais três painéis modais sobre fundo escurecido: **explicação**, **fim de fase** e **game over**.
E a tela de **menu**: fundo, logo à esquerda, botões Jogar / Como jogar / Sair, e um painel
"Como jogar" com as instruções.

### Identidade visual

Paleta fixa: azul-marinho `#1B2A41` (fundos), azul `#2F6690` (UI neutra), amarelo `#F4B942` (destaque),
verde `#3FA34D` (verdadeiro/compartilhar), vermelho `#D64545` (falso/bloquear), branco-papel `#F5F1E8`,
cinza `#8A94A6`. Estilo de arte: ilustração flat/cartoon, contornos suaves, leve textura de papel,
tema de redação de jornal (lupa, jornal, carimbo, post-its, mural de investigação).

Os assets já existem em `Assets/_Project/Art/` (4 fundos 1920x1080, logo, ícone do app, cartão com
9-slice, botões, 12 ícones, 5 imagens de canal) e `Assets/_Project/Audio/Music/` (acerto, erro,
game over, próxima fase, clique, 3 faixas de menu). Todos são PNG e MP3 reaproveitáveis.

### Áudio

- Acerto, erro, fim de fase e game over: efeitos pontuais disparados pelas regras.
- Clique: tocado por todos os botões, via singleton que sobrevive à troca de cena.
- Menu: música em loop.

---

## O QUE PRECISA SER CORRIGIDO NO PORTE

Pontos conhecidos do código atual que vale resolver em vez de replicar:

1. O arquivo `Assets/_Project/Scripts/Data/SomAoClicar_1.cs` declara a classe `SomAoClicar` — nome do
   arquivo diferente do nome da classe, o que **quebra a anexação do componente no Unity**. No porte,
   nomeie corretamente.
2. Scripts de áudio (`UIAudioManager`, `MusicaMenu`) estão dentro da pasta `Audio/`, misturados com
   os arquivos de som; o certo é ficarem junto dos outros scripts.
3. O projeto **nunca foi validado rodando** — a cena e as ligações foram montadas editando os arquivos
   YAML por fora do editor. Trate o comportamento descrito aqui como a especificação correta, não o
   arquivo de cena.
4. Não há persistência: pontuação e progresso se perdem ao fechar. Se o framework facilitar,
   vale salvar a melhor pontuação.

---

## PEDIDO

Com base em tudo acima, recrie o Fake Hunter em **[INFORME AQUI O FRAMEWORK]**, mantendo:

- as mesmas regras de acerto, confiança, pontuação e progressão;
- os mesmos 18 textos de notícia, 11 fontes e 3 fases (migrados na íntegra);
- o conteúdo em arquivos de dados separados do código, para facilitar adicionar notícias;
- a mesma paleta e a mesma estrutura de tela;
- os textos de interface em português do Brasil.

Comece propondo a estrutura de pastas e o formato dos arquivos de dados antes de escrever o código.
