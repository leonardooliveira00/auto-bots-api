---
sidebar_position: 5
title: Módulo de Produtos
---

# Módulo de Produtos

O módulo de produtos é responsável pelo ciclo de vida dos itens catalogados na aplicação. O serviço foi arquitetado com foco em resiliência, adotando estratégias de **Soft Delete**, reativação automática e validações de integridade de estoque no momento do cadastro.

## Modelo de Relacionamento Local (Contexto ER)

A tabela `products` centraliza o catálogo de itens comercializáveis ou utilizados como insumos na oficina. Ela atua como a entidade pai para o controle quantitativo de pátio:

- **`sku` (Stock Keeping Unit)**: Indexado como `@unique` para servir como o identificador comercial universal do produto, alimentando a lógica de reativação automática.
- **`price`**: Mapeado como `@db.Decimal(10, 2)` para garantir precisão cirúrgica centesimal em operações aritméticas de venda e avaliação de inventário.
- **`stock` / `movements`**: Estabelece integridade referencial estrita para isolar o saldo atualizado (`Stock`) do livro de registros históricos de movimentações (`StockMovement[]`).

```mermaid
erDiagram
    PRODUCTS ||--|o STOCKS : "possui saldo em"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "gera histórico em"

    PRODUCTS {
        string product_id PK
        string sku "UK"
        string name
        decimal price
        boolean isActive
    }
    STOCKS {
        string stock_id PK
        string product_id FK "UK"
        int quantity
        int maxStock
    }
    STOCK_MOVEMENTS {
        string movement_id PK
        string product_id FK
        string type "IN / OUT"
        int quantity
        string userId
    }
```

---

## Diagramas de Sequência do Módulo de Produtos

Para visualizar a coordenação de mensagens entre o Controller, o Service e o Banco de Dados, os fluxos abaixo detalham a inteligência por trás da **Criação com Reativação Automática de SKU** e as operações de escrita do ciclo de vida dos produtos.

### 1. Fluxo de Criação e Reativação de SKU (`POST /products`)

Este diagrama ilustra o comportamento reativo do sistema ao interceptar cadastros. Ele demonstra o desvio lógico que reativa um produto arquivado via transação síncrona em vez de estourar uma exceção de duplicidade.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as ProductController
    participant Svc as ProductService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: POST /products (Payload com SKU e dados)
    Note over Ctrl: class-validator valida regras de borda
    Ctrl->>Svc: create(createProductDto)

    activate Svc
    Svc->>DB: product.findFirst (Busca por SKU independente do status)

    alt SKU Não Existe (Cadastro Limpo)
        DB-->>Svc: Retorna null
        Svc->>DB: Prisma.$transaction [products + stocks] (Cria produto e inicializa estoque)
        DB-->>Svc: Confirma criação das duas entidades
        Svc-->>Ctrl: Retorna novo produto
        Ctrl-->>Cliente: Status 201 Created

    else SKU Existe e Está ATIVO (Conflito Real)
        DB-->>Svc: Retorna produto ativo
        Svc-->>Cliente: throw ConflictException (409)

    else SKU Existe e Está INATIVO (Soft Delete Bypass)
        DB-->>Svc: Retorna produto inativo
        Svc->>DB: Prisma.$transaction [products + stocks] (Reativa produto & zera/ajusta estoque)
        DB-->>Svc: Confirma mutação de reativação
        Svc-->>Ctrl: Retorna produto reidratado
        deactivate Svc
        Ctrl-->>Cliente: Status 201 Created (Produto Reativado)
    end
```

### 2. Fluxo de Atualização Parcial (`PATCH /products/:id`)

Este fluxo demonstra a modificação reativa de metadados do produto (como preço ou descrição) mantendo a consistência isolada, sem afetar as tabelas de movimentação de pátio de forma direta.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as ProductController
    participant Svc as ProductService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: PATCH /products/:id (Dados parciais)
    Note over Ctrl: AccessTokenGuard valida permissões do usuário
    Ctrl->>Svc: update(id, updateProductDto)

    activate Svc
    Svc->>DB: product.findUnique (Verifica existência e atividade)
    alt Produto não encontrado ou Inativo
        DB-->>Svc: Retorna null / ativo=false
        Svc-->>Cliente: throw NotFoundException (404)
    else Produto Válido
        DB-->>Svc: Retorna dados atuais
        Svc->>DB: product.update (Persiste alterações no banco)
        DB-->>Svc: Retorna produto atualizado
        Svc-->>Ctrl: Retorna payload modificado
        deactivate Svc
        Ctrl-->>Cliente: Status 200 OK (JSON Atualizado)
    end
```

### 3. Fluxo de Arquivamento / Soft Delete (`DELETE /products/:id`)

Este diagrama detalha a exclusão lógica do produto, alterando a flag de atividade e registrando a marca de auditoria cronológica.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as ProductController
    participant Svc as ProductService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: DELETE /products/:id
    Note over Ctrl: AccessTokenGuard intercepta e valida credenciais
    Ctrl->>Svc: remove(id)

    activate Svc
    Svc->>DB: product.findUnique (Valida existência)
    alt Produto inexistente
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Produto localizado
        DB-->>Svc: Retorna produto
        Svc->>DB: product.update (isActive: false, deletedAt: new Date())
        Note over DB: O produto entra em modo oculto nas<br/>listagens sem perder o histórico fiscal
        DB-->>Svc: Confirmação de exclusão lógica
        Svc-->>Ctrl: Retorna mensagem de sucesso
        deactivate Svc
        Ctrl-->>Cliente: Status 200 OK { message: "Produto... removido com sucesso." }
    end
```

---

## Fluxo de Criação e Reativação Automática (SKU)

Para evitar duplicidade de registros únicos e preservar o histórico do banco de dados, o processo de criação adota uma estratégia inteligente de verificação de estado baseado no **SKU**:

```mermaid
flowchart TD
    Req[1. POST /products] --> Service[2. Products Service: create]
    Service --> Check{3. SKU já existe no banco?}

    %% Fluxo se não existe
    Check -- Não --> TxCreate["4. Prisma $transaction"]
    TxCreate -->|Cria Novo| DB_New[(Tabela: products + stocks)]
    DB_New --> Success[201 Created]

    %% Fluxo se existe
    Check -- Sim --> CheckActive{5. O produto está ativo?}
    CheckActive -- Sim --> ErrConflict[409 ConflictException: SKU já cadastrado]

    %% Fluxo inativo (Soft Delete Bypass)
    CheckActive -- Não --> TxUpdate["6. Prisma $transaction"]
    TxUpdate -->|Reativa produto & Atualiza Estoque| DB_Update[(Tabela: products + stocks)]
    DB_Update --> Success

    %% Estilos de Legibilidade
    style Req fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff
    style Service fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff
    style DB_New fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#fff
    style DB_Update fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#fff
    style Success fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff
    style ErrConflict fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff
```

---

## Detalhes da Implementação Técnica

**1. Estratégia de Soft Delete (Remoção Segura)**

A remoção de produtos `(DELETE /products/:id)` não executa um `DELETE` físico na base de dados. Em vez disso, o método `remove` aplica um `Soft Delete`, alterando o sinalizador `isActive` para `false`.

- **Benefício**: Mantém o histórico de movimentações antigas e integridade referencial com outras tabelas, ocultando o produto das listagens padrões.

**2. Validações de Consistência na Entrada**

A API impede estados inconsistentes de estoque diretamente no DTO e na validação interna do serviço:

- O valor de `minStock` não pode ser superior ao `maxStock`.
- A quantity inicial de cadastro não pode ser menor do que o limite definido em `minStock`.

**3. Ciclo de Vida da Manipulação**

Qualquer operação de escrita `(POST, PUT, DELETE)` ou de leitura `(GET)` passa obrigatoriamente pela validação do `Cookie HTTPOnly` e pela verificação de integridade da sessão no **Redis** através do nosso **Guard Unificado**.

---

## Fluxo de Busca com Filtros e Ordenação

- **Filtros e Listagem Otimizada**

O método `findAll` resolve o filtro de status de maneira nativa, aplicando por padrão a exibição apenas de itens ativos, trazendo os dados ordenados cronologicamente de forma decrescente `(orderBy: { createdAt: 'desc' })`.

Para garantir a melhor performance do banco de dados, as regras de busca foram consolidadas diretamente na camada de serviço da API:

- **Filtro por status (Opcional):** Permite listar de forma segmentada apenas os produtos ativos `(active)` ou inativos `(inactive)`.
- **Ordenação por Padrão (orderBy):** Para garantir que os produtos mais novos ou atualizados recentemente apareçam primeiro na interface do usuário, a API aplica nativamente a ordenação decrescente baseada na data de criação`(createdAt: 'desc')`.

O endpoint de listagem `(GET /products)` intercepta parâmetros da URL para entregar uma resposta refinada direto do banco de dados, poupando memória do servidor.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[1. GET /products?status=active] --> Guard[2. Custom Guard Throttler + AccessToken]
    Guard --> Controller[3. Product Controller]

    Controller -->|Repassa Query Params| Service[4. Product Service]
    Service -->|Aplica filtros e ordenação| DB[(Banco de Dados: Tabela PRODUCTS)]

    DB -->|Retorna Produtos Ordenados| Service
    Service --> Controller
    Controller -->|Resposta 200 OK| Client[5. Cliente / Frontend]

    %% 🎨 Estilos para Alta Legibilidade (Padrão Unificado)
    style Req fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff
    style Guard fill:#334155,stroke:#475569,stroke-width:1px,color:#fff
    style Controller fill:#0f172a,stroke:#475569,stroke-width:1px,color:#fff
    style Service fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff
    style DB fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#fff
    style Client fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff
```

---

## Próximos Passos (Backlog Técnico)

- **Controle de Acesso Baseado em Roles (RBAC):** Restringir as rotas de mutação (POST, PUT, DELETE) para que apenas usuários com nível de acesso administrativo possam alterar os produtos, mantendo a rota de listagem (GET) acessível para funcionários comuns.
