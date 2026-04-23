export function joinDateTimeISO(date?: string, time?: string): string {
  if (!date) return '';

  const [day, month, year] = date.split('/');
  const formattedDate = `${year}-${month}-${day}`;

  return `${formattedDate}T${time || '00:00'}`;
}