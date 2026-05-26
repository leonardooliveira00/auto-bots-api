# 🔄 Fluxo de Dados e Ciclo de Vida da Requisição

Este documento detalha o caminho percorrido pelos dados dentro do ecossistema **Auto-Bots**, desde o momento em que o cliente faz uma requisição HTTP até a persistência segura no banco de dados e sincronização de cache. O sistema foi projetado para garantir máxima performance e conformidade estrita com a LGPD.

---

## 🔒 1. Fluxo de Autenticação, Guarda e Rate Limiting

Antes que qualquer dado toque a lógica de negócio ou os controladores principais, a requisição passa por uma camada de infraestrutura de segurança distribuída:

[Cliente] ──> [Rate Limiter (Redis)] ──> [Guards (JWT & Session)] ──> [Controller]

1. **Camada de Throttle (Rate Limiting):** O Redis intercepta a requisição para verificar se o IP do cliente não excedeu o limite seguro de requisições por minuto, mitigando ataques de força bruta ou negação de serviço (DoS).
2. **Interpolação de Guards (Ciclo de Vida do Token):** \* O `AccessToken Guard` extrai o token JWT do header da requisição.
   - Em vez de apenas decodificar o token localmente, a aplicação faz uma checagem rápida no **Redis** para validar o status daquela sessão (`SessionGuard`).
   - Se o token estiver revogado (por exemplo, após um logout ou rotação de _Refresh Token_), a requisição é abortada imediatamente com erro `401 Unauthorized`.

---

## 🛡️ 2. Ciclo de Escrita (Ingestão de Dados Sensíveis)

Quando um dado confidencial (como o CPF de um usuário) é enviado para criação ou atualização, o fluxo de criptografia é acionado na camada de serviço antes da persistência:

1. **Recebimento e Validação:** O `Controller` valida o formato do payload através dos DTOs e repassa o objeto limpo para o `Service`.
2. **Geração do Hash de Busca (SHA-256):** \* Bancos de dados não conseguem indexar ou realizar buscas eficientes em textos criptografados de forma randômica.
   - Para resolver isso, a camada de utilitários (`utils/`) gera um hash determinístico do dado bruto usando **SHA-256** acoplado a um _salt_ secreto global.
   - Este hash é salvo em uma coluna indexada dedicada (ex: `cpfHash`), permitindo consultas futuras exatas (`WHERE cpfHash = :hash`) de forma ultraperformática.
3. **Criptografia Simétrica (AES-256-GCM):**
   - O dado bruto original é processado pelo algoritmo **AES-256-GCM** utilizando uma chave simétrica de 32 bytes e um Vetor de Inicialização (IV) exclusivo gerado por requisição.
   - O resultado (texto criptografado + tag de autenticação + IV) é o que é enviado para o campo principal no banco de dados (ex: `cpf`).
4. **Persistência e Cache:** O `Prisma Repository` salva os dados mascarados/criptografados no **PostgreSQL** e, de forma assíncrona, invalida ou atualiza as chaves afetadas no cache do **Redis**.

---

## 🔍 3. Ciclo de Leitura e Sanitização de Resposta

O caminho inverso garante que o dado armazenado de forma segura seja consumido de maneira legível pelo frontend autorizado, mas sem expor a informação bruta de forma desnecessária:

1. **Consulta:** O `Service` solicita o registro ao `Prisma Repository`.
2. **Descriptografia Local:** O motor em `utils/` utiliza a chave mestra para descriptografar o valor do banco através do AES-256-GCM, validando a integridade do dado através da tag de autenticação.
3. **Interceptação e Mascaramento (class-transformer):**
   - Antes do `Controller` enviar a resposta HTTP ao cliente, interceptores do NestJS aplicam os decorators do `class-transformer` configurados na Entidade.
   - Os dados sensíveis são mascarados em tempo de execução (ex: transformando o CPF descriptografado em `***.###.###-**`).
4. **Camada de Caching:** Se a mesma consulta for requisitada na sequência, o `CacheInterceptor` intercepta o fluxo e entrega o dado diretamente da memória do **Redis**, evitando acessos repetidos ao PostgreSQL e reduzindo drasticamente a latência da API.
