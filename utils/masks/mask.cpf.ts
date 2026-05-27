export const maskCpf = (cpf: string): string => {
  const clearCpf = cpf.replace(/\D/g, '');

  if (clearCpf.length !== 11) return cpf;

  return clearCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '***.$2.$3-**');
};
