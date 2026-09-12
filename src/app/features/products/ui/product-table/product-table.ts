import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import type { Product } from '../../types/product.types';

@Component({
  selector: 'app-product-table',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, MatMenuModule],
  templateUrl: './product-table.html',
  styleUrl: './product-table.scss',
})
export class ProductTableComponent {
  readonly products = input.required<readonly Product[]>();
  readonly editRequested = output<Product>();
  readonly deleteRequested = output<Product>();
}
