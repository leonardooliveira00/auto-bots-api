# 🌐 Configurações Compartilhadas e Infraestrutura (`common/`)

A pasta `common/` funciona como o núcleo de infraestrutura global do **Auto-Bots**. Ela centraliza as inicializações, interceptores e configurações de ferramentas de terceiros que dão suporte transversal a múltiplos módulos de domínio (como `users` e `auth`).

---

## ⚡ Recursos Implementados

### 1. Configuração Central do Redis

Módulo responsável por estabelecer e gerenciar a pool de conexões com o servidor Redis via Docker/Railway.

- **Abstração:** Configura o cliente do Redis utilizando as variáveis de ambiente estruturadas de forma segura.
- **Injeção de Dependência:** Expõe o cliente Redis para ser consumido globalmente por camadas de segurança (Guards de sessão) e controle de tráfego.

### 2. Camada de Cache Global (Caching)

Gerencia a política de armazenamento em memória de forma assíncrona para otimizar as operações de leitura da API.

- **Estratégia de Cache:** Configuração de interceptores globais (`CacheInterceptor`) e TTL (Time-To-Live) customizados.
- **Performance:** Evita requisições redundantes ao PostgreSQL, armazenando os resultados de queries frequentes na memória RAM do Redis e invalidando esse cache de forma inteligente sempre que ocorrem escritas (`POST`, `PUT`, `DELETE`).
