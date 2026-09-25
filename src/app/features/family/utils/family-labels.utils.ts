export function recordsCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`;
}
