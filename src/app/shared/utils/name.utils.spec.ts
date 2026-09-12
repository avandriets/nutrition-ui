import { describe, expect, it } from 'vitest';

import { initials } from './name.utils';

describe('name utils', () => {
  it('returns uppercase initials for the first two name parts', () => {
    expect(initials('  Анна   Петрова Сергеевна  ')).toBe('АП');
  });

  it('supports a single-part name', () => {
    expect(initials('алекс')).toBe('А');
  });
});
