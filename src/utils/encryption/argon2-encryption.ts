import argon2 from "argon2";

import clearCpf from "./clear-cpf";

// Essa função tem como objetivo o armazenamento criptografado do CPF no banco de dados.
// Pode ser usada para realizar a autênticação do usuário através do CPF de forma segura.
export async function argon2Cpf(cpf: string): Promise<string> {
  const clearedCpf = clearCpf(cpf);

  return argon2.hash(clearedCpf, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}
