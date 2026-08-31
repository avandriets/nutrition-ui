import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { Product, ProductPayload } from '../../data-access/product.model';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductDeleteDialog } from '../../ui/product-delete-dialog/product-delete-dialog';
import { ProductFormDialog } from '../../ui/product-form-dialog/product-form-dialog';

@Component({
  selector: 'app-product-catalog-page',
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './product-catalog.page.html',
  styleUrl: './product-catalog.page.scss',
})
export class ProductCatalogPage implements OnInit {
  private readonly productsApi = inject(ProductsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly search = signal('');
  protected readonly category = signal('all');
  protected readonly viewMode = signal<'cards' | 'table'>('cards');

  protected readonly categories = computed(() =>
    [
      ...new Set(
        this.products()
          .map((product) => product.category)
          .filter((value): value is string => !!value),
      ),
    ].sort(),
  );

  protected readonly filteredProducts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');
    const category = this.category();
    return this.products().filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const searchable = [product.name, product.brand, product.category]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('ru');
      return matchesCategory && (!query || searchable.includes(query));
    });
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set(false);
    this.productsApi
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => this.error.set(true),
      });
  }

  protected setSearch(value: string): void {
    this.search.set(value);
  }
  protected setCategory(value: string): void {
    this.category.set(value);
  }

  protected setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }

  protected addProduct(): void {
    this.dialog
      .open<ProductFormDialog, null, ProductPayload>(ProductFormDialog, {
        data: null,
        width: '900px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.createProduct(payload);
      });
  }

  protected editProduct(product: Product): void {
    this.dialog
      .open<ProductFormDialog, Product, ProductPayload>(ProductFormDialog, {
        data: product,
        width: '900px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.updateProduct(product.id, payload);
      });
  }

  protected confirmDelete(product: Product): void {
    this.dialog
      .open<ProductDeleteDialog, { name: string }, boolean>(ProductDeleteDialog, {
        data: { name: product.name },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.deleteProduct(product);
      });
  }

  protected dismissActionError(): void {
    this.actionError.set(null);
  }

  private createProduct(payload: ProductPayload): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.productsApi
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (product) => {
          this.products.update((products) => [product, ...products]);
          this.snackBar.open('Продукт добавлен в общий каталог', 'Закрыть', { duration: 3000 });
        },
        error: () => this.actionError.set('Не удалось добавить продукт.'),
      });
  }

  private updateProduct(productId: number, payload: ProductPayload): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.productsApi
      .update(productId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.products.update((products) =>
            products.map((product) => (product.id === updated.id ? updated : product)),
          );
          this.snackBar.open('Изменения сохранены', 'Закрыть', { duration: 3000 });
        },
        error: () => this.actionError.set('Не удалось сохранить изменения.'),
      });
  }

  private deleteProduct(product: Product): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.productsApi
      .delete(product.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.products.update((products) => products.filter((item) => item.id !== product.id));
          this.snackBar.open('Продукт удалён', 'Закрыть', { duration: 3000 });
        },
        error: () => this.actionError.set('Не удалось удалить продукт.'),
      });
  }
}
