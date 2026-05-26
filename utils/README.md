# 🛠️ Utilitários Globais e Motores Criptográficos (`utils/`)

Esta pasta abriga funções utilitários puras, isoladas e completamente agnósticas às regras de negócio da aplicação. O foco central deste módulo é fornecer os motores matemáticos e criptográficos que garantem a segurança e a integridade dos dados em conformidade com a LGPD e as melhores práticas de cibersegurança.

---

## 🔐 Recursos Implementados

### 1. Hashing Avançado de Senhas (Argon2id)

Diferente dos dados recuperáveis, as senhas dos usuários são protegidas por um mecanismo de hash unidirecional de última geração, tornando impossível a engenharia reversa do dado original.

- **Algoritmo:** **Argon2** (variante `argon2id`), o padrão recomendado pela OWASP e vencedor da _Password Hashing Competition_.
- **Resistência a Ataques:** O Argon2id combina resistência a ataques de canal lateral (baseados em tempo) e ataques baseados em hardware acelerado (como GPUs/ASICs), utilizando parâmetros configuráveis de memória, tempo (iterações) e paralelismo (threads).
- **Mecanismo:** Utilizado no momento do cadastro do usuário e na verificação do login, garantindo criptografia robusta antes de qualquer validação de credenciais.

### 2. Criptografia Simétrica (AES-256-GCM)

Utilizado para mascarar dados confidenciais diretamente no banco de dados (ex: CPFs), garantindo que, mesmo em caso de vazamento do banco, os dados permaneçam ilegíveis.

- **Algoritmo:** Advanced Encryption Standard com chave de 256 bits em modo Galois/Counter Mode (`aes-256-gcm`).
- **Segurança Baseada em IV:** Cada operação de criptografia gera um Vetor de Inicialização (IV) aleatório de 16 bytes. O payload final persistido combina o `IV`, a `Tag de Autenticação` (que garante que o dado não foi violado) e o `Texto Criptografado` (iv:authTag:cipher).

### 3. Geração de Hash Determinístico (SHA-256)

Como dados criptografados com AES-256-GCM geram saídas diferentes para a mesma entrada (devido ao IV aleatório), o sistema utiliza hashing para viabilizar buscas indexadas na API.

- **Algoritmo:** `sha256`.
- **Mecanismo:** Transforma o dado bruto (como o CPF) em um hash único e fixo combinado a um _Salt_ secreto global. Isso permite consultas exatas no PostgreSQL utilizando cláusulas `WHERE` de alta performance.

### 4. Mascaramento Dinâmico de Dados (Data Masking)

Funções responsáveis por formatar dados sigilosos antes de serem enviados na resposta HTTP para o cliente.

- **Comportamento:** Transforma strings brutas em formatos seguros (ex: um CPF descriptografado `12345678901` é transformado em `***.456.789-**`), garantindo o princípio do privilégio mínimo na visualização de dados.
