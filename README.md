# IntelliFit

Aplicação web para organização e gerenciamento doméstico de alimentos.

O IntelliFit permite controlar alimentos em estoque, acompanhar sua validade, encontrar receitas com base nos ingredientes disponíveis e utilizar um assistente conversacional para auxiliar na organização.

## Funcionalidades

- Cadastro e gerenciamento de alimentos.
- Controle de quantidade, local de armazenamento e validade.
- Identificação de alimentos próximos do vencimento.
- Recomendações de receitas com base no estoque.
- Recomendação de receitas utilizando TF-IDF e similaridade do cosseno.
- Assistente conversacional integrado à OpenAI.
- Autenticação de usuários.
- API documentada com Swagger.

## Tecnologias

### Frontend

- React
- TypeScript
- Vite
- React Router

### Backend

- Node.js
- TypeScript
- Express
- PostgreSQL
- OpenAI API
- TheMealDB

## Estrutura

```text
IntelliFit/
├── backend/
│   ├── src/
│   └── tests/
├── frontend/
│   └── src/
└── docs/
```

## Requisitos

- Node.js 22.12+
- npm
- PostgreSQL

## Instalação

### 1. Banco de dados

Crie um banco PostgreSQL chamado `intellifit` e execute o arquivo:

```text
backend/database.sql
```

### 2. Backend

```bash
cd backend
npm ci
```

Configure o arquivo `.env` com as informações necessárias.

Depois, execute:

```bash
npm run dev
```

O backend será iniciado na porta `3000`.

A documentação da API estará disponível em:

```text
http://localhost:3000/api-docs
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço para acessar a aplicação, normalmente:

```text
http://localhost:5173
```

## Testes

Para executar as validações do backend:

```bash
cd backend
npm run validate:all
```

Para gerar o build do frontend:

```bash
cd frontend
npm run build
```
