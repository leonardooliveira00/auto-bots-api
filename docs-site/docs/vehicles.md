---
sidebar_position: 6
title: Módulo de Veículos e Frotas
---

# Módulo de Veículos e Gestão de Frota

O módulo de veículos gerencia a frota de automóveis ou motocicletas atreladas aos clientes da oficina. Ele estabelece uma relação estrita de dependência com a entidade de Clientes e implementa regras de negócio automotivas rigorosas, como validação internacional de Chassis (VIN), formatação do padrão Mercosul e reciclagem de restrições exclusivas (`@unique`) em cenários de exclusão lógica.

## Modelo de Relacionamento Local (Contexto ER)

O ciclo de vida de um veículo depende obrigatoriamente da existência de um proprietário ativo no banco de dados, configurando uma relação de integridade referencial `1:N` com restrição de delegação em cascata desativada (`onDelete: Restrict`).

```mermaid
erDiagram
    CUSTOMERS ||--o{ VEHICLES : "proprietário de"

    VEHICLES {
        string vehicle_id PK
        string customer_id FK
        string brand
        string model
        string plate UK
        string vin UK
    }
    CUSTOMERS {
        string customer_id PK
        boolean is_active
    }
```

---

## Diagramas de Sequência do Módulo de Veículos

Para compreender o fluxo de mensagens entre o Controller, o Service e as tabelas do banco de dados, bem como as checagens de vínculo com proprietários, os diagramas abaixo detalham o ciclo de vida dos veículos.

### 1. Fluxo de Cadastro de Veículo (`POST /vehicles`)

Este diagrama ilustra o pipeline de validação de propriedade, checagem de duplicidade de placa no sistema e o vínculo relacional com a tabela de clientes.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as VehiclesController
    participant Svc as VehiclesService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: POST /vehicles (Payload: placa, modelo, marca, customerId)
    Note over Ctrl: UseAuth() valida token e rate limit.<br/>class-validator normaliza a Placa.
    Ctrl->>Svc: create(createVehicleDto)

    activate Svc
    Svc->>DB: customer.findUnique (Verifica se o proprietário existe)
    alt Cliente Não Localizado
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404: Cliente não encontrado)
    else Cliente Válido
        DB-->>Svc: Retorna registro do cliente

        Svc->>DB: vehicle.findUnique (Verifica se a placa já está registrada)
        alt Placa já Cadastrada
            DB-->>Svc: Retorna veículo existente
            Svc-->>Cliente: throw ConflictException (409: Placa já vinculada)
        else Placa Livre
            DB-->>Svc: Retorna null

            Svc->>DB: vehicle.create (Persiste o veículo com a FK do cliente)
            DB-->>Svc: Confirma criação e retorna a entidade
            Svc-->>Ctrl: Retorna payload do veículo criado
            deactivate Svc

            Ctrl-->>Cliente: Status 201 Created (JSON do veículo com proprietário)
        end
    end
```

### 2. Fluxo de Atualização Parcial de Metadados (`PATCH /vehicles/:id`)

Demonstra o comportamento do sistema ao atualizar informações dinâmicas do veículo (como quilometragem ou cor) sem permitir a alteração acidental de chaves de integridade como a placa.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as VehiclesController
    participant Svc as VehiclesService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: PATCH /vehicles/:id (Payload de alteração parcial)
    Note over Ctrl: AccessTokenGuard valida privilégios de acesso
    Ctrl->>Svc: update(id, updateVehicleDto)

    activate Svc
    Svc->>DB: vehicle.findUnique (Valida existência do veículo)
    alt Veículo Não Encontrado
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Veículo Localizado
        DB-->>Svc: Retorna dados atuais

        Svc->>DB: vehicle.update (Persiste modificações de pátio)
        DB-->>Svc: Retorna veículo atualizado
        Svc-->>Ctrl: Retorna entidade modificada
        deactivate Svc

        Ctrl-->>Cliente: Status 200 OK (JSON Sincronizado)
    end
```

### 3. Fluxo de Remoção e Desvinculação (`DELETE /vehicles/:id`)

Detallha o processo de expurgo ou arquivamento de um veículo do pátio operacional, garantindo a proteção contra quebras de restrição de chaves estrangeiras ativas.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Ctrl as VehiclesController
    participant Svc as VehiclesService
    participant DB as Prisma (Postgres)

    Cliente->>Ctrl: DELETE /vehicles/:id
    Note over Ctrl: Valida permissões do usuário interno (Mecânico/Admn)
    Ctrl->>Svc: remove(id)

    activate Svc
    Svc->>DB: vehicle.findUnique (Checa existência na base)
    alt Veículo Inexistente
        DB-->>Svc: Retorna null
        Svc-->>Cliente: throw NotFoundException (404)
    else Veículo Localizado
        DB-->>Svc: Retorna dados do veículo

        Svc->>DB: vehicle.delete (Executa remoção física ou lógica)
        Note over DB: Verifica integridade com tabelas dependentes<br/>(ex: Ordens de Serviço históricas)
        DB-->>Svc: Confirma exclusão do registro
        Svc-->>Ctrl: Retorna mensagem de sucesso
        deactivate Svc

        Ctrl-->>Cliente: Status 200 OK { message: "Veículo removido com sucesso do sistema." }
    end
```

---

## Regras de Negócio e Validação de Fluxo (Cadastro)

O processo de criação intercepta o payload, higieniza as entradas forçando letras maiúsculas em dados de identificação e valida a integridade do cliente antes de registrar o ativo.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[1. POST /vehicles] --> DTO[2. CreateVehicleDto: ToUpperCase Placa/Chassi]
    DTO --> Service[3. Vehicles Service: create]

    subgraph Valida_Integridade ["Validação de Integridade e Regras Automotivas"]
        Service --> CheckUser{4. Cliente existe e está ativo?}
        CheckUser -- Não --> ErrUser[404 NotFoundException]

        CheckUser -- Sim --> CheckVehicle{5. Placa ou Chassi já cadastrado?}
        CheckVehicle -- Sim --> ErrVeh[409 ConflictException]
    end

    %% Persistência
    CheckVehicle -- Não --> DB[(Prisma: Tabela VEHICLES)]
    DB --> Success[201 Created]

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA (Padronizada)
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef deeservico fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,Success azulMedio;
    class DTO,Service,ErrUser,ErrVeh,DB azulEscuro;
    class CheckUser,CheckVehicle decisoes;

    %% Remove a borda e o fundo do subgraph
    style Valida_Integridade fill:none,stroke:transparent,color:#fff;

```

---

## Solução Técnica para Habilitação de Re-cadastro (Unique Soft Delete Suffix)

Um dos maiores desafios de arquitetura ao adotar Soft Delete em colunas com restrições exclusivas (`@unique`) no banco de dados (como `plate` e `vin`) é que um item inativado impede que o mesmo dado seja cadastrado novamente no futuro.

Para solucionar isso sem perder o histórico do pátio, o método `remove()` executa uma mutação de liberação de chave concatenando um sufixo hexadecimal imutável gerado a partir do ID da própria entidade:

**Chave Original:** BRA2E19
**Chave Removida:** BRA2E19del-a8f4c2b1

Isso garante que a string original `BRA2E19` volte a ficar disponível imediatamente no banco de dados para novos cadastros de forma limpa, enquanto o registro antigo preserva a rastreabilidade histórica.

---

## Especificações Técnicas dos Endpoints

**1. Rigidez Normativa no DTO (class-validator):**

- **Padrão de Placas Nacional/Mercosul:** Validada através da expressão regular `/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i`, aceitando de forma reativa os dois modelos vigentes de trânsito no Brasil.
- **Validação ISO 3779 (Chassi/VIN):** A regex `/^[A-HJ-NPR-Z0-9]{17}$/i` barra de forma nativa caracteres ilegais em registros de chassis no padrão internacional (letras **I**, **O** e **Q** são proibidas para evitar adulterações por similaridade visual com os numerais **1** e **0**).

## 2. Ciclo de Vida da Resposta (Serialization)

A propriedade `customerId` é escondida no payload de saída com o decorator `@Exclude()`. Em contrapartida, caso a consulta utilize relacionamentos `(include)`, a entidade aninha de forma automática o objeto completo mapeado de `Customer`, realizando o parse limpo na resposta do JSON.
