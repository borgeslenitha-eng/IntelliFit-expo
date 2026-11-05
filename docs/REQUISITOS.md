# Requisitos e evidências acadêmicas

Referência lida: **17_INTELLIGENCE_ADS_Matutino (1)(1).pdf**, roteiro “A Casa que Aprende: ADS Matutino”, ExpoTech 2026.2, UniFECAF. O tema é uma aplicação web inteligente no contexto de Smart Home. O IntelliFit contribui com organização doméstica de alimentos e aproveitamento do estoque.

A tabela distingue implementação verificável no código de itens que precisam de comprovação ou trabalho do grupo.

| Critério do enunciado | Evidência nesta entrega | Situação |
| --- | --- | --- |
| Funcionalidade de ML que agregue valor | Recomendação por conteúdo com TF-IDF e busca dos k vizinhos mais próximos; preferência por ingredientes válidos próximos do vencimento | Implementada; testes e avaliação didática locais |
| Chatbot interativo via plataforma aceita | OpenAI API, ferramentas de estoque/receitas e página Chat autenticada | Implementado; fluxo testado com substitutos; integração real exige configuração local |
| Integração do ML à aplicação | `RecipeService.getRecommendations` usado na tela Receitas e na ferramenta `recommend_recipes` | Verificável no código |
| Backend REST em TypeScript e Node | Express, rotas, controladores, serviços e repositórios | Implementado; tipos verificados |
| Boas práticas e princípios SOLID | Separação de responsabilidades e dependências substituíveis na parte revisada de chat | Aplicados na revisão; não equivale a uma certificação do sistema inteiro |
| Swagger | Rotas de autenticação, alimentos, receitas e chat; documentação de confirmar/cancelar | Gerado; contrato do chat verificado em teste |
| Banco de dados | PostgreSQL, SQL inicial e migração idempotente do chat/cache | Código e scripts presentes; execução real não realizada nesta revisão |
| Frontend com consumo de API | React/TypeScript, serviços HTTP e páginas autenticadas | Build concluído |
| HTML/CSS responsivo e experiência do usuário | Estilos responsivos e páginas existentes | Código presente; revisão visual completa em diferentes dispositivos ainda necessária |
| Área do usuário final | Estoque, receitas, chat e perfil | Presente |
| Área administrativa | Existe campo `role`, mas não há painel e autorização de operações administrativas implementados | **Pendente do grupo** |
| Prototipação em Figma/AdobeXD | Não há arquivo ou link de protótipo no pacote | **Não comprovada neste pacote** |
| Equipe, inscrição e apresentação individual | Itens organizacionais do enunciado | Fora do que os arquivos de código comprovam |

## Delimitação da revisão

A revisão organiza e verifica principalmente ML e chatbot. Não cria um painel administrativo nem presume a existência de um protótipo. Esses itens devem ser tratados pelo grupo antes de afirmar atendimento integral ao enunciado.

O enunciado pede uma funcionalidade de ML e um chatbot integrado. Não especifica algoritmo, rede neural, classificador supervisionado, percentual mínimo de acurácia ou dataset rotulado. A escolha de TF-IDF e vizinhos mais próximos é uma decisão técnica do projeto, explicada em `ML_CHATBOT.md`.

## Entregas que o grupo deve conferir

- [ ] Implementar/verificar área administrativa com controle de acesso no backend, além da interface.
- [ ] Reunir o protótipo e seu link/arquivo para apresentação.
- [ ] Executar o roteiro integrado com PostgreSQL, TheMealDB e OpenAI reais.
- [ ] Revisar responsividade e navegação nas telas usadas na demonstração.
- [ ] Garantir que todos consigam explicar a arquitetura e a própria contribuição.
