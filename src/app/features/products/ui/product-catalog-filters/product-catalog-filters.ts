import { Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';

import type { ProductCatalogView } from '../../types/product.types';
import { ProductCategoryFilterComponent } from '../product-category-filter/product-category-filter';
import { ProductSearchComponent } from '../product-search/product-search';
import { ProductViewToggleComponent } from '../product-view-toggle/product-view-toggle';

@Component({
  selector: 'app-product-catalog-filters',
  imports: [MatCardModule, ProductCategoryFilterComponent, ProductSearchComponent, ProductViewToggleComponent],
  templateUrl: './product-catalog-filters.html',
  styleUrl: './product-catalog-filters.scss',
})
export class ProductCatalogFiltersComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly categories = input.required<readonly string[]>();
  readonly category = input('all');
  readonly viewMode = input<ProductCatalogView>('cards');

  setCategory(category: string): void {
    this.updateQueryParams({ category: category === 'all' ? null : category });
  }

  setViewMode(viewMode: ProductCatalogView): void {
    this.updateQueryParams({ view: viewMode === 'cards' ? null : viewMode });
  }

  private updateQueryParams(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
