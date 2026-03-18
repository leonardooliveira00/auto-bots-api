# Auto-Bots 🚗💨

**Slogan:** Katchaum! 💥

Auto-Bots é um sistema backend para gerenciamento de usuários de uma oficina mecânica, focando **autenticação segura** com técnicas de ponta: HMAC, Argon2 e AES.  
Este projeto foi desenvolvido como exercício de faculdade, mas com arquitetura e práticas profissionais.

---

## 🛠️ Tecnologias

- Node.js
- TypeScript
- Prisma ORM
- PostgreSQL (Docker)
- Argon2 (hash irreversível)
- AES-256-CBC (criptografia simétrica)
- HMAC SHA-256 (hash determinística para CPF)
- Express.js

---

## ⚡ Funcionalidades atuais

- Cadastro de usuários com:
  - CPF protegido com **HMAC** (busca/duplicidade)
  - CPF seguro com **Argon2** (irreversível)
  - CPF criptografado com **AES** (leitura segura)
  - Senha armazenada com **Argon2**
- Cadastro de endereço
- JWT para autenticação de rotas futuras

---

## 🚀 Como rodar o projeto

1. Clone o repositório:

```bash
git clone <repo-url>
cd auto-bots
```
