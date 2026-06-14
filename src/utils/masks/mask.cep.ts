export const maskPostalCode = (postalCode: string): string => {
  const clearPostalCode = postalCode.replace(/\D/g, '');

  if (clearPostalCode.length !== 8) {
    return postalCode;
  }

  return clearPostalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};
