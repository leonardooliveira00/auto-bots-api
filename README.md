# 🚀 Auto Bots API

Uma API REST desenvolvida com foco em boas práticas de backend, segurança de dados sensíveis e arquitetura escalável.

O projeto implementa um sistema de criação de usuários com tratamento seguro de informações críticas como CPF e senha, utilizando múltiplas camadas de proteção.

---

## 🧠 Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod (validação)
- Argon2 (hash)
- Crypto (HMAC + AES)

---

## 🔐 Segurança implementada

Este projeto aplica um pipeline de segurança para o CPF:

- **HMAC (SHA-256)**
  → Usado para garantir unicidade e busca determinística

- **Argon2**
  → Armazenamento seguro (hash irreversível)

- **AES-256-GCM**
  → Criptografia para possível recuperação do dado

Além disso:

- Senhas são hasheadas com bcrypt/argon2
- Dados sensíveis não são retornados na API
- Uso de variáveis de ambiente para chaves secretas

---

## 📁 Estrutura do projeto

```
src/
├── controllers/
├── services/
├── middlewares/
├── utils/
│   ├── encryption/
│   ├── clear-cpf.ts
├── prisma/
```

---

## ⚙️ Configuração do ambiente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
```

---

### 2. Instale as dependências

```bash
npm install
```

---

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

CPF_KEY_AES= (64 caracteres hex)
CPF_KEY_HMAC= (64 caracteres hex)
```

---

### 🔑 Gerando as chaves

No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o resultado tanto para:

- CPF_KEY_AES
- CPF_KEY_HMAC

---

### 4. Configurar o banco de dados

```bash
npx prisma migrate dev
```

```bash
npx prisma generate
```

---

### 5. Rodar o projeto

```bash
npm run dev
```

```bash
npx prisma dev
```

---

## 📌 Endpoint principal

### Criar usuário

**POST** `/user/register`

### Exemplo de body:

```json
{
  "name": "Leonardo",
  "lastname": "Oliveira",
  "email": "leo.dev@email.com",
  "phoneNumber": "85999999999",
  "cpf": "12345678901",
  "password": "12345678",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apto 101",
    "city": "Fortaleza",
    "state": "CE",
    "postalCode": "60000000"
  }
}
```

---

## ✅ Funcionalidades atuais

- Criação de usuário
- Validação de dados com Zod
- Hash de senha
- Criptografia e proteção de CPF
- Relacionamento com endereço
- Estrutura em camadas (Controller / Service)

---

## 🚧 Próximos passos

- Autenticação com JWT
- Middleware global de erros
- Validação de duplicidade com tratamento refinado
- Sistema de login
- Controle de acesso por usuário

---

## 💡 Observações

Este projeto foi desenvolvido com foco em aprendizado avançado de backend, aplicando conceitos reais utilizados em ambientes de produção, principalmente no tratamento de dados sensíveis.

---
