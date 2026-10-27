# 5. Conteúdo e modo professor

Todo o conteúdo do jogo é **dado, não código**. Há duas formas de mudá-lo:

1. **No projeto** — editar os arquivos em `data/` (exige rodar o build de novo).
2. **No navegador (modo professor)** — carregar um único arquivo JSON, sem programar.

## Arquivos de `data/`

| Arquivo | Conteúdo |
| --- | --- |
| `fontes.json` | Quem publica: nome, status e histórico |
| `noticias.json` | As notícias e o resultado de cada investigação |
| `fases.json` | Fases, ordem das notícias e a próxima fase |
| `sinais.json` | Anotações do Caderno do Checador |

### Fonte

```json
{
  "id": "TiaMarcia",
  "nomeExibido": "Tia Márcia",
  "avatar": null,
  "status": "Desconhecida",
  "historico": "Membro do grupo da família. Compartilha muitas mensagens recebidas de outros grupos, sem verificar."
}
```

`status`: `Confiavel`, `NaoConfiavel` ou `Desconhecida`.

### Notícia

```json
{
  "id": "Feriado",
  "titulo": "Feriadão amanhã?",
  "corpo": "Corre um aviso dizendo que…",
  "imagem": "/img/noticias/canal_whatsapp.png",
  "nomeCanal": "WhatsApp (mensagem encaminhada)",
  "data": "08/09/2026",
  "autor": "CarlosNoticias",
  "textoVerificarFonte": "Resultado de 'Verificar Fonte'",
  "textoPesquisar": "Resultado de 'Pesquisar'",
  "veredito": "Falsa",
  "dificuldade": "Facil",
  "explicacao": "Texto educativo mostrado depois da decisão.",
  "sinais": ["fonte-nao-identificada", "prova-ausente"]
}
```

| Campo | Valores | Obrigatório |
| --- | --- | --- |
| `veredito` | `Verdadeira`, `Falsa`, `ParcialmenteVerdadeira` | sim |
| `dificuldade` | `Facil` (×1), `Media` (×2), `Dificil` (×3) | sim |
| `autor` | `id` de uma fonte | não (mostra "Desconhecido") |
| `imagem` | caminho em `public/` ou URL `https://` | não |
| `sinais` | `id`s de `sinais.json` | não, mas recomendado |
| `data` | texto livre, exibido como está (use dd/mm/aaaa) | sim |

O resultado de *Consultar Referência* vem automaticamente da fonte (`status` + `historico`).

### Fase

```json
{
  "id": "Fase1",
  "nomeFase": "Fase 1 – Primeiros passos",
  "descricao": "Notícias fáceis: aprenda a usar as ferramentas.",
  "abertura": "Mensagem da coordenadora no início da fase.",
  "noticias": ["Feriado", "VacinaGripe", "ChaBoldo"],
  "embaralhar": false,
  "proximaFase": "Fase2",
  "ocultarStatusDaFonte": false,
  "dica": ""
}
```

A primeira fase da lista é onde o jogo começa; `proximaFase: null` marca a última (que leva à
tela de conclusão). `descricao`, `abertura`, `ocultarStatusDaFonte` e `dica` são opcionais:

- `ocultarStatusDaFonte: true` faz *Consultar Referência* omitir se a fonte é confiável.
- `dica` com texto faz aparecer o botão de lâmpada com essa dica.

### Sinal

```json
{
  "id": "urgencia-artificial",
  "tipo": "alerta",
  "nome": "Urgência artificial",
  "descricao": "\"Só hoje\", \"compartilhe antes que apaguem\"…"
}
```

`tipo`: `alerta` (sinal de desinformação) ou `boa-pratica` (sinal de que a notícia é confiável).

## Adicionar uma notícia ao projeto

1. Acrescente o objeto em `data/noticias.json` com um `id` novo.
2. Coloque o `id` na lista `noticias` de uma fase em `data/fases.json`.
3. Rode `npm test`: os testes de conteúdo apontam campo faltando, valor inválido, referência
   quebrada, imagem inexistente ou sinal que nenhuma notícia usa.

> Os testes de `tests/conteudo.test.ts` também conferem os números do conteúdo original
> (24 notícias, 6 por fase etc.). Se a mudança for proposital, atualize esses números no teste.

## Modo professor

Menu → **Modo professor**:

1. **Baixar modelo (.json)** baixa o conteúdo em uso como um *pacote* — um único arquivo com
   `id`, `titulo`, `fontes`, `noticias`, `fases` e (opcional) `sinais`.
2. Edite o arquivo: troque as notícias por casos da escola ou do bairro. Dê ao pacote um `id`
   próprio (ex.: `"turma-8a"`).
3. **Carregar pacote** valida o arquivo. Se houver erro, a mensagem diz qual é, por exemplo:
   `Notícia "n3": "veredito" deve ser "Verdadeira", "Falsa", "ParcialmenteVerdadeira" (veio "Talvez").`
4. O pacote fica salvo no navegador; **Voltar ao original** restaura as notícias de Vale Verde.

Cada pacote tem seus próprios recordes, caderno e relatório, separados pelo `id`.

Dicas para criar bons casos:

- Escreva a `explicacao` dizendo **qual sinal** entregava a notícia e **onde confirmar**.
- Inclua ao menos uma meia verdade e um caso em que a fonte ruim acerta.
- Faça `textoVerificarFonte` e `textoPesquisar` darem pistas complementares, para que a escolha
  das 2 investigações importe.
