---
sidebar_position: 3
title: Módulo de Usuários (Funcionários)
---

# Módulo de Usuários e Segurança de Dados

O módulo de gerenciamento de usuários (funcionários) foi desenhado seguindo rígidos padrões de segurança e privacidade de dados (alinhado a diretrizes como a LGPD), aplicando criptografia ponta a ponta e hashes determinísticos para indexação segura.

## Modelo de Relacionamento Local (Contexto ER)

A entidade `User` possui uma relação de dependência existencial `1:1` com a tabela `Address`. O endereço é tratado como uma sub-entidade aninhada (composição), sendo removido automaticamente via banco de dados caso o usuário seja deletado (`onDelete: Cascade`).

```mermaid
erDiagram
    USERS ||--|| ADDRESSES : "reside em"

    USERS {
        string user_id PK
        string name
        string email UK
        string passwordHash
        string cpfHash UK
    }
    ADDRESSES {
        string address_id PK
        string user_id FK "Cascade"
        string street
        string postalCode
    }
```

---

## Diagramas de Sequência do Módulo de Usuários

Para entender a ordem cronológica de execução e a interação entre as camadas do sistema (Controller, Service, Banco de Dados e Cache), os fluxos abaixo detalham os cenários de **Criação** e de **Leitura com Cache**.

### 1. Fluxo de Registro de Funcionário (`POST /users/register`)

Este fluxo demonstra o cadastro em cascata (usuário + endereço) e a geração de chaves criptográficas (Argon2 para senha e AES-GCM para CPF).

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: POST /users/register (Payload com dados + endereço)
    Note over Ctrl: class-validator sanitiza CPF<br/>e valida força da senha
    Ctrl->>Svc: create(createUserDto)

    activate Svc
    Note over Svc: Executa generatePasswordHash() [Argon2]
    Note over Svc: Executa generateHash() [SHA-256 para busca]
    Note over Svc: Executa dataEncryption() [AES-GCM para proteção PII]

    Svc->>DB: user.findFirst (Verifica se Email ou cpfHash já existem)
    alt Usuário já Cadastrado
        DB-->>Svc: Retorna registro existente
        Svc-->>Cliente: throw ConflictException (409)
    else Usuário Único
        DB-->>Svc: Retorna nulo (Livre para cadastro)
        Svc->>DB: user.create (Insere User aninhado com Address)
        DB-->>Svc: Retorna Entidade criada com Address incluído
        Svc-->>Ctrl: Retorna objeto bruto do banco
        deactivate Svc

        Note over Ctrl: Instancia new User(user)<br/>(Decripta CPF e aplica máscaras)
        Ctrl-->>Cliente: Status 201 Created (JSON Sanitizado)
    end
```

### 2. Fluxo de Consulta de Perfil (`GET /users/:id`)

Este fluxo detalha o comportamento do sistema lidando com a estratégia de Cache-Aside no Redis para otimização de leitura.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant Cache as CacheService (Redis)
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: GET /users/:id (Cookie: access_token)
    Note over Ctrl: AccessTokenGuard valida sessão
    Ctrl->>Svc: findOne(id)

    activate Svc
    Svc->>Cache: getCache("user:id")

    alt Cache Hit (Dado encontrado no Redis)
        Cache-->>Svc: Retorna payload do usuário em cache
        Note over Svc: Pula consulta ao banco de dados
    else Cache Miss (Dado ausente no Redis)
        Cache-->>Svc: Retorna null
        Svc->>DB: user.findUnique (Busca User + Address)

        alt Usuário não existe
            DB-->>Svc: Retorna null
            Svc-->>Cliente: throw NotFoundException (404)
        else Usuário localizado
            DB-->>Svc: Retorna registro do banco
            Svc->>Cache: storeCache("user:id", user)
            Note over Cache: Persiste o perfil no Redis
        end
    end

    Svc-->>Ctrl: Retorna entidade de usuário
    deactivate Svc
    Note over Ctrl: Instancia new User(user)<br/>(Aplica máscaras dinâmicas)
    Ctrl-->>Cliente: Status 200 OK (JSON Sanitizado)
```

### 3. Fluxo de Atualização de Perfil (`PATCH /users/:id`)

Este diagrama demonstra como o sistema atualiza os dados cadastrais (permitindo ou não a alteração do endereço) e limpa a chave de cache do Redis para garantir a consistência das próximas leituras.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant DB as Prisma (Postgres)
    participant Cache as CacheService (Redis)

    Cliente->>Ctrl: PATCH /users/:id (Payload com dados parciais)
    Note over Ctrl: AccessTokenGuard valida sessão
    Ctrl->>Svc: update(id, updateUserDto)

    activate Svc
    Svc->>DB: user.findUnique (Verifica se usuário existe)
    alt Usuário não encontrado
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Usuário localizado
        DB-->>Svc: Retorna registro atual

        Note over Svc: Isola propriedades de address<br/>euserData dinamicamente
        Svc->>DB: user.update (Persiste alterações / atualiza Address se enviado)
        DB-->>Svc: Retorna objeto atualizado com endereço

        Svc->>Cache: clearCache("user:id")
        Note over Cache: Evita Stale Data: Expuga o cache<br/>antigo para forçar re-leitura do DB

        Svc-->>Ctrl: Retorna entidade atualizada
        deactivate Svc

        Note over Ctrl: Instancia new User(user)<br/>(Aplica criptografia/máscaras)
        Ctrl-->>Cliente: Status 200 OK (JSON Atualizado e Sanitizado)
    end
```

### 4. Fluxo de Exclusão Física e Deslogamento (`DELETE /users/:id`)

Este é o fluxo mais crítico de segurança. Ele ilustra o expurgo do usuário do banco, a queda do endereço em cascata e o comando coordenado para limpar o cache de leitura e banir a sessão ativa.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as UsersController
    participant Svc as UsersService
    participant DB as Prisma (Postgres)
    participant Sess as SessionService (Redis)
    participant Cache as CacheService (Redis)

    Cliente->>Ctrl: DELETE /users/:id
    Note over Ctrl: AccessTokenGuard valida permissão
    Ctrl->>Svc: remove(id)

    activate Svc
    Svc->>DB: user.findUnique (Verifica existência)
    alt Usuário inexistente
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Usuário localizado
        DB-->>Svc: Retorna dados do usuário

        Svc->>DB: user.delete (Remove o registro)
        Note over DB: Constraint Cascade acionada:<br/>Tabela ADDRESSES deletada automaticamente
        DB-->>Svc: Confirmação de exclusão

        %% Pipeline de Limpeza de Sessão e Cache
        Svc->>Sess: deleteSession(id)
        Note over Sess: Banimento Imediato:<br/>Derruba os Refresh Tokens ativos

        Svc->>Cache: clearCache("user:id")
        Note over Cache: Limpa rastro de cache de leitura

        Svc-->>Ctrl: Retorna mensagem de sucesso
        deactivate Svc

        Ctrl-->>Cliente: Status 200 OK { message: "Usuário... removido com sucesso." }
    end
```

---

## Ciclo de Vida do Dado Sensível (CPF e Senha)

Abaixo está o fluxo detalhado de como a API intercepta, processa e protege as informações sensíveis desde a requisição de criação (`POST /users`) até o armazenamento no Banco de Dados.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[1. Requisição HTTP de Cadastro] -->|Input: CPF, Senha, Telefone| Controller[NestJS Controller]

    subgraph Hash_Senha ["Hash de Senha"]
        Argon[2. Argon2 Hasher]
        DB_Senha[(Coluna: password_hash)]

        Argon -->|Senha Hasheada| DB_Senha
    end

    subgraph Protecao_CPF ["Proteção de Dados do CPF"]
        Normalizer[3. Sanitização: Remove Pontos/Traços]
        HMAC[4. HMAC SHA-256]
        DB_Index[(Coluna: cpf_hash)]
        AES[5. Criptografia AES-256-GCM]
        DB_Cpf[(Coluna: cpf_encrypted)]

        Normalizer -->|12345678900| HMAC
        HMAC -->|Hash Cego/Determinístico| DB_Index

        Normalizer -->|12345678900| AES
        AES -->|Formato iv:tag:ciphertext| DB_Cpf
    end

    %% Ligações explícitas vindas do Controller
    Controller -->|Senha em Texto Puro| Argon
    Controller -->|CPF Puro: 123.456.789-00| Normalizer

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;

    class Req,DB_Senha,DB_Index,DB_Cpf azulMedio;
    class Controller,Argon,Normalizer,HMAC,AES azulEscuro;

    style Hash_Senha fill:none,stroke:transparent,color:#fff;
    style Protecao_CPF fill:none,stroke:transparent,color:#fff;
```

## Engenharia de Segurança Aplicada

**1. Indexação Segura com Hash Determinístico (CPF)**

Para permitir que o sistema busque um usuário pelo CPF (evitando cadastros duplicados) sem que precisemos descriptografar toda a tabela ou salvar o CPF em texto limpo, aplicamos o conceito de Blind Index:

- O CPF é limpo e passado por uma função HMAC-SHA-256.
- O resultado é um hash idêntico para o mesmo CPF, permitindo buscas exatas (WHERE cpf_hash = :hash).

**2. Criptografia Autenticada (AES-256-GCM)**

O dado real do CPF é criptografado usando AES-256-GCM, que além da confidencialidade, garante a integridade do dado (garante que ele não foi alterado no banco).

- O valor é salvo no formato padronizado iv:authTag:cipher.

**3. Derivação de Chave com Argon2**

A senha do funcionário nunca toca o banco em texto puro. Utilizamos o algoritmo Argon2, vencedor da Password Hashing Competition, oferecendo a maior resistência atual contra ataques de força bruta e hardware dedicado (ASICs/GPUs).

**4. Transformação e Mascaramento na Saída (Leitura)**

Quando o sistema lista ou retorna os dados de um funcionário (GET /users/:id), a API descriptografa os dados necessários internamente, mas aplica máscaras de formatação antes de enviar a resposta ao cliente:

| Campo original | Tratamento na API (class-transformer / Utils) | Tratamento na API (class-transformer / Utils) |
| :------------- | :-------------------------------------------- | :-------------------------------------------- |
| CPF            | Descriptografa e ofusca os dígitos centrais.  | `123.***.***-00`                              |
| Telefone       | Aplica máscara regional padronizada.          | `(11) 91234-5678`                             |
| CEP            | Padroniza o formato de localização.           | `01001-000`                                   |

---

## Fluxo de Leitura Otimizada com Cache Service

Para evitar requisições desnecessárias ao banco de dados Postgres durante as checagens de perfil, o método `findOne` intercepta a busca utilizando uma estratégia de cache reativo no Redis.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[GET /users/:id] --> Service[Users Service: findOne]

    subgraph Camada_Performance ["Gerenciamento de Cache (Redis)"]
        Service --> CheckCache{1. Dado existe no Redis?}

        %% Hit do Cache
        CheckCache -- Sim (Hit) --> ReturnCache[2. Retorna Dado Instantaneamente]

        %% Miss do Cache
        CheckCache -- Não (Miss) --> DB[(3. Consulta Prisma: Tabela USERS + ADDRESS)]
        DB --> SetCache[4. Salva Cópia no Redis: user:id]
    end

    ReturnCache --> Res[200 OK: Payload do Usuário]
    SetCache --> Res

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,Res,DB azulMedio;
    class Service,ReturnCache,SetCache azulEscuro;
    class CheckCache decisoes;
    style Camada_Performance fill:none,stroke:transparent,color:#fff;
```

---

## Ciclo de Vida e Consistência de Dados Mutáveis

Para impedir que a camada de cache retorne perfis desatualizados após alterações no sistema, o serviço de usuários implementa a invalidação de chaves por barramento de evento lógico nos métodos de escrita.

**1. Fluxo de Criação em Cascata (`POST /users/register`)**

O cadastro é público e aninha a criação do endereço na mesma query transacional do Prisma (`address: { create: { ... } }`). O CPF passa por limpeza de caracteres não numéricos (`\D`) via class-transformer antes de ser persistido.

**2. Fluxo de Atualização (`PATCH /users/:id`)**

- O usuário pode alterar dados cadastrais sem a obrigatoriedade de enviar propriedades de endereço.
- Assim que a mutação é confirmada no banco de dados, o comando `await this.cacheService.clearCache('user:id')` é disparado, eliminando o lixo de memória do Redis e forçando o próximo `GET` a ler o dado atualizado diretamente do banco.

**3. Fluxo de Exclusão Física (`DELETE /users/:id`)**

Ocorre o expurgo completo do registro. Para garantir a segurança interna do ecossistema, o sistema realiza uma limpeza em três etapas síncronas:

1. Deleta o registro no banco (o endereço cai junto por causa da constraint `Cascade`).
2. Dispara `this.sessionService.deleteSession(id)` para derrubar os Refresh Tokens ativos do Redis e deslogar o usuário de qualquer dispositivo.
3. Limpa o cache de leitura executando `this.cacheService.clearCache('user:id')`.

---

## Especificações Técnicas dos Endpoints

**1. Robustez na Validação de Entrada (CreateUserDto)**

- `@IsStrongPassword`: Aplica uma política estrita de segurança exigindo no mínimo 8 caracteres com obrigatoriedade de conter pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.
- `@ValidateNested`: Aciona a validação profunda do NestJS para varrer as propriedades de endereço contidas dentro do `CreateAddressDto`, garantindo que formatos inválidos de CEP interrompam a requisição na borda da API.

**2. Ocultação Dinâmica na Camada de Saída**

A entidade `User` atua como um escudo de privacidade de dados. Os decorators `@Exclude()` garantem que chaves de segurança críticas nunca cheguem à camada de transporte de rede:

- `passwordHash` (Senha criptografada do usuário) -> Bloqueado
- `cpfHash` (Hash SHA-256 usado para buscas) -> Bloqueado
- `cpfEncrypted` (String AES-GCM bruta em repouso) -> Bloqueado

Na saída, o getter cpf captura a string encriptada, descriptografa-a em memória e aplica a máscara tradicional brasileira (000.000.000-00) dinamicamente através do class-transformer.
