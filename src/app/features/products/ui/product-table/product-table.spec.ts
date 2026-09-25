import { TestBed } from '@angular/core/testing';

import type { Product } from '../../types/product.types';
import { ProductTableComponent } from './product-table';

describe('ProductTableComponent', () => {
  const product: Product = {
    id: 1,
    name: 'Apple',
    brand: 'Orchard',
    category: 'Fruit',
    barcode: null,
    description: null,
    calories_kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbohydrates_g: 14,
    fiber_g: 2.4,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductTableComponent] }).compileComponents();
  });

  it('renders products as table rows', () => {
    const fixture = TestBed.createComponent(ProductTableComponent);
    fixture.componentRef.setInput('products', [product]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Apple');
    expect(rows[0].textContent).toContain('Fruit');
    expect(rows[0].textContent).toContain('52');
  });
});
