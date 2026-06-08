export const maskPhone = (phone: string): string => {
  const clearPhone = phone.replace(/\D/g, '');

  if (clearPhone.length !== 11) return phone;

  return clearPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
};
