---
sidebar_position: 4
title: Fluxo de Autenticação
---

# Módulo de Autenticação e Gestão de Sessões

O módulo de autenticação é o pilar de segurança perimetral do sistema. Ele é responsável pelo controle de acessos através de tokens JWT assíncronos e simétricos, validação de segurança via criptografia reativa no Argon2, prevenção de abusos de infraestrutura via Rate Limiting e gerenciamento de sessões com ciclo de rotação de chaves (_Refresh Token Rotation_) persistidas em Redis.

## Diagrama de Sequência

Abaixo está detalhado o ciclo de vida desde o login por e-mail e senha até a validação das requisições subsequentes:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant API as NestJS API Gateway
    participant DB as Banco de Dados
    participant Redis as Redis Cache/Sessão

    Note over Cliente, API: 1. Processo de Login
    Cliente->>+API: POST /auth/login { email, senha }
    API->>+DB: Busca usuário por e-mail
    DB-->>-API: Retorna dados do usuário (hash da senha)
    API->>API: Valida e compara a senha

    ALT Credenciais Válidas
        API->>API: Gera Access Token e Refresh Token
        API->>+Redis: Registra a sessão / Refresh Token (Whitelist)
        Redis-->>-API: Confirma Armazenamento
        API-->>Cliente: Retorna Tokens (Bearer + Cookie Seguro)
    ELSE Credenciais Inválidas
        API-->>-Cliente: Retorna 401 Unauthorized
    end

    Note over Cliente, API: 2. Requisições Autenticadas (Guards)
    Cliente->>+API: Requisição HTTP com Access Token
    API->>+Redis: Verifica se o token/sessão está ativo
    Redis-->>-API: Retorna status da sessão

    ALT Sessão Válida e Ativa
        API->>API: Decodifica Token e injeta usuário na Request
        API->>DB: Executa lógica de negócio / Consulta dados
        DB-->>API: Retorna dados
        API-->>Cliente: Retorna Resposta (200 OK)
    ELSE Sessão Expirada ou Revogada
        API-->>-Cliente: Retorna 401 Unauthorized (Gera fluxo de Refresh)
    end
```

---

## Arquitetura de Proteção de Rotas e Guards

Para garantir que operações restritas fiquem inacessíveis a usuários maliciosos, a aplicação implementa uma composição de interceptadores globais encapsulados sob o decorator `UseAuth()`.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[Requisição HTTP para Rota Protegida] --> Throttler{1. ThrottlerGuard: Limite de Requisições?}

    Throttler -- Excedido (429) --> ErrRate[429 TooManyRequestsException]
    Throttler -- Permitido --> AccessGuard[2. AccessTokenGuard]

    subgraph Pipeline_Token ["Validação Estrita de Access Token"]
        AccessGuard --> GetCookie[Busca cookie assinado: access_token]
        GetCookie --> VerifyJWT{3. Assinatura do JWT é válida?}

        VerifyJWT -- Não (Invalido/Expirado) --> ErrAuth[401 UnauthorizedException]

        VerifyJWT -- Sim --> CheckRedis{4. Sessão ativa no Redis?}
        CheckRedis -- Não (Revogada) --> ErrAuth
        CheckRedis -- Sim (Ativa) --> InjectRequest[Injeta payload do usuário na Request]
    end

    InjectRequest --> Route[Executa lógica do Controller / Service]

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,ErrRate,ErrAuth,Route azulMedio;
    class AccessGuard,GetCookie,InjectRequest azulEscuro;
    class Throttler,VerifyJWT,CheckRedis decisoes;
    style Pipeline_Token fill:none,stroke:transparent,color:#fff;
```

---

## Fluxo de Renovação Segura de Sessão (Refresh Token Rotation)

A rotação de tokens mitiga o roubo de credenciais persistentes. Quando o cliente solicita um novo token de acesso através da rota `/auth/refresh`, o sistema valida o hash armazenado e invalida o par anterior.

```mermaid
flowchart TD
    %% Nós de Entrada e Saída
    Req[POST /auth/refresh] --> Guard[RefreshTokenGuard: Valida Assinatura do Cookie]
    Guard --> Service[AuthService: refreshTokens]

    subgraph Mecanismo_Rotacao ["Segurança de Rotação Baseada em Hash no Redis"]
        Service --> GetSession[Busca hash do refresh_token antigo no Redis]
        GetSession --> Match{Hash enviado confere com o guardado?}

        %% Quebra de Confiança (Detecção de Fraude)
        Match -- Não --> ClearAll[Apaga Sessão do Redis Imediatamente]
        ClearAll --> ErrBreach[401 Unauthorized: Sessão encerrada por segurança]

        %% Sucesso na Rotação
        Match -- Sim --> GenTokens[Gera novo Access Token de 15m e Refresh Token de 7d]
        GenTokens --> HashToken[Computa hash SHA-256 do novo Refresh Token]
        HashToken --> SaveRedis[Sobrescreve chave no Redis com novo hash]
    end

    SaveRedis --> SetCookies[Injeta novos cookies HTTPOnly e assinados na resposta]
    SetCookies --> Success[200 OK: Cookies atualizados]

    %% 🎨 ESTILIZAÇÃO WIREFRAME MINIMALISTA
    classDef azulMedio fill:#1e293b,stroke:#475569,stroke-width:1px,color:#fff;
    classDef azulEscuro fill:#0f172a,stroke:#334155,stroke-width:1px,color:#fff;
    classDef decisoes fill:#141b24,stroke:#475569,stroke-width:1px,color:#fff;

    class Req,ErrBreach,Success azulMedio;
    class Guard,Service,GetSession,ClearAll,GenTokens,HashToken,SaveRedis,SetCookies azulEscuro;
    class Match decisoes;
    style Mecanismo_Rotacao fill:none,stroke:transparent,color:#fff;
```

---

## Especificações Técnicas e Diretrizes de Segurança

**1. Cookies HTTPOnly Assinados (`signedCookies`)**

Em vez de trafegar os tokens JWT no corpo das respostas JSON (facilitando vazamentos via ataques de Cross-Site Scripting - XSS), a API encapsula os payloads dentro de cookies nativos do protocolo HTTP com as diretivas:

- `httpOnly: true`: Impede o acesso ou leitura dos tokens através de scripts executados no navegador (document.cookie).
- `secure: true`: Força o tráfego exclusivo dos cookies por conexões criptografadas HTTPS.
- `sameSite: 'strict'`: Blindagem nativa contra ataques de falsificação de requisições entre sites (Cross-Site Request Forgery - CSRF).
- `signed: true`: O cookie é assinado com a chave secreta da aplicação na borda do Express, invalidando de forma automática cookies adulterados no lado do cliente antes de chegarem aos Guards.

**2. Configurações de Ciclo de Vida (TTL)**

- **Access Token:** Tempo de expiração curto (15 minutos), reduzindo a janela de vulnerabilidade caso um token temporário seja interceptado.
- **Refresh Token:** Tempo de vida longo (7 dias), limitado estritamente ao escopo da rota de renovação (path: '/auth/refresh').

**3. Mecanismo de Logout Concorrente**

A invalidação do acesso é síncrona e definitiva. O endpoint `POST /auth/logout` remove imediatamente a chave identificadora do usuário de dentro da memória do Redis, invalidando de forma reativa qualquer Access Token que ainda esteja dentro do período de validade de 15 minutos, e limpa os cookies HTTPOnly do navegador do cliente através de comandos `clearCookie`.

**4. Armazenamento no Redis**

- **Estratégia:** Em vez de apenas decodificar o token de forma stateless, o sistema consulta o Redis no Guard de autenticação para validar se aquela sessão ainda é legítima.
- **Segurança vs Performance:** A validação é feita diretamente na memória (Redis), o que mantém o tempo de resposta extremamente baixo e adiciona uma camada robusta de proteção, permitindo derrubar sessões instantaneamente se necessário.

**5. Proteção de Dados**

- Credenciais trafegam estritamente via HTTPS.
- O hash da senha no banco utiliza algoritmos seguros.
