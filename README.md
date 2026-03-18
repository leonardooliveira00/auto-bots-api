# Todo API

API REST para gerenciamento de tarefas com autenticação de usuários.
Cada usuário possui sua própria lista de tarefas, com acesso protegido por token.

Este projeto foi desenvolvido como prática de backend moderno utilizando Node.js, arquitetura em camadas e autenticação baseada em JWT.

---

## 🚀 Tecnologias

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (JSON Web Token)
- Bcrypt
- Zod

---

## 📦 Funcionalidades

- Registro e autenticação de usuários
- Login com geração de token JWT
- CRUD completo de tarefas
- Cada usuário visualiza apenas suas próprias tarefas
- Validação de dados nas requisições
- Middleware de autenticação
- Tratamento global de erros

---

## 🔐 Autenticação

Após o login, a API retorna um token JWT que deve ser enviado nas requisições protegidas.

Header esperado:

```
Authorization: Bearer SEU_TOKEN
```

---

## 📂 Estrutura do projeto

```
src
 ├── controllers
 ├── services
 ├── middlewares
 ├── validations
 ├── lib
 ├── errors
 └── routes
```

Arquitetura baseada em separação de responsabilidades:

- **Controllers** → lidam com requisições HTTP
- **Services** → lógica de negócio
- **Middlewares** → autenticação e tratamento de erros
- **Validations** → schemas de validação

---

## ⚙️ Instalação

Clone o repositório:

```
git clone https://github.com/leonardooliveira00/todo-api.git
```

Entre no diretório:

```
cd todo-api
```

Instale as dependências:

```
npm install
```

---

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto.

Exemplo:

```
DATABASE_URL="postgresql://user:password@localhost:5432/todo"
JWT_SECRET="your_secret_key"
PORT=3000
```

---

## 🗄 Banco de dados

Execute as migrations do Prisma:

```
npx prisma migrate dev
```

Opcionalmente, abra o Prisma Studio:

```
npx prisma studio
```

---

## ▶️ Rodando o projeto

Modo desenvolvimento:

```
npm run dev
```

O servidor iniciará em:

```
http://localhost:3000
```

---

## 📡 Endpoints principais

### Autenticação

**POST /login**

```
{
  "email": "user@email.com",
  "password": "password"
}
```

---

### Tarefas (rotas protegidas)

**GET /tasks**
Lista todas as tarefas do usuário autenticado.

**GET /tasks/:id**
Busca uma tarefa específica.

**POST /tasks**

```
{
  "title": "Nova tarefa",
  "description": "Descrição opcional"
}
```

**PUT /tasks/:id**
Atualiza uma tarefa.

**DELETE /tasks/:id**
Remove uma tarefa.

---

## 📘 Objetivo do projeto

Este projeto foi criado para praticar:

- construção de APIs REST
- autenticação com JWT
- organização de código em camadas
- uso de ORM moderno
- boas práticas de backend com TypeScript

---

## 📄 Licença

Este projeto está disponível para fins de estudo e aprendizado.
