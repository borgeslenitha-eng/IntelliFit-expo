# IntelliFit

Aplicação web para organização doméstica de alimentos. O IntelliFit permite cadastrar e acompanhar alimentos por quantidade, local de armazenamento e validade, encontrar receitas com base no estoque e interagir com um assistente conversacional.

## Funcionalidades

- Cadastro, consulta, edição e organização de alimentos em estoque.
- Controle de validade e identificação de alimentos próximos do vencimento.
- Recomendações de receitas com base nos ingredientes disponíveis.
- Recomendador próprio usando TF-IDF e similaridade do cosseno (k-NN).
- Chatbot integrado à API da OpenAI para consultar e organizar o estoque e acessar receitas.
- Autenticação de usuários.
- Documentação da API com Swagger.

## Tecnologias

**Frontend**
- React
- TypeScript
- Vite
- React Router

**Backend**
- Node.js
- TypeScript
- Express
- PostgreSQL
- OpenAI API
- TheMealDB

## Estrutura do projeto

```text
IntelliFit/
├── backend/
│   ├── src/
│   │   ├── chat/          # Lógica e integração do chatbot
│   │   ├── controllers/   # Controladores da API
│   │   ├── ml/            # Recomendador de receitas
│   │   ├── repositories/  # Acesso aos dados
│   │   ├── routes/        # Rotas
│   │   └── services/      # Regras de negócio e integrações
│   ├── tests/
│   ├── .env.example
│   └── database.sql
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── styles/
└── docs/
    ├── ARQUITETURA.md
    ├── ML_CHATBOT.md
    ├── REQUISITOS.md
    └── VALIDACAO.md
```

## Requisitos

- Node.js 22.12 ou superior
- npm
- PostgreSQL

## Configuração e execução

### 1. Banco de dados

Crie um banco PostgreSQL chamado `intellifit` e execute o script `backend/database.sql` em um banco novo.

### 2. Backend

No terminal, a partir da pasta raiz do projeto:

```bash
cd backend
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis do arquivo `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=intellifit
JWT_SECRET=sua_chave_secreta

OPENAI_API_KEY=sua_chave_da_openai
OPENAI_MODEL=modelo_disponivel_na_sua_conta
```

Instale as dependências e inicie o servidor:

```bash
npm ci
npm run dev
```

O backend inicia na porta `3000`. O comando de desenvolvimento executa a migração do chat antes de iniciar a API.

A documentação Swagger estará disponível em:

```text
http://localhost:3000/api-docs
```

### 3. Frontend

Abra outro terminal na pasta raiz do projeto:

```bash
cd frontend
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço local para acessar a aplicação, normalmente `http://localhost:5173`.

## Testes e validação

Para executar as verificações automatizadas do backend:

```bash
cd backend
npm run validate:all
```

Para gerar e verificar o build do frontend:

```bash
cd frontend
npm run build
```

As integrações com PostgreSQL, OpenAI e TheMealDB dependem das configurações locais. Consulte `docs/VALIDACAO.md` para o roteiro de teste integrado e os limites das verificações já realizadas.

## Documentação adicional

- [Arquitetura do sistema](docs/ARQUITETURA.md)
- [Machine Learning e chatbot](docs/ML_CHATBOT.md)
- [Requisitos e pendências](docs/REQUISITOS.md)
- [Validação e roteiro de demonstração](docs/VALIDACAO.md)

## Observações

- Não publique o arquivo `backend/.env` nem chaves de API no GitHub. O `.gitignore` já está configurado para ignorar arquivos `.env`; mantenha apenas o `.env.example` no repositório.
- O recomendador de receitas e o chatbot são componentes distintos: o recomendador classifica receitas por similaridade com os ingredientes disponíveis, enquanto o chatbot interpreta solicitações em linguagem natural e utiliza operações disponibilizadas pelo backend.
- A área administrativa e o protótipo visual citados nos requisitos acadêmicos não estão comprovados nesta entrega. Consulte `docs/REQUISITOS.md` para conferir o escopo e as pendências.
