import { createHmac, timingSafeEqual } from 'node:crypto';

export const generateTokenHash = (token: string): string => {
  const keyHex = process.env.JWT_KEY;

  if (!keyHex) throw new Error('JWT_KEY não definida.');

  const key = Buffer.from(keyHex, 'hex');

  if (key.length !== 32) throw new Error('JWT_KEY inválida.');

  return createHmac('sha256', key).update(token).digest('hex');
};

export const verifyTokenHash = (
  providedToken: string,
  storedToken: string,
): boolean => {
  const generatedHash = generateTokenHash(providedToken);

  const providedBuf = Buffer.from(generatedHash, 'hex');
  const storedBuf = Buffer.from(storedToken, 'hex');

  if (providedBuf.length !== storedBuf.length) return false;

  return timingSafeEqual(providedBuf, storedBuf);
};
