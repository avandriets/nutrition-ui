import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Product, ProductListParams, ProductPayload } from '../types/product.types';

@Injectable()
export class ProductsApiService {
  private readonly http = inject(HttpClient);

  list({ skip = 0, limit = 500 }: ProductListParams = {}): Observable<Product[]> {
    const params = new HttpParams().set('skip', skip).set('limit', limit);
    return this.http.get<Product[]>('/api/products', { params });
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>('/api/products', payload);
  }

  update(productId: number, payload: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`/api/products/${productId}`, payload);
  }

  delete(productId: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${productId}`);
  }
}
