# 🛡️ AutoBots API - Sistema de Gestão de Oficina Mecânica

# 🏛️ Arquitetura e Camadas da Aplicação

O ecossistema backend do **Auto-Bots** foi desenvolvido sob a arquitetura modular do **NestJS**, seguindo os princípios do SOLID e o padrão de injeção de dependências. A aplicação adota uma divisão clara de responsabilidades em camadas independentes, o que facilita a testabilidade, o desacoplamento e a manutenção do código.

---

## 🛠️ Stack Tecnológica e Padrões Clave

- **[NestJS (v10+)](https://nestjs.com/):** Framework Node.js progressivo baseado em TypeScript, escolhido pela sua estrutura opinativa que força uma arquitetura limpa e escalável de nível empresarial.
- **[PostgreSQL](https://www.postgresql.org/):** Banco de dados relacional robusto, ideal para manter a consistência e a integridade dos dados corporativos através de relacionamentos bem definidos.
- **[Prisma ORM](https://www.prisma.io/):** Ferramenta de mapeamento objeto-relacional moderna que acelera o desenvolvimento com migrações automáticas e tipagem estática ponta a ponta.
- **[Redis](https://redis.io/):** Banco de dados em memória de ultraperformance, utilizado de forma assíncrona como camada de cache global, além de atuar no controle rigoroso de sessões (Refresh Token Rotation) e Rate Limiting.
- **Padrão Repository:** Padrão arquitetural implementado para desacoplar a lógica de persistência dos serviços, garantindo que a lógica de negócio permaneça agnóstica a ferramentas de banco de dados.

---

## 🌐 Ambientes e Documentação

- **🚀 API em Produção (Deploy):** [https://auto-bots-api-production-e878.up.railway.app](https://auto-bots-api-production-e878.up.railway.app)
- **📖 Documentação Swagger (Ambiente Local):** `http://localhost:3000/api/`
- **📬 Documentação Swagger (Produção):** [https://auto-bots-api-production-e878.up.railway.app/api](https://auto-bots-api-production-e878.up.railway.app/api)

---

## 🧩 Visão Geral das Camadas

Cada módulo funcional da aplicação (ex: `User`, `Auth`) é estruturado internamente em três camadas principais:

### 1. Camada de Apresentação (Controllers & Gateways)

É a porta de entrada da aplicação, responsável por expor a API RESTful e gerenciar o protocolo HTTP.

- **Validação de Entrada:** Utiliza `ValidationPipe` junto com as bibliotecas `class-validator` e `class-mapper` para garantir que os dados recebidos (DTOs) estejam estritamente no formato esperado antes de tocar a lógica de negócio.
- **Segurança e Guardas:** É nesta camada que os `Guards` globais e específicos atuam. O `AccessToken Guard` intercepta as requisições para validar a autenticidade do JWT e se comunicar com o Redis para checar o status da sessão.

### 2. Camada de Lógica de Negócio (Services & Use Cases)

O coração da aplicação. Esta camada é completamente agnóstica em relação a rotas HTTP ou protocolos de transporte.

- **Regras de Negócio:** Centraliza as validações de fluxo, permissões corporativas e gerenciamento de estados.
- **Orquestração de Segurança:** Intermedeia a chamada para os módulos de criptografia antes de enviar os dados para persistência, garantindo que informações sensíveis sejam tratadas de forma isolada.
- **Integração de Cache:** Interage diretamente com o `CacheService` para gerenciar a leitura e escrita estratégica no Redis.

### 3. Camada de Acesso a Dados (Prisma Repositories & Entities)

Camada responsável pela comunicação com o banco de dados relacional e pela representação das tabelas em objetos de código.

- **Prisma ORM:** Abstrai as queries SQL de forma tipada e segura (Type-safe), garantindo integridade nas transações com o PostgreSQL.
- **Entidades e Sanitização:** Utiliza os decorators do `class-transformer` para aplicar lógica de infraestrutura diretamente nas entidades. É aqui que acontece o mascaramento automático de dados na saída da API (ex: ocultar caracteres de documentos) e a conversão de tipos.

---

### 4. Camadas Transversais e Complementares

Para dar suporte às camadas principais sem gerar acoplamento ou duplicação de código, a aplicação utiliza estruturas globais de compartilhamento:

- **Pasta `common/` (Infraestrutura Compartilhada):** Funciona como o núcleo de configuração global da aplicação. Abriga as inicializações de módulos de infraestrutura que servem a múltiplos domínios, como as diretrizes do módulo do Redis, políticas globais de Caching assíncrono e interceptores de comportamento do framework.
- **Pasta `utils/` (Utilitários Globais e Helpers):** Camada puramente funcional e isolada, responsável por abrigar funções utilitárias puras e agnósticas a regras de negócio. É aqui que residem os motores matemáticos e criptográficos do sistema, como os algoritmos de criptografia (AES-256-GCM), geradores de hash (SHA-256) e as funções de mascaramento estrito de caracteres para dados sensíveis.

> 💡 **Nota sobre Módulos de Domínio:** Módulos como `auth`, `users` e `sessions` (responsável pelo ciclo de vida e rotação de tokens das sessões de usuário) são tratados como módulos de domínio principais da aplicação, consumindo as ferramentas das pastas `common` e `utils` para garantir sua execução segura.

---

## 🚀 Como Executar o Projeto

Siga o passo a passo abaixo para rodar a aplicação localmente em seu ambiente de desenvolvimento.

### Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/) e Docker Compose

### Passos para Execução

1. **Clonar o Repositório e Instalar Dependências:**

```bash
   git clone [https://github.com/leonardooliveira00/auto-bots-api.git](https://github.com/leonardooliveira00/auto-bots-api.git)
   cd auto-bots
   npm install
```

2. **Configurar Variáveis de Ambiente:**

Crie um arquivo .env na raiz do projeto baseado no .env.example e preencha as credenciais (Portas, chaves de criptografia AES-256, secrets do JWT e strings de conexão):

```bash
cp .env.example .env
```

---

3. **Subir a Infraestrutura (PostgreSQL & Redis):**

Utilize o Docker Compose para isolar e rodar os serviços de banco de dados e cache em segundo plano:

```bash
docker compose up -d
```

---

4. **Rodar as Migrations do Banco de Dados:**

Com o banco de dados online, execute as migrações do Prisma para estruturar as tabelas e gerar o Prisma Client tipado:

```bash
npx prisma generate
npx prisma migrate dev
```

---

5. **Iniciar o Servidor de Desenvolvimento:**

Agora, inicialize o servidor de desenvolvimento do NestJS. A API estará pronta para receber requisições:

```bash
npm run start:dev
```

A aplicação estará disponível por padrão em `http://localhost:3000`.

---

## 🛣️ Fluxo de Endpoints (V1)

| Método     | Rota            | Descrição                                                      | Protegida |
| :--------- | :-------------- | :------------------------------------------------------------- | :-------: |
| **POST**   | `/users`        | Cadastra funcionário e endereço (Criptografia GCM automática). |    ❌     |
| **GET**    | `/users`        | Lista funcionários com CPF descriptografado (Visão Admin).     |    🔒     |
| **GET**    | `/users/:id`    | Retorna os detalhes de um funcionário específico.              |    🔒     |
| **PATCH**  | `/users/:id`    | Atualiza os dados de um usuário específico.                    |    🔒     |
| **DELETE** | `/users/:id`    | Deleta o usuário do banco de dados.                            |    🔒     |
| **POST**   | `/auth/login`   | Realiza a autênticação de um usuário já cadastrado.            |    ❌     |
| **POST**   | `/auth/profile` | Retorna os dados do usuário autenticado.                       |    🔒     |
| **GET**    | `/refresh`      | Gera um novo token válido.                                     |    🔒     |
| **POST**   | `/logout`       | Encerra a sessão do usuário.                                   |    🔒     |

---

## 💡 Observações

Este projeto foi desenvolvido com foco em aprendizado avançado de backend, aplicando conceitos reais utilizados em ambientes de produção, principalmente no tratamento de dados sensíveis.
