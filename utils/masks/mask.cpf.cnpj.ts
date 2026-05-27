import { maskCpf } from './mask.cpf';
import { maskCnpj } from './mask.cnpj';

export const maskCpfOrCnpj = (value: string): string => {
  if (!value) return value;

  const clearValue = value.replace(/\D/g, '');

  if (clearValue.length === 11) {
    return maskCpf(clearValue);
  }

  if (clearValue.length === 14) {
    return maskCnpj(clearValue);
  }

  return value;
};
