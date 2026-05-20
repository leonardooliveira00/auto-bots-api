# 🗺️ Modelagem de Dados e Relacionamentos

Este documento descreve a estrutura relacional do banco de dados PostgreSQL do **Auto-Bots**, mapeada através do **Prisma ORM**. A modelagem foi desenhada para garantir a integridade referencial, performance em consultas indexadas e flexibilidade para as regras de negócio do sistema de gestão.

---

## 🗄️ Entidades e Cardinalidades

O ecossistema é composto por três entidades principais interconectadas, além de módulos de suporte para controle de acessos e sessões.

### 1. Usuário (`User`) ↔ Endereço (`Address`)

- **Tipo de Relacionamento:** `1:1` (Um para Um).
- **Regra de Negócio:** Cada colaborador/usuário do sistema possui seus dados de localização atrelados ao seu perfil. No banco de dados, a tabela `Address` carrega a chave estrangeira (`userId`), garantindo que a remoção de um usuário propague a exclusão do seu endereço correspondente (Cascade Delete) para evitar dados órfãos.

---

## 📈 Destaques de Engenharia no Schema

Para suportar os fluxos de segurança e performance documentados nos pilares anteriores, o schema do Prisma conta com modificadores estratégicos:

- **Índices (`@@index` / `@unique`):** O campo que armazena o hash determinístico (SHA-256) do documento do usuário possui um índice único (`@unique`). Isso garante que a busca por um usuário através de seu documento criptografado aconteça em tempo constante, sem expor o dado bruto.
- **Integridade Referencial:** Restrições de chave estrangeira (FKs) explícitas garantem que nenhuma endereço aponte para um usuário inexistente, blindando o banco contra corrupção de dados a nível de aplicação.
