---
sidebar_position: 4
title: Módulo de Clientes e Privacidade
---

# Módulo de Clientes e Proteção de Dados (LGPD)

O módulo de clientes gerencia os dados cadastrais dos proprietários dos veículos atendidos. Devido à natureza sensível das informações tratadas (como CPF, CNPJ, e-mail e telefone), o módulo foi projetado sob os pilares de **Privacy by Design**, implementando criptografia em repouso e rotinas rígidas de anonimização em conformidade com as diretrizes da LGPD.

## Modelo de Relacionamento Local (Contexto ER)

```mermaid
erDiagram
    CUSTOMERS ||--o{ VEHICLES : "possui"

    CUSTOMERS {
        string customer_id PK
        string name
        string email
        string cpfOrCnpjHash UK
    }
    VEHICLES {
        string vehicle_id PK
        string customer_id FK
        string licensePlate UK
    }
```

---

## Diagramas de Sequência do Módulo de Clientes

Para entender a linha do tempo, a troca de mensagens entre as camadas e os gatilhos de segurança/criptografia aplicados aos dados PII dos clientes, os fluxos abaixo detalham os cenários de **Criação com Blindagem de Dados** e de **Deleção por Anonimização (Soft Delete)**.

### 1. Fluxo de Criação de Cliente (`POST /customers`)

Este diagrama ilustra o pipeline de validação de duplicidade performática usando o hash cego (SHA-256) e a persistência do dado encriptado (AES-GCM).

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as CustomersController
    participant Svc as CustomersService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: POST /customers (Payload com CPF em texto puro)
    Note over Ctrl: class-validator sanitiza strings<br/>e valida formato do CPF
    Ctrl->>Svc: create(createCustomerDto)

    activate Svc
    Note over Svc: Executa generateHash() [SHA-256 para busca rápida]

    Svc->>DB: customer.findFirst (Busca por email OU cpfOrCnpjHash)
    alt Cliente já Cadastrado
        DB-->>Svc: Retorna registro existente
        Svc-->>Cliente: throw ConflictException (409)
    else Cliente Único
        DB-->>Svc: Retorna nulo (Livre para cadastro)
        Note over Svc: Executa dataEncryption() [Criptografa o CPF bruto]
        Svc->>DB: customer.create (Insere dados higienizados)
        DB-->>Svc: Retorna Entidade salva no banco
        Svc-->>Ctrl: Retorna objeto bruto do banco
        deactivate Svc

        Note over Ctrl: Instancia new Customer(customer)<br/>(Descriptografa e aplica máscara no CPF)
        Ctrl-->>Cliente: Status 201 Created (JSON LGPD-Ready)
    end
```

### 2. Fluxo de Atualização Cadastral (`PATCH /customers/:id`)

Este diagrama demonstra a alteração parcial de metadados do cliente e o comportamento de reidratação da camada de saída para garantir a entrega dos dados pessoais mascarados.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as CustomersController
    participant Svc as CustomersService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: PATCH /customers/:id (Payload com dados parciais)
    Note over Ctrl: AccessTokenGuard valida sessão do funcionário
    Ctrl->>Svc: update(id, updateCustomerDto)

    activate Svc
    Svc->>DB: customer.findUnique (Verifica se cliente existe)
    alt Cliente não encontrado
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Cliente localizado
        DB-->>Svc: Retorna registro atual

        Svc->>DB: customer.update (Persiste modificações parciais)
        DB-->>Svc: Retorna objeto atualizado com CPF encriptado
        Svc-->>Ctrl: Retorna entidade atualizada do banco
        deactivate Svc

        Note over Ctrl: Instancia new Customer(customer)<br/>(Descriptografa CPF em memória e aplica máscara)
        Ctrl-->>Cliente: Status 200 OK (JSON Atualizado e Sanitizado)
    end
```

### 3. Fluxo de Remoção por Ofuscação e Descaracterização (`DELETE /customers/:id`)

Este fluxo detalha a rotina de anonimização (Soft Delete reativo), onde os dados sensíveis são substituídos por placeholders genéricos e as chaves únicas recebem o sufixo aleatório para liberar o reaproveitamento do CPF e e-mail no sistema.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as CustomersController
    participant Svc as CustomersService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: DELETE /customers/:id
    Note over Ctrl: AccessTokenGuard valida sessão do funcionário
    Ctrl->>Svc: remove(id)

    activate Svc
    Svc->>DB: customer.findUnique (Verifica Existência do cliente)
    alt Cliente não encontrado
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Cliente Localizado
        DB-->>Svc: Retorna registro atual do cliente

        Note over Svc: Computa sufixo único anon-id<br/>(Ex: anon-a8f4c2b1)
        Note over Svc: Muta campos PII para genéricos:<br/>name: "Cliente"<br/>lastName: "Anonimizado"<br/>email: "anon-id@auto-bots.internal"<br/>isActive: false, deletedAt: New Date

        Svc->>DB: customer.update (Persiste mutação de descaracterização)
        Note over DB: Libera as constraints @unique originais<br/>para novos cadastros na plataforma
        DB-->>Svc: Confirmação de persistência

        Svc-->>Ctrl: Retorna mensagem de sucesso de descaracterização
        deactivate Svc

        Ctrl-->>Cliente: Status 200 OK { message: "Cliente anonimizado com sucesso." }
    end
```

---

## Arquitetura de Persistência de Dados Sensíveis

Para garantir a máxima segurança dos dados de identificação pessoal (PII) sem comprometer a performance de indexação do banco de dados, o sistema adota uma abordagem híbrida de criptografia e hashing:

```mermaid
flowchart TD
    %% Entrada do Fluxo
    Req[1. POST /customers] --> DTO[2. CreateCustomerDto: Validação & Sanitização]
    DTO --> Service[3. Customers Service: create]

    subgraph Mecanismo_Seguranca ["Mecanismo de Segurança Integrado"]
        %% Processo de Hashing
        Service -->|Aplica SHA-256| Hash[4. Gerar Hash Único]
        Hash --> Check{5. findUnique por cpfOrCnpjHash}
        Check -- Sim --> Err[409 ConflictException]

        %% Processo de Criptografia Simétrica
        Check -- Não --> Cipher[6. Criptografia AES-GCM]
        Cipher -->|Gera string cifrada| EncData[cpfOrCnpjEncrypted]
    end

    %% Persistência e Resposta
    EncData --> DB[(Banco de Dados: Tabela CUSTOMERS)]
    DB --> Success[201 Created]

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,Success azulMedio;
    class DTO,Service,Hash,Cipher,EncData,DB,Err azulEscuro;
    class Check decisoes;
    style Mecanismo_Seguranca fill:none,stroke:transparent,color:#fff;
```

---

## Ciclo de Vida e Mascaramento de Saída (Serialization)

Garantindo que dados brutos nunca transitem desnecessariamente, a camada de serialização (`class-transformer`) intercepta a resposta da API na saída do Controller, realizando a descriptografia e a formatação visual (máscaras) em tempo de execução.

- `cpfOrCnpjHash`: Marcado estritamente com @Exclude(), impedindo que o hash de busca vaze em qualquer payload público.
- `cpfOrCnpjEncrypted`: Descriptografado dinamicamente e injetado na propriedade tratada com a máscara padrão brasileira (`000.000.000-00` / `00.000.000/0000-00`).
- `phone`: Sanitizado com regex numérico na entrada de dados e retornado com formatação telefônica nativa (`(DDD) 99999-9999`).

---

## Processo de Exclusão Segura e Pseudonimização (Soft Delete + LGPD)

Quando um cliente solicita a remoção de sua conta ou o vínculo comercial é desfeito, o sistema executa o método `remove()`. Para não quebrar o histórico financeiro ou a integridade de ordens de serviço e veículos órfãos no banco de dados, o registro não é apagado fisicamente, mas passa por um processo irreversível de descaracterização de dados.

```mermaid
flowchart TD
    %% Fluxo de Entrada
    ReqDel[DELETE /customers/:id] --> ServiceDel[Customers Service: remove]

    subgraph Processo_Anonimizacao ["Rotina de Ofuscação de Dados Pessoais"]
        Find[1. Verifica Existência]
        Suffix[2. Computa sufixo único anon-id]
        Mutate[3. Mutação de Campos PII para Valores Genéricos]

        Find --> Suffix
        Suffix --> Mutate
    end

    %% Conexão externa para dentro do bloco
    ServiceDel --> Find

    %% Campos Modificados (Usando aspas para escapar o @)
    Mutate -->|name| F1[Cliente]
    Mutate -->|lastName| F2[Anonimizado]
    Mutate -->|email| F3["anon-id@auto-bots.internal"]
    Mutate -->|phone| F4[00000000000]
    Mutate -->|isActive / deletedAt| F5[false / New Date]

    %% Persistência
    F1 & F2 & F3 & F4 & F5 --> DB_Up[(Atualiza Tabela: CUSTOMERS)]
    DB_Up --> Res[200 OK: Mensagem de Sucesso de Descaracterização]

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;

    class ReqDel,Res azulMedio;
    class ServiceDel,Find,Suffix,Mutate,F1,F2,F3,F4,F5,DB_Up azulEscuro;
    style Processo_Anonimizacao fill:none,stroke:transparent,color:#fff;
```

---

## Especificações Técnicas dos Endpoints

**1. Modelagem de Dados (Prisma Schema)**
A tabela `customers` foi projetada para isolar metadados de auditoria e indexes de segurança, mantendo o relacionamento de um para muitos (`1:N`) com a entidade de veículos:

- **`cpfOrCnpjHash`**: Indexado como `@unique` para validação de duplicidade em tempo de inserção de forma performática.
- **`cpfOrCnpjEncrypted`**: Armazena o dado criptografado em repouso sem indexação para proteção contra SQL Injection e vazamentos físicos.
- **`deletedAt`**: Campo opcional (`DateTime?`) mapeado para suportar a retenção histórica exigida pelo ciclo de vida de auditoria pós-anonimização.

**2. Validação de Payload com `class-validator`**

- **Tratamento de Strings de E-mail:** O DTO força o uso do decorator `@Transform` para aplicar `.toLowerCase().trim()` no campo, evitando que e-mails duplicados em caixas altas burlem validações ou criem dados poluídos.
- **Flexibilidade de Documento::** A validação aceita dinamicamente strings numéricas puras de 11 dígitos (CPF) ou 14 dígitos (CNPJ) por meio de expressões regulares combinadas `(Matches)`.

**3. Parâmetros de Filtros Situacionais**

A rota `GET /customers` implementa o gerenciamento reativo do status cadastral via Query Parameters, permitindo que as requisições segmentem a consulta entre:

- `active`: Traz apenas os clientes operantes na oficina (Comportamento Padrão).
- `inactive`: Retorna os clientes desativados e pseudonimizados.
- `all`: Desativa o filtro reativo no Prisma (`undefined`) e varre a base de dados completa para auditoria técnica.
