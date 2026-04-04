import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const keyHex = process.env.CPF_AES_KEY;
if (!keyHex) throw new Error('Variável de ambiente CPF_KEY_AES não definida.');

const key = Buffer.from(keyHex, 'hex');
if (key.length !== 32)
  throw new Error('CPF_AES_KEY de conter 32 bytes (64 caracteres hex).');

export const cpfEncryption = (cpf: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(cpf, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export function cpfDecryption(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}
