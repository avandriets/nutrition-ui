import type { OnInit } from '@angular/core';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { filter, tap } from 'rxjs';

import type { UIConfirmDialogData } from '../../../../shared/types/confirm-dialog.types';
import type { UIStateStatus } from '../../../../shared/types/state-container.types';
import { UIConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { UIPageComponent } from '../../../../shared/ui/page/page';
import { UIStateContainerComponent } from '../../../../shared/ui/state-container/state-container';
import { ProductCatalogStore } from '../../data-access/product-catalog.store';
import type { Product, ProductCatalogView, ProductPayload } from '../../types/product.types';
import { ProductCardComponent } from '../../ui/product-card/product-card';
import { ProductCatalogFiltersComponent } from '../../ui/product-catalog-filters/product-catalog-filters';
import { ProductFormDialog } from '../../ui/product-form-dialog/product-form-dialog';
import { ProductTableComponent } from '../../ui/product-table/product-table';

@Component({
  selector: 'app-product-catalog-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    ProductCardComponent,
    ProductCatalogFiltersComponent,
    ProductTableComponent,
    UIPageComponent,
    UIStateContainerComponent,
  ],
  templateUrl: './product-catalog.page.html',
  styleUrl: './product-catalog.page.scss',
})
export class ProductCatalogPage implements OnInit {
  private readonly productCatalogStore = inject(ProductCatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly products = this.productCatalogStore.entities;
  readonly actionError = this.productCatalogStore.actionError;
  readonly saving = this.productCatalogStore.saving;
  readonly search = computed(() => this.queryParamMap().get('search') ?? '');
  readonly category = computed(() => this.queryParamMap().get('category') ?? 'all');
  readonly viewMode = computed<ProductCatalogView>(() => (this.queryParamMap().get('view') === 'table' ? 'table' : 'cards'));
  readonly categories = computed(() =>
    [
      ...new Set(
        this.products()
          .map(product => product.category)
          .filter((value): value is string => !!value),
      ),
    ].sort(),
  );

  readonly filteredProducts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');
    const category = this.category();
    return this.products().filter(product => {
      const matchesCategory = category === 'all' || product.category === category;
      const searchable = [product.name, product.brand, product.category].filter(Boolean).join(' ').toLocaleLowerCase('ru');
      return matchesCategory && (!query || searchable.includes(query));
    });
  });

  readonly catalogState = computed<UIStateStatus<string>>(() => {
    const entityState = this.productCatalogStore.entityState();

    return {
      ...entityState,
      empty: entityState.resolved && !this.filteredProducts().length,
    };
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  addProduct(): void {
    this.dialog
      .open<ProductFormDialog, null, ProductPayload>(ProductFormDialog, {
        data: null,
        width: '900px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(payload => this.createProduct(payload)),
      )
      .subscribe();
  }

  editProduct(product: Product): void {
    this.dialog
      .open<ProductFormDialog, Product, ProductPayload>(ProductFormDialog, {
        data: product,
        width: '900px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(payload => this.updateProduct(product.id, payload)),
      )
      .subscribe();
  }

  confirmDelete(product: Product): void {
    this.dialog
      .open<UIConfirmDialogComponent, UIConfirmDialogData, boolean>(UIConfirmDialogComponent, {
        data: {
          icon: 'delete_outline',
          title: 'Удалить продукт?',
          message: [
            {
              text: product.name,
              emphasis: true,
            },
            { text: ' будет удалён из общего каталога. Это действие нельзя отменить.' },
          ],
          confirmText: 'Удалить',
          tone: 'danger',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => this.deleteProduct(product)),
      )
      .subscribe();
  }

  dismissActionError(): void {
    this.productCatalogStore.dismissActionError();
  }

  private createProduct(payload: ProductPayload): void {
    this.productCatalogStore
      .create(payload)
      .pipe(tap(() => this.snackBar.open('Продукт добавлен в общий каталог', 'Закрыть', { duration: 3000 })))
      .subscribe();
  }

  private updateProduct(productId: number, payload: ProductPayload): void {
    this.productCatalogStore
      .update({ id: productId, payload })
      .pipe(tap(() => this.snackBar.open('Изменения сохранены', 'Закрыть', { duration: 3000 })))
      .subscribe();
  }

  private deleteProduct(product: Product): void {
    this.productCatalogStore
      .remove(product.id)
      .pipe(tap(() => this.snackBar.open('Продукт удалён', 'Закрыть', { duration: 3000 })))
      .subscribe();
  }

  private loadProducts(): void {
    this.productCatalogStore.load({}).subscribe();
  }
}
