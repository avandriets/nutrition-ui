import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import type { Product } from '../../types/product.types';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatMenuModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly editRequested = output<Product>();
  readonly deleteRequested = output<Product>();
}
