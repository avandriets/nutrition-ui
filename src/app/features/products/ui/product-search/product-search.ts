import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-product-search',
  imports: [MatButtonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
})
export class ProductSearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly searchControl = new FormControl(this.searchFromUrl(), { nonNullable: true });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map(params => params.get('search') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(search => {
        if (search !== this.searchControl.value) {
          this.searchControl.setValue(search, { emitEvent: false });
        }
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        map(search => search.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(search => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { search: search || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
  }

  clear(): void {
    this.searchControl.setValue('');
  }

  private searchFromUrl(): string {
    return this.route.snapshot.queryParamMap.get('search') ?? '';
  }
}
