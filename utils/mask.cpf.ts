export const maskCpf = (cpf: string): string => {
  const clearCpf = cpf.replace(/\D/g, '');

  return clearCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '***.$2.$3-**');
};
