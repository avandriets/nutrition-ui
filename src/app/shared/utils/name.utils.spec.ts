import { describe, expect, it } from 'vitest';

import { initials } from './name.utils';

describe('name utils', () => {
  it('returns uppercase initials for the first two name parts', () => {
    expect(initials('  Anna   Petrova Sergeevna  ')).toBe('AP');
  });

  it('supports a single-part name', () => {
    expect(initials('alex')).toBe('A');
  });
});
