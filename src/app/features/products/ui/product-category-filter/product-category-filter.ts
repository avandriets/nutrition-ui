import { Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-product-category-filter',
  imports: [MatSelectModule],
  templateUrl: './product-category-filter.html',
  styleUrl: './product-category-filter.scss',
})
export class ProductCategoryFilterComponent {
  readonly categories = input.required<readonly string[]>();
  readonly category = input('all');
  readonly categoryChange = output<string>();
}
