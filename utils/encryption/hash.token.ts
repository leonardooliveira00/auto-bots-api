import argon2 from 'argon2';

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

export const generateTokenHash = async (token: string): Promise<string> => {
  try {
    return await argon2.hash(token, ARGON_OPTIONS);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro ao processar credenciais.', error);
      throw new Error('Erro ao processar credenciais.');
    }
    throw new Error('Ocorreu um erro desconhecido.');
  }
};
