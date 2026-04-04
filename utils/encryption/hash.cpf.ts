import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Essa função tem o objetivo de checar a duplicidade do CPF com o banco de dados.
// Exemplo: Verificar se o CPF digitado pelo usuário já foi cadastrado ou não.
export const generateCpfHash = (cpf: string): string => {
  const keyHex = process.env.CPF_HMAC_KEY;
  if (!keyHex) throw new Error('CPF_HMAC_KEY não definida');

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32)
    throw new Error('CPF_HMAC_KEY deve conter 32 bytes (64 caracteres hex).');

  return crypto.createHmac('sha256', key).update(cpf).digest('hex');
};
