import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import clearCpf from "./clear-cpf";

const keyHex = process.env.CPF_AES_KEY;
if (!keyHex) throw new Error("Variável de ambiente CPF_KEY_AES não definida.");

const key = Buffer.from(keyHex, "hex");
if (key.length !== 32)
  throw new Error("CPF_AES_KEY de conter 32 bytes (64 caracteres hex).");

export function encryptCpf(cpf: string): string {
  const clearedCpf = clearCpf(cpf);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(clearedCpf, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptCpf(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}
