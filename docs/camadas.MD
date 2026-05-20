# 🕹️ Detalhamento Técnico: Controllers e Services

Este documento especifica os padrões de implementação, responsabilidades e o fluxo de controle adotado nas camadas de **Controllers** (Apresentação) e **Services** (Regras de Negócio) em todos os módulos do ecossistema **Auto-Bots**.

---

## 🎮 1. Camada de Controllers (Porta de Entrada)

Os Controllers são responsáveis exclusivamente por gerenciar o ciclo de vida das requisições HTTP, validar dados de entrada e formatar as respostas de saída. **Nenhuma lógica de negócio reside nesta camada.**

### 🛠️ Padrões de Implementação:

- **Validação Estrita com DTOs:** Todas as rotas de entrada de dados (`POST`, `PUT`, `PATCH`) utilizam objetos de transferência de dados (DTOs) blindados com decorators do `class-validator` (ex: `@IsString()`, `@IsEmail()`, `@IsMobilePhone()`). O NestJS intercepta e rejeita automaticamente payloads malformados com erro `400 Bad Request`.
- **Guards de Segurança Intercalados:** As rotas que exigem autenticação são decoradas com o `JwtAuthGuard` e o `SessionGuard` combinados em um função chamada UseAuth(), interceptando o fluxo para validar a sessão ativa no Redis antes de entregar a requisição ao método do controller.
- **Interceptores de Resposta:** Utilização de interceptores globais ou locais (`ClassSerializerInterceptor`) para garantir que as entidades retornadas passem pela esteira de mascaramento de dados (Data Masking) do `class-transformer` antes de virarem JSON na tela do cliente.

---

## 🧠 2. Camada de Services (O Coração da Aplicação)

Os Services centralizam toda a inteligência e as regras de negócio do Auto-Bots. Eles são puramente orientados a objetos, tipados, e completamente isolados do protocolo HTTP.

### 🛠️ Padrões de Implementação:

- **Injeção de Dependências Dinâmica:** Os services utilizam o container de IoC (Inversão de Controle) do NestJS para injetar os repositórios do Prisma, o cliente de Cache do Redis e os utilitários de criptografia.
- **Orquestração da Segurança de Dados:** Sempre que um Service de domínio (como o `UsersService`) precisa persistir ou buscar um dado sensível, ele dita a ordem das operações:
  1. Solicita ao módulo `utils` o hash SHA-256 e a criptografia AES-256-GCM do documento.
  2. Aciona o `Prisma Repository` enviando os payloads já tratados de forma segura.
- **Gerenciamento de Estado e Erros de Negócio:** É aqui que ocorrem as checagens de consistência (ex: verificar se um e-mail já está cadastrado). Caso uma regra seja violada, o service lança uma exceção nativa do NestJS (ex: `ConflictException`, `NotFoundException`), que é capturada e tratada de forma limpa pelo framework.
- **Estratégias de Cache no Redis:** Os serviços interagem com a camada de cache para salvar resultados de leituras pesadas e invalidar chaves de registros modificados de forma síncrona ou assíncrona, mantendo o banco PostgreSQL aliviado.
