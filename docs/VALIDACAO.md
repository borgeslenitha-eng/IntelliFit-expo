# Validação da revisão

Data: 04/11/2026. Os resultados abaixo se referem ao código desta entrega.

## Verificações automatizadas executadas

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Tipos do backend e testes, incluindo imports/parâmetros sem uso | `cd backend` e `npm run typecheck` | Passou |
| Regras e fluxos do chat, controlador e Swagger | `npm run validate:chat` | Passou |
| Matemática, regras do recomendador e avaliação didática | `npm run validate:ml` | Passou |
| Tolerância a falhas do serviço de receitas | `npm run validate:recipes` | Passou |
| Verificação conjunta do backend | `npm run validate:all` | Passou |
| Tipos e bundle do frontend | `cd frontend` e `npm run build` | Passou |

As dependências foram instaladas a partir dos lockfiles com `npm ci` no ambiente de revisão. A ausência de `cors` da revisão anterior não bloqueia mais a checagem de tipos. Não foram incluídos `node_modules`, builds, chaves ou `.env` no pacote.

`tests/chat-rules.test.ts` mantém as verificações determinísticas de datas, números, unidades, validade, lotes e consumo FEFO. `chat-flow.test.ts` exercita cadastro completo e por etapas, soma/separação, ambas as ordens de validade, cancelamento, confirmação, isolamento por usuário e ausência de gravação antes da confirmação. As dependências externas desses fluxos são substituídas por implementações em memória.

`chat-api.test.ts` verifica o controlador diretamente e os contratos Swagger. Isso não representa um teste HTTP de ponta a ponta. Os testes de ML usam fixtures locais e não dependem do conteúdo atual da TheMealDB. `recipe-network.test.ts` simula timeout de conexão, repetição, cache, interrupção, falhas parciais e limites de concorrência.

## Atualização de 05/11/2026 (correções de roteamento e avaliação do ML)

Estas verificações rodaram sem acesso à internet e sem `node_modules`: os testes foram executados com `tsx` e substitutos locais de `pg` e `dotenv`. Isso cobre `chat-rules`, `chat-flow`, o novo `chat-routing`, `ml`, `ml-evaluation` e o novo `ml-benchmark`. **Não** foram executados aqui `npm run typecheck` completo, `chat-api` (precisa de `express`), `recipe-network` nem o build do frontend. Rode `npm ci` e `npm run validate:all` no seu computador antes de considerar a revisão validada.

- `tests/chat-routing.test.ts`: mensagens que antes eram interceptadas por regex (cadastro/consumo citando "geladeira" ou "estoque", "o leite vence hoje?", "como fazer para cadastrar um alimento?", "ingredientes do estoque") agora chegam ao modelo; consultas objetivas continuam diretas; receitas por ordinal. Para registrar um caso novo, acrescente uma linha em `shouldReachModel` ou `answeredByBackend`.
- `tests/ml-benchmark.test.ts`: comparação com baselines, ablação da regra de ingrediente casado e efeito da ponderação por validade, descritos em `ML_CHATBOT.md`.

## Teste integrado a executar no computador do projeto

A integração completa com PostgreSQL, OpenAI e interface não foi executada neste ambiente. A busca e o carregamento de detalhes da TheMealDB foram verificados com chamadas reais durante a correção de conexão. Isso não valida a conectividade do computador do usuário. Use este roteiro antes da demonstração:

- [ ] Criar banco/configurar `.env`; executar `npm run dev` no backend e no frontend.
- [ ] Verificar que o Swagger abre e que rotas privadas rejeitam acesso sem autenticação.
- [ ] Cadastrar usuário, entrar e cadastrar alimentos pela tela.
- [ ] No chat, cadastrar “ovo”; informar os campos faltantes e confirmar que a pergunta de unidade oferece `un`, `g` ou `kg`.
- [ ] Cadastrar “ovos” com mesmo local/unidade e outra validade futura. Conferir as duas datas e escolher **Somar ao existente**; confirmar; verificar um único lote com saldo somado e a menor validade.
- [ ] Repetir escolhendo **Cadastrar separado**; confirmar que quantidade e validade da nova entrada foram preservadas.
- [ ] Iniciar uma alteração e cancelar; verificar que o estoque não mudou.
- [ ] Consumir quantidade que use dois lotes; conferir FEFO e exclusão dos vencidos.
- [ ] Conferir conversões de 200 g sobre 2 kg e de 250 ml sobre 2 L.
- [ ] Pedir receitas pela tela e pelo chat com o mesmo estoque; explicar que compartilham o recomendador e exibem até seis sugestões.
- [ ] Pedir o modo de preparo de uma das sugestões; conferir receita e idioma.
- [ ] Recarregar a página do chat e conferir histórico; limpar a conversa e verificar que o estoque permanece.
- [ ] Revisar páginas em largura de celular e desktop.

## Limpeza realizada

- Notas de “correção 2/3/4/5/6/7/8” e roteiros sobrepostos substituídos pelos quatro documentos atuais.
- Serviço de chat dividido em contratos, persistência, integração OpenAI, ferramentas, rascunhos, apresentação e orquestração.
- SQL de consumo retirado da conversa e colocado no repositório de alimentos, com validação no serviço.
- Testes retirados de `src` e reunidos em `backend/tests`.
- Código sem uso e helper de duplicidade substituído removidos; checagem de imports/parâmetros sem uso ativada.
- Descrição de confirmar/cancelar alinhada a uma rota real, documentada e usada pela interface.
- Históricos passam a recuperar as últimas 200 mensagens; configuração inicial do cache alinhada à migração.
- Textos de versão provisória e metadados de template removidos; README e instruções atualizados.

As pendências acadêmicas gerais, incluindo área administrativa e protótipo, estão em `REQUISITOS.md`. Este relatório distingue checagens locais de validação integrada e não atribui nota ou aprovação ao projeto.

## Comportamento de receitas diante de falhas de rede

O log `UND_ERR_CONNECT_TIMEOUT` indica que o Node não estabeleceu conexão com o serviço externo no prazo. Ele não identifica, sozinho, se a causa foi indisponibilidade da API, firewall ou rota de rede.

O cliente faz no máximo duas tentativas, com limite de 8 segundos por tentativa. As buscas e os detalhes compartilham um prazo de 20 segundos e usam até três conexões simultâneas. Uma falha individual não remove as receitas carregadas com sucesso. O cliente reutiliza respostas públicas em memória por 5 minutos; se a atualização falhar, pode aproveitar a última resposta com até 24 horas. Esse cache é temporário e desaparece ao reiniciar o backend.

Sem resultados aproveitáveis, a API retorna HTTP 503 com mensagem em português. A tela permite tentar novamente e diferencia falha no serviço externo de falha de conexão com o próprio backend. O ranking continua sendo TF-IDF + k-NN sobre os dados obtidos da TheMealDB. Não foi introduzido catálogo fictício ou gerador de receitas como substituto do ML.

Para retestar: conferir tanto o consumo com todos os lotes vencidos quanto o saldo parcialmente vencido; depois pedir um descarte explícito e verificar sua confirmação. Nas receitas, conferir a recuperação após falha temporária e o botão de nova tentativa em caso de indisponibilidade persistente. A aplicação ainda depende de a rede do usuário permitir acesso à TheMealDB.
