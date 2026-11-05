# Machine Learning e chatbot: explicação para apresentação

## Problema e contribuição

O IntelliFit ajuda a escolher receitas a partir dos alimentos disponíveis e a visualizar o que pode ser aproveitado antes de vencer. A recomendação reduz a necessidade de buscar receitas manualmente. O chat permite consultar e organizar os mesmos dados por linguagem natural.

São duas funcionalidades: um recomendador próprio em TypeScript e um assistente integrado à OpenAI API. A geração de linguagem da OpenAI não é usada como prova de implementação do recomendador.

## Dados do recomendador

Em execução, a TheMealDB fornece receitas e ingredientes. O backend busca por ingredientes conhecidos do estoque, reúne candidatos sem repetir IDs, pré-seleciona até 24 receitas e carrega seus detalhes. Cada lista de ingredientes é um documento do corpus; o estoque é a consulta.

O catálogo é recuperado sob demanda. Não existe arquivo de modelo pré-treinado, aprendizado de preferências de usuários ou treinamento supervisionado com rótulos. O corpus e os pesos IDF são construídos a partir das receitas candidatas a cada solicitação.

## Etapas implementadas

1. Retirar alimentos vencidos ou sem quantidade disponível.
2. Resolver nomes conhecidos de ingredientes para a nomenclatura usada nas receitas.
3. Reunir lotes do mesmo ingrediente em uma representação única. O lote válido mais urgente determina o peso de validade; vários lotes não multiplicam o peso artificialmente.
4. Normalizar os textos e tokenizar os ingredientes.
5. Ajustar vocabulário e IDF **somente nas receitas**, sem incluir a consulta no ajuste.
6. Transformar receitas e estoque com o mesmo vetorizador.
7. Calcular a similaridade do cosseno e a distância `1 − similaridade`.
8. Selecionar os k vizinhos mais próximos com similaridade positiva **e ao menos um ingrediente do estoque casado por expressão inteira**. Essa condição mantém o vetor (por palavra) e a explicação mostrada ao usuário (por expressão) consistentes: sem ela, "Sesame Oil" seria vizinho de "Olive Oil" apenas pela palavra "oil", gerando uma receita recomendada com zero ingredientes do usuário. Em empate, usar quantidade de ingredientes correspondentes e ID estável.
9. Localizar nomes/detalhes para pt-BR depois de ordenar o ranking.

A tela e o chat solicitam até seis receitas. Um estoque vazio ou sem termos do vocabulário não gera sugestões arbitrárias.

## Matemática utilizada

Para termo `t` e documento `d`:

- `TF(t,d) = ocorrências de t em d / número de tokens de d`.
- `IDF(t) = ln((N + 1) / (DF(t) + 1)) + 1`, com `N` receitas e `DF(t)` receitas contendo o termo.
- `TF-IDF(t,d) = TF(t,d) × IDF(t)`.
- `cos(a,b) = (a · b) / (||a|| × ||b||)`; se um vetor for nulo, a similaridade é zero.
- `distância(a,b) = 1 − cos(a,b)`.

Para alimentos que vencem em até 7 dias, os tokens do ingrediente são repetidos duas vezes na consulta. É uma preferência de negócio definida manualmente, não um parâmetro aprendido. Se todos os ingredientes tiverem a mesma urgência, a direção do vetor permanece proporcional; o efeito ocorre quando há urgências diferentes no estoque.

A busca é exata por força bruta, adequada ao pequeno corpus de candidatos. É recomendação por conteúdo com busca não supervisionada de vizinhos; não é um classificador supervisionado que prediz uma classe. Existe ajuste do TF-IDF (`fit`) e transformação da consulta (`transform`), sem otimização iterativa de parâmetros de um classificador.

O campo técnico `mlScore` representa a similaridade multiplicada por 100. **Não é acurácia, probabilidade de acerto ou percentual de ingredientes disponíveis.** A interface não mostra esse número como confiança.

## Avaliação reproduzível

`backend/tests/fixtures/recipe-catalog.ts` contém 8 receitas e 8 consultas sintéticas com relevância definida manualmente. `ml-evaluation.test.ts` calcula:

- **Precision@1:** proporção das consultas cuja primeira recomendação é relevante.
- **MRR@3:** média do inverso da posição do primeiro resultado relevante nas três primeiras posições; se não houver relevante, a contribuição é zero.

Nesta revisão, ambas resultaram em **1,0 nesse conjunto didático**. Isso verifica exemplos conhecidos e a implementação das métricas; não demonstra desempenho com usuários reais. O conjunto é pequeno, explícito, fácil e também usado para regressão. Não há conjunto independente de avaliação de generalização ou comparação experimental com outros algoritmos.

Os testes também verificam exclusão de vencidos, correspondência única, singular/plural, invariância à divisão em lotes, casos sem recomendação e as etapas matemáticas do vetorizador.

### Avaliação comparativa e efeito da validade

`backend/tests/ml-benchmark.test.ts` usa um catálogo sintético maior e mais difícil (18 receitas, 15 consultas, relevância graduada 0/1/2 escrita à mão, com armadilhas como "Sesame Oil" × "Olive Oil" e "Chicken Stock" × "Chicken") e compara quatro métodos com Precision@1, MRR@3 e nDCG@3:

| Método | P@1 | MRR@3 | nDCG@3 |
| --- | --- | --- | --- |
| Baseline: contagem de ingredientes em comum | 1,00 | 1,00 | 0,971 |
| Baseline: cobertura da receita (fração) | 1,00 | 1,00 | 0,993 |
| TF-IDF + k-NN sem exigir ingrediente casado | 1,00 | 1,00 | 0,965 |
| TF-IDF + k-NN (versão do projeto) | 1,00 | 1,00 | 0,965 |

**Como interpretar com honestidade:** nessa escala todos os métodos ficam próximos do teto, e o baseline de cobertura é ligeiramente melhor em nDCG@3. Não há base para afirmar que o TF-IDF supera métodos simples; a diferença está dentro do que se esperaria de ruído com 15 consultas, e não foi feito teste de significância. Um modelo híbrido (cosseno + cobertura) subiu cerca de 0,015 de nDCG@3 em todo o conjunto, mas a validação cruzada leave-one-query-out voltou a 0,965, então ele não foi adotado.

**Onde está a contribuição verificável:** os baselines ignoram a validade. Em um cenário com 15 itens no estoque, marcando um por vez como o que vence em 2 dias, o ingrediente urgente aparece na **primeira recomendação em 12 de 15 casos com a ponderação, contra 5 de 15 sem ela** (mesmo catálogo e mesmos itens). Esse é o argumento de valor do projeto: reduzir desperdício, e não ter uma acurácia maior que a de uma contagem simples. A conclusão vale para o catálogo sintético; com a TheMealDB real, repetir a medição.

## Limitações que devem ser explicadas

O resultado depende do catálogo recuperado e da pré-seleção. A normalização usa um dicionário finito (cerca de 290 entradas após esta revisão); nomes desconhecidos ou ambíguos podem não ser resolvidos, e um alimento sem tradução não participa do ranking nem da busca de candidatos. Itens como "requeijão", "nata", "fermento" e "noz" continuam sem tradução por ambiguidade ou falta de equivalente. A recomendação compara presença de ingredientes, não verifica se a quantidade do estoque basta para todas as porções. Similaridade por tokens não equivale à compreensão semântica completa de ingredientes. Para medir utilidade real, seria necessário um catálogo fixo maior e consultas avaliadas por pessoas que não participaram da construção dos exemplos.

## Chatbot

O fluxo é `mensagem → controller → serviço → OpenAI/function calling → ferramenta validada → resposta`. Consultas objetivas e comandos de confirmar/cancelar podem ser resolvidos diretamente pelo backend. O modelo não recebe acesso SQL nem grava dados por conta própria.

**Roteamento.** Atalhos por regex respondem sem a OpenAI apenas a consultas objetivas ("geladeira", "vencidos", "vence nos próximos 3 dias") e comandos de confirmar/cancelar. Eles não interceptam mensagens com verbo que altera estoque (comprei, coloquei, tirei, usei, registre, atualize…), perguntas sobre um alimento específico ("o leite vence hoje?") nem perguntas sobre o uso do aplicativo ("como fazer para cadastrar um alimento?"); essas seguem para o modelo. A assimetria é intencional: um falso positivo da proteção apenas envia a mensagem ao modelo, enquanto um falso negativo executaria a ação errada. Receitas podem ser citadas por posição ("a primeira", "a última", "opção 2"), resolvida pelo backend na ordem em que foram exibidas.

Para alterações: `intenção → rascunho/proposta → escolha de lote, se necessária → confirmação → serviço → repositório`. Se faltarem quantidade, unidade, local ou validade, o cadastro continua como rascunho. Datas, saldo e conversões são verificados por regras determinísticas.

A função `recommend_recipes` chama o mesmo `RecipeService` da tela de receitas. O contexto guarda os IDs das sugestões para recuperar ingredientes e modo de preparo sem confundir receitas diferentes.

### Regras de lotes e unidades

- “ovo” e “ovos” compartilham identidade; qualificadores como “branco” e “caipira” continuam distintos. A regra cobre plurais comuns, não todos os sinônimos da língua.
- No cadastro pelo chat, havendo lote válido com mesmo nome normalizado, local e unidade compatível, é oferecida a escolha de somar ou separar, mesmo com datas diferentes.
- O candidato sugerido é o lote com validade mais próxima. A operação soma a nova entrada a esse lote; não funde automaticamente todos os registros antigos.
- Ao somar, o novo saldo usa a data mais próxima entre as duas entradas. O usuário vê as datas antes de confirmar. Separar preserva a nova validade.
- No consumo, usa-se primeiro o lote válido que vence antes (FEFO). Vencidos ficam fora do consumo normal. Se todos estiverem vencidos, a mensagem explica o bloqueio e orienta a pedir descarte. Se o saldo válido for insuficiente, a mensagem informa o saldo e explica a exclusão dos vencidos. Um descarte explícito é apresentado como descarte, com confirmação.
- As perguntas não sugerem embalagens; para ovos, aparecem `un`, `g` ou `kg`. Embalagens explícitas continuam aceitas, sem conversão inventada para unidades.
- As conversões automáticas são somente `g ↔ kg` e `ml ↔ L`.

## Roteiro curto de fala

“O nosso ML é um recomendador por conteúdo. Os ingredientes das receitas formam um corpus, ajustamos o TF-IDF nesse corpus e transformamos o estoque na mesma representação. Calculamos a distância do cosseno e buscamos os k vizinhos mais próximos. A validade é uma regra adicional para favorecer ingredientes urgentes. O chat usa OpenAI para interpretar mensagens, mas todas as operações passam pelo backend e pela confirmação. Ele também chama esse mesmo recomendador.”

## Referências de apoio

A implementação é própria em TypeScript; não importa scikit-learn. As referências abaixo explicam as técnicas usadas:

- [scikit-learn — extração de atributos e TF-IDF](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting).
- [scikit-learn — vizinhos mais próximos e busca não supervisionada](https://scikit-learn.org/stable/modules/neighbors.html#unsupervised-nearest-neighbors).
- TheMealDB: origem das receitas utilizada pelo serviço, em `https://www.themealdb.com/api/json/v1/1`.
