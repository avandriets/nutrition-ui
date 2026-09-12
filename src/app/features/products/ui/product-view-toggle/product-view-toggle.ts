import { Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { ProductCatalogView } from '../../types/product.types';

@Component({
  selector: 'app-product-view-toggle',
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule],
  templateUrl: './product-view-toggle.html',
  styleUrl: './product-view-toggle.scss',
})
export class ProductViewToggleComponent {
  readonly viewMode = input<ProductCatalogView>('cards');
  readonly viewModeChange = output<ProductCatalogView>();
}
