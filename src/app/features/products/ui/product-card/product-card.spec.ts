import { TestBed } from '@angular/core/testing';

import type { Product } from '../../types/product.types';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  const product: Product = {
    id: 1,
    name: 'Apple',
    brand: null,
    category: 'Fruit',
    barcode: null,
    description: 'Green apple',
    calories_kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbohydrates_g: 14,
    fiber_g: 2.4,
    created_at: '2026-09-12T00:00:00Z',
    updated_at: '2026-09-12T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductCardComponent] }).compileComponents();
  });

  it('renders the product summary', () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Apple');
    expect(text).toContain('Fruit');
    expect(text).toContain('52');
    expect(text).toContain('14 g');
  });
});
