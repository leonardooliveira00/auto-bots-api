export const convertToBrDate = (value: unknown): any => {
  if (typeof value !== 'string') return value;

  const cleanDate = value.replace(/\//g, '-');
  const parts = cleanDate.split('-');

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day, 12, 0, 0);

    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return value;
};
