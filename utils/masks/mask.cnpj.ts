export const maskCnpj = (cnpj: string): string => {
  const clearCnpj = cnpj.replace(/\D/g, '');

  if (clearCnpj.length !== 14) {
    return cnpj;
  }

  return clearCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.***.***/****-$5',
  );
};
