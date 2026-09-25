export function initials(name: string, locale = 'en-US'): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toLocaleUpperCase(locale);
}
