---
sidebar_position: 4
title: Gerenciamento de Sessões e Rate Limiting
---

# Módulo de Sessions e Proteção de Rotas

O sistema adota uma estratégia de segurança em camadas para proteger os endpoints da API. Combinamos controle de taxa de requisições (**Rate Limiting / Throttler**), validação de estado do token no **Redis** e armazenamento seguro via **Cookies HTTPOnly**.

## Fluxo de Intercepção de Requisições (Guards & Cookies)

O diagrama abaixo ilustra o ciclo de vida de uma requisição. Repare que o cliente não envia o token manualmente via cabeçalho `Authorization: Bearer`; em vez disso, o navegador anexa o cookie de forma automática e segura a cada requisição.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Guard as Custom Guard (Throttler + AccessToken)
    participant Redis as Redis (Sessões & Rate Limit)
    participant Controller as NestJS Controller / Rota

    Cliente->>+Guard: Requisição HTTP (Cookies anexados automaticamente)

    Note over Guard, Redis: 1. Camada de Rate Limiting (Throttler)
    Guard->>+Redis: Incrementa e checa limite de requisições (IP/User)
    Redis-->>-Guard: Retorna contagem atual

    ALT Limite Excedido (Rate Limit)
        Guard-->>Cliente: Retorna 429 Too Many Requests
    ELSE Limite OK
        Note over Guard, Redis: 2. Camada de Autenticação (Extração do Cookie)
        Guard->>Guard: Extrai o JWT de dentro do Cookie httpOnly
        Guard->>Guard: Decodifica e valida assinatura do JWT
        Guard->>+Redis: Checa se o Hash do Access Token está ativo/válido
        Redis-->>-Guard: Retorna estado da sessão (Ativo / Invalido)

        ALT Token Inválido ou Revogado
            Guard-->>Cliente: Retorna 401 Unauthorized
        ELSE Token Válido e Sessão Ativa
            Guard->>+Controller: Encaminha requisição para a rota
            Controller-->>-Cliente: Retorna Resposta (200 OK)
        end
    end
```

## Fluxo de Renovação de Sessão (/refresh)

A renovação de tokens também é feita de forma totalmente blindada. O RefreshTokenGuard extrai o token do cookie específico de refresh, e a rota se encarrega de devolver os novos tokens setando os novos cookies no cabeçalho de resposta (Set-Cookie).

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant Guard as RefreshTokenGuard
    participant Redis as Redis (Sessões)
    participant Controller as Auth Controller (/refresh)

    Cliente->>+Guard: POST /auth/refresh (Navegador envia o Refresh Cookie)
    Guard->>Guard: Extrai e valida assinatura do Refresh Token
    Guard->>+Redis: Verifica se o Refresh Token está na Whitelist
    Redis-->>-Guard: Retorna status (Válido / Revogado)

    ALT Token Inválido ou Revogado
        Guard-->>Cliente: Retorna 401 Unauthorized (Força re-login)
    ELSE Token Válido
        Guard->>+Controller: Encaminha para rota /refresh
        Controller->>Controller: Gera novo par de tokens (Access + Refresh)
        Controller->>Redis: Atualiza hashes no Redis (Invalida os antigos)
        Controller-->>-Cliente: Resposta com cabeçalhos Set-Cookie (Novos Tokens httpOnly)
    end
```

## Engenharia e Arquitetura do Módulo

**1.Guard Decorado Unificado**

Em vez de empilhar múltiplos decorators (@UseGuards(ThrottlerGuard, AccessTokenGuard)) em cada rota, o sistema utiliza um Guard customizado que combina ambas as lógicas. Isso garante que:

- O Throttler processe primeiro, poupando processamento de criptografia (extração e decodificação do JWT) caso o cliente esteja fazendo spam de requisições.
- O código das controllers fique mais limpo e padronizado.

---

**2. Validação Stateful com JWT no Redis**

Embora o JWT seja por natureza stateless, armazenar o hash do access_token no Redis transforma a validação em stateful, trazendo o melhor dos dois mundos:

- **Segurança Máxima:** Se um usuário fizer logout ou sua sessão for revogada por um admin, o hash é invalidado instantaneamente no Redis, bloqueando acessos futuros imediatamente (derrubada em tempo real).
- **Performance Elevada:** Como o Redis opera em memória, a busca pelo hash do token leva frações de milissegundos, mantendo a API extremamente veloz.

---

**3. Blindagem com Cookies HTTPOnly (Mitigação de XSS)**

A estratégia de armazenamento de tokens resolve uma das maiores vulnerabilidades da web moderna:

- **Anti-XSS:** Ao configurar os cookies como httpOnly: true, scripts maliciosos rodando no cliente (via pacotes npm corrompidos ou falhas de injeção) ficam fisicamente impossibilitados de ler os tokens através de document.cookie.
- **Automatização Segura:** O navegador gerencia o envio e expiração desses cookies nativamente, reduzindo a complexidade de gerenciamento de estado no frontend.
