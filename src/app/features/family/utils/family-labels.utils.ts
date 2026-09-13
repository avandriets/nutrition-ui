export function recordsCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} записей`;
  if (last === 1) return `${count} запись`;
  if (last >= 2 && last <= 4) return `${count} записи`;
  return `${count} записей`;
}
