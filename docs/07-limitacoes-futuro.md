# 7. Limitações e trabalhos futuros

## Reflexão crítica

### O que funcionou

- **Separar regras e conteúdo da interface** permitiu testar o jogo inteiro sem navegador e
  reescrever a interface (de tela fixa para responsiva) sem mexer nas regras.
- **Portar para a web** trouxe a acessibilidade praticamente de graça em relação a um motor de
  jogo: texto real, leitores de tela, zoom, voz do navegador.
- **Casos-armadilha** (fonte ruim acertando, fonte boa clonada) são o ponto pedagógico mais forte:
  forçam o jogador a investigar em vez de julgar pelo remetente.

### Limitações conhecidas

| Limitação | Impacto | Possível solução |
| --- | --- | --- |
| Conteúdo fixo e curto (24 notícias) | Rejogar fica previsível; quem joga duas vezes decora | Mais pacotes; embaralhar; banco de notícias por tema |
| Investigações são textos prontos | O jogador não pratica a busca real (Google, busca reversa de imagem) | Fase extra com links para ferramentas reais de checagem |
| Decisão binária | "Não propagar" junta "falso" e "meia verdade"; não pede justificativa | Pedir ao jogador qual sinal identificou antes de revelar |
| Sem servidor | Relatório e progresso ficam em cada navegador; o professor não vê a turma de forma centralizada | Exportar CSV (já existe); futuramente um painel da turma |
| Voz depende do navegador | Qualidade e disponibilidade da voz em pt-BR variam por aparelho | Gravar narração dos textos |
| Leitor de tela testado só via auditoria | Acessibilidade 100 no Lighthouse não substitui teste com quem usa leitor de tela | Testar com NVDA/TalkBack e pessoas cegas |
| Cidade fictícia | Evita polarização, mas pode parecer distante do dia a dia | Pacotes locais pelo modo professor |
| Sem RA/RV | Não explora tecnologias imersivas | Ver "Expansão" |
| Avaliação com usuários pendente | Ainda não há evidência medida de aprendizagem | Aplicar o [roteiro](06-metodologia-testes.md#roteiro-de-teste-com-usuários) |

### Riscos de conteúdo

- Explicações simplificadas podem soar definitivas; o jogo ensina **sinais**, não certezas.
  Por isso as explicações citam onde confirmar (Diário Oficial, órgão responsável, busca reversa).
- Pacotes do modo professor podem conter erros factuais; a validação confere apenas a
  estrutura, não a veracidade do conteúdo.

## Impacto e expansão

### Potencial de impacto

- **Educacional:** cabe numa aula, tem material de revisão (Caderno), certificado e relatório
  para discussão em grupo.
- **Social:** treina comportamento (parar e checar antes de compartilhar), que é o ponto em que a
  desinformação se espalha.
- **Replicável:** código aberto, sem servidor, sem custo de hospedagem relevante, e com conteúdo
  trocável pelo modo professor. Outra escola, cidade ou país pode adaptar sem programar.

### Caminhos de evolução

1. **Mais conteúdo:** pacotes temáticos (saúde, eleições, golpes financeiros, clima) e
   embaralhamento entre partidas.
2. **Etapa de justificativa:** antes de revelar o veredito, o jogador marca os sinais que
   percebeu; a pontuação premia a justificativa correta.
3. **Painel da turma:** backend opcional para o professor ver o desempenho da turma em tempo
   real e comparar pré e pós.
4. **Ferramentas reais:** uma fase que leva o jogador a usar busca reversa de imagens e sites de
   checagem, com casos reais já desmentidos.
5. **Internacionalização:** os textos de interface já estão concentrados; traduzir e criar
   pacotes em outros idiomas.
6. **Realidade aumentada:** apontar a câmera para um cartaz ou panfleto impresso e investigar a
   "notícia" no celular, levando o jogo para fora da tela.
7. **Narração gravada** para substituir a voz sintética do navegador.
