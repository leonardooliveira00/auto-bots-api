# 🛡️ AutoBots API - Sistema de Gestão de Oficina Mecânica

Esta é uma API robusta desenvolvida com **NestJS** e **Prisma ORM**, focada em escalabilidade, segurança de dados sensíveis e arquitetura desacoplada. O sistema foi projetado para gerenciar funcionários e clientes de uma oficína mecânica, garantindo total conformidade com boas práticas de engenharia de software e segurança (LGPD).

---

## 🚀 Tecnologias e Ferramentas

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** PostgreSQL
- **Linguagem:** TypeScript
- **Criptografia:** Crypto (AES-256-GCM)
- **Segurança de Credenciais:** Argon2 para senhas e HMAC para Hashing de busca.

---

## 🏗️ Arquitetura e Diferenciais Técnicos

O projeto utiliza uma arquitetura modular, onde cada recurso possui seu próprio módulo, controller e service, facilitando a manutenção e testes.

### 1. Modelagem Relacional (1:1)

Implementamos uma relação estrita de um para um entre as entidades `User` (Funcionário) e `Address` (Endereço).

- A tabela `Address` contém a chave estrangeira `userId`, garantindo que cada funcionário tenha um endereço único e facilitando a integridade referencial.
- Uso de **Nested Writes** do Prisma para criação atômica de Usuário + Endereço em uma única transação.

### 2. Segurança Avançada de Dados (LGPD Ready)

Diferente de implementações básicas, este projeto utiliza **Criptografia Autenticada** para dados sensíveis (CPF):

- **AES-256-GCM:** Cada CPF é criptografado gerando um **IV (Vetor de Inicialização)** e uma **Auth Tag** exclusivos. Isso garante que, mesmo que o banco de dados seja exposto, os dados permaneçam ilegíveis e qualquer tentativa de alteração seja detectada pelo algoritmo.
- **Blind Indexing (CPF Hash):** Criamos um hash determinístico (HMAC) do CPF. Isso permite realizar buscas únicas e rápidas no banco de dados (`findUnique`) sem a necessidade de descriptografar todos os registros.

---

## 🔧 Como Executar o Projeto

1.  **Clone o repositório:**

    ```bash
    git clone (https://github.com/leonardooliveira00/auto-bots-api.git)
    cd auto-bots-api
    ```

2.  **Instale as dependências:**

    ```bash
    npm i
    ```

3.  **Gerando as chaves:**
    No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o resultado tanto para:

- CPF_KEY_AES
- CPF_KEY_HMAC

4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/autobots?schema=public"
    ENCRYPTION_KEY="sua_chave_de_32_bytes_aqui" # Deve ser exatamente 32 caracteres
    ```

5.  **Configurando o banco de dados:**

## 🐳 Como Rodar com Docker (https://docs.docker.com/desktop/setup/install/windows-install/)

Para facilitar o setup do banco de dados, o projeto conta com suporte ao Docker Compose.

**Inicie o banco de dados:**

```bash
docker-compose up -d
```

```bash
npx prisma migrate dev
```

```bash
npx prisma generate
```

6.  **Inicie o servidor:**
    ```bash
    npm run start:dev
    ```

---

## 🛣️ Fluxo de Endpoints (V1)

| Método   | Rota         | Descrição                                                      |
| :------- | :----------- | :------------------------------------------------------------- |
| **POST** | `/users`     | Cadastra funcionário e endereço (Criptografia GCM automática). |
| **GET**  | `/users`     | Lista funcionários com CPF descriptografado (Visão Admin).     |
| **GET**  | `/users/:id` | Retorna os detalhes de um funcionário específico.              |

---

## 🔐 Detalhes da Implementação de Segurança

O fluxo de descriptografia no método `findAll` segue um padrão de **Data Transformation**:

1.  O Service solicita ao Prisma os campos `cpfEncrypted`.
2.  A função `cpfDecryption` desmembra a string do banco (`IV : AuthTag : TextoCifrado`).
3.  O algoritmo valida a integridade via `setAuthTag`.
4.  O dado limpo é mapeado para o retorno, e os campos sensíveis originais são removidos da resposta JSON final.

---

## 📝 Roadmap de Desenvolvimento

- [ ] Validação de duplicidade.
- [ ] Implementação de Autenticação via JWT.
- [ ] Criação de mais entidades do banco de dados

---

## 💡 Observações

Este projeto foi desenvolvido com foco em aprendizado avançado de backend, aplicando conceitos reais utilizados em ambientes de produção, principalmente no tratamento de dados sensíveis.
