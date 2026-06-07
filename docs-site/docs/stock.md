---
sidebar_position: 6
title: Módulo de Estoque e Movimentações
---

# Módulo de Estoque e Rastreabilidade (Stock)

O controle de estoque é totalmente aninhado e dependente da existência de um produto. Além do saldo atual, o sistema implementa um modelo stateful de **Movimentações de Estoque (Auditoria)**, registrando cada entrada e saída com o respectivo operador responsável.

## Modelo de Dados e Relacionamento (ERD)

Abaixo está o diagrama físico baseado no nosso schema do banco de dados, detalhando a relação `1:1` estrita entre Produto e Estoque, e a relação `1:N` para o histórico de movimentações.

```mermaid
erDiagram
    products {
        uuid product_id PK
        string sku UK
        string name
        text description
        decimal price
        boolean isActive
        datetime created_at
        datetime updated_at
    }
    stocks {
        uuid stock_id PK
        uuid product_id FK "UK / Cascade Delete"
        int quantity
        int min_stock
        int max_stock
        datetime created_at
        datetime updated_at
    }
    stock_movements {
        uuid movement_id PK
        uuid product_id FK "Cascade Delete"
        int quantity
        enum type "IN | OUT"
        string reason
        uuid user_id FK
        datetime created_at
    }

    products ||--|| stocks : "possui (1:1)"
    products ||--o{ stock_movements : "origina (1:N)"
```

---

## Diagramas de Sequência do Módulo de Estoque

Para entender o comportamento cronológico, a validação de regras de negócio em pátio e a garantia de atomicidade nas operações de inventário, os fluxos abaixo detalham o ciclo de execução da camada de estoque.

### 1. Fluxo de Movimentação de Estoque e Transação ACID (`POST /stock/movements`)

Este diagrama detalha a linha do tempo de uma movimentação, evidenciando as barreiras de validação (capacidade e saldo) e a execução isolada dentro da transação do banco de dados.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as StockController
    participant Svc as StockService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: POST /stock/movements (Payload: productId, type, quantity)
    Note over Ctrl: UseAuth() intercepta requisição:<br/>ThrottlerGuard e AccessTokenGuard validam acesso
    Ctrl->>Svc: createMovement(userId, createMovementDto)

    activate Svc
    Note over Svc: Valida se quantity > 0
    alt Quantidade Inválida (<= 0)
        Svc-->>Cliente: throw BadRequestException (400)
    end

    Svc->>DB: stock.findUnique (Busca saldo atual e maxStock do produto)
    DB-->>Svc: Retorna registro de estoque

    Note over Svc: Avalia propriedade "type" (IN / OUT)

    alt Tipo de Movimentação = OUT (Saída)
        Note over Svc: Valida se saldo atual >= quantidade solicitada
        alt Saldo Insuficiente
            Svc-->>Cliente: throw BadRequestException (400: Saldo Insuficiente)
        end
    else Tipo de Movimentação = IN (Entrada)
        Note over Svc: Valida se (saldo + quantidade) > maxStock (se maxStock > 0)
        alt Capacidade Máxima Excedida
            Svc-->>Cliente: throw BadRequestException (400: Excede Capacidade Máxima)
        end
    end

    %% Início da Transação ACID
    Note over Svc: Payload Válido -> Inicia Prisma $transaction
    Svc->>DB: [Transação] 1. stock.update (Incrementa ou decrementa a quantidade)
    Svc->>DB: [Transação] 2. stockMovement.create (Insere log imutável com userId)
    DB-->>Svc: Confirma persistência atômica (Commit)

    Svc-->>Ctrl: Retorna confirmação e saldo atualizado
    deactivate Svc

    Ctrl-->>Cliente: Status 201 Created (JSON com recibo da movimentação)
```

---

## Consistência de Operação e Transações ACID

Toda movimentação do estoque dispara um fluxo transacional fechado. Se a atualização do saldo consolidado falhar ou quebrar uma regra de negócio, o log de auditoria é revertido automaticamente pelo banco.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[POST /stock/movements] --> Service[Stock Service: createMovement]

    subgraph Prisma_Tx ["Transação de Banco (ACID)"]
        direction TB
        ValidaQuantity{Quantidade > 0?}
        ValidaQuantity -- Não --> ErrBad[400 BadRequest]
        ValidaQuantity -- Sim --> GetStock[Busca saldo atual]

        GetStock --> CheckType{Tipo de Movimentação?}

        %% Fluxo OUT
        CheckType -- OUT --> CheckOut{Saldo Disponível >= Solicitado?}
        CheckOut -- Não --> ErrOut[400 Saldo Insuficiente]
        CheckOut -- Sim --> ExecDecrement[Decrementa quantidade no banco]

        %% Fluxo IN
        CheckType -- IN --> CheckIn{Saldo + Nova Qtd > Capacidade Máxima?}
        CheckIn -- Sim E maxStock > 0 --> ErrIn[400 Excede Capacidade Máxima]
        CheckIn -- Não --> ExecIncrement[Incrementa quantidade no banco]

        %% Persistência do Log
        ExecDecrement --> CreateLog[Gera registro imutável em stock_movements]
        ExecIncrement --> CreateLog
    end

    %% Conexão saindo do bloco transacional para o sucesso externo
    Prisma_Tx --> Success[201 Created + Resposta com saldo atualizado]

    classDef blocosPrincipais fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef nosSecundarios fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef deeservico fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;

    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,Success nosSecundarios;
    class Service,ErrBad,GetStock,ErrOut,ExecDecrement,ErrIn,ExecIncrement,CreateLog blocosPrincipais;
    class ValidaQuantity,CheckType,CheckOut,CheckIn decisoes;

    style Prisma_Tx fill:none,stroke:transparent,color:#fff;
```

---

## Fluxo de Movimentação de Estoque (Rastreabilidade)

Toda vez que o estoque de um produto sofre uma alteração (IN para entrada ou OUT para saída), o sistema realiza a mutação do saldo atual na tabela stocks e gera um log imutável na tabela stock_movements.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[1. Requisição Ex: POST /stock/movements] --> Guard[2. Custom Guard]
    Guard -->|Injeta userId na Request| Controller[3. Stock Controller]
    Controller --> Service[4. Stock Service]

    subgraph Transacao_ACID ["Transação de Banco (ACID)"]
        DB_Stock[(Tabela: stocks)]
        DB_Mov[(Tabela: stock_movements)]
    end

    %% Ligações explícitas com o serviço
    Service -->|1. Atualiza Saldo| DB_Stock
    Service -->|2. Insere Log com user_id| DB_Mov

    DB_Mov -->|Sucesso| Service
    Service --> Controller
    Controller -->|201 Created| Client[5. Cliente / Frontend]

    %% 🎨 classes de estilo baseadas na sua imagem (Azul Petróleo / Escuro)
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;

    %% Aplicando as classes nos nós para padronização total
    class Req,Guard,Client,DB_Stock,DB_Mov azulMedio;
    class Controller,Service azulEscuro;

    %% 🛠️ Remove o preenchimento E a borda do subgraph (Totalmente invisível)
    style Transacao_ACID fill:none,stroke:transparent,color:#fff;
```

---

## Regras de Integridade e Auditoria

**1. Integridade Referencial em Cascata (onDelete: Cascade):**

As tabelas stocks e stock_movements estão umbilicalmente ligadas à tabela products. Caso um produto seja removido do sistema, o banco de dados executa a deleção em cascata automaticamente para:

- A ficha de estoque correspondente.
- Todo o histórico de movimentações daquele produto específico, evitando registros órfãos.

**2. Regras de Negócio de Armazenamento:**

- min_stock e max_stock: Campos dedicados a apoiar regras de negócio futuras para geração de alertas ou relatórios de compras/reposição automatizada.
- **Rastreabilidade por user_id:** O campo userId (mapeado como user_id no banco) garante a auditoria do sistema, permitindo identificar com precisão qual funcionário realizou a operação de entrada ou saída do estoque.
