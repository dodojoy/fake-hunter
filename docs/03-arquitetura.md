# 3. Arquitetura

## Tecnologias

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 | Página estática, otimização de imagens, PWA nativo |
| Linguagem | TypeScript (modo estrito) | Tipos para o modelo de dados e as regras |
| Estilo | Tailwind CSS 4 + CSS próprio em `app/globals.css` | Layout responsivo; tokens de cor e temas (alto contraste) |
| Testes | Vitest | Testes rápidos das regras e do conteúdo |
| APIs do navegador | Web Speech, Web Audio, Service Worker, localStorage | Voz, sons, modo offline e memória sem servidor |

Não há backend: o jogo é gerado como página estática (`○ /` no build) e todo o estado fica no
navegador.

## Por que portar do Unity para a web

O protótipo original foi feito em Unity 6 (URP 2D, C#), mas **nunca chegou a ser validado
rodando**: as cenas foram montadas editando os arquivos YAML fora do editor, e havia um arquivo
cujo nome não batia com a classe (o que impede anexar o componente). O porte para a web resolveu
isso e trouxe vantagens para o objetivo educativo:

- Roda em qualquer celular ou computador com navegador, sem instalar nada (escolas costumam ter
  máquinas restritas).
- Texto real em HTML: leitores de tela, ampliação de fonte, alto contraste e leitura em voz alta
  funcionam de forma nativa, o que seria muito mais difícil numa tela desenhada pelo motor.
- Build pequeno e rápido de carregar (Lighthouse no celular: desempenho 96).

As mecânicas, as regras e os textos foram mantidos; a arte original (fundos, logo, ícones,
imagens de canal, fita e clipe do cartão) foi reaproveitada.

## Organização do código

```
app/
  layout.tsx          fontes, metadados, aplicação das preferências antes da 1ª pintura
  page.tsx            renderiza <FakeHunter />
  manifest.ts         manifesto do PWA
  globals.css         tokens de cor, temas, componentes (papel, botões), animações, impressão
components/
  FakeHunter.tsx      controlador global: menu → introdução → partida → certificado
  Partida.tsx         tela de jogo: HUD, cartão, investigação, decisão, tutorial e modais
  Menu.tsx            menu e painéis (como jogar, caderno, acessibilidade, relatório, professor)
  Intro.tsx           mensagem de boas-vindas (narrativa)
  Certificado.tsx     certificado final imprimível
  Caderno.tsx         Caderno do Checador
  Acessibilidade.tsx  opções de acessibilidade
  Relatorio.tsx       estatísticas das decisões e exportação CSV
  ModoProfessor.tsx   importação/exportação de pacotes de conteúdo
  ui.tsx              Botao, Modal, Painel, Interruptor, BotaoOuvir, Legendas, Fundo, Icone
lib/
  conteudo.ts         tipos do modelo, validação de pacotes, conteúdo ativo
  regras.ts           regras puras do jogo (sem React)
  preferencias.ts     preferências de acessibilidade (localStorage + atributos no <html>)
  memoria.ts          recordes, caderno e relatório (localStorage, por pacote)
  audio.ts            efeitos, música e legendas de som
  voz.ts              leitura em voz alta
data/                 conteúdo original em JSON
tests/                testes automatizados
public/               arte, ícones do app e service worker (sw.js)
scripts/migrar_unity.py   migração dos ScriptableObjects do Unity para data/*.json
```

## Decisões técnicas

### Regras puras, separadas da interface

`lib/regras.ts` recebe um estado e devolve o próximo (`decidir`, `investigar`,
`proximaNoticia`…), sem efeitos colaterais. A interface chama essas funções e cuida dos efeitos
(som, salvar recorde, registrar no relatório). Isso permite testar todas as regras sem
navegador e evita divergência entre o que a tela mostra e o que a regra diz.

No Unity, as regras estavam divididas entre `GameManager` e `PainelNoticia` por conveniência do
Inspector; aqui há um único estado de partida.

### Conteúdo como dado, validado

As notícias, fontes, fases e sinais ficam em JSON. `montarConteudo` valida o pacote (campos
obrigatórios, valores permitidos, ids repetidos, referências quebradas, ciclo de fases) e
resolve as referências por id. A mesma função atende o conteúdo original e os pacotes do modo
professor, com mensagens de erro em português.

### Troca de fase sem recarregar

No Unity, trocar de fase recarregava a cena. Aqui o componente `Partida` é remontado com uma
`key` nova, o que zera o estado sem recarregar a página.

### Preferências antes da primeira pintura

Um script curto no `<head>` aplica fonte, contraste e animações salvos antes de o React
carregar, para a página não "piscar" no visual padrão.

### PWA e offline

`app/manifest.ts` torna o jogo instalável. `public/sw.js` guarda a página e os arquivos
estáticos: depois da primeira visita, o jogo abre e roda sem internet (verificado com o
navegador em modo offline). O service worker só é registrado no build de produção.

### Qualidade

- `npm run lint` (ESLint com regras do React/Next), `npm run typecheck` (TypeScript estrito),
  `npm test` (Vitest) e `npm run build` devem ser rodados antes de cada entrega (não há CI
  automática, para economizar minutos do GitHub Actions).
- Código formatado com Prettier (largura 100).
