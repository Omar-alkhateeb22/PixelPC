import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { ProductService } from '../../core/services/product-service';
import { CategoryService } from '../../core/services/category-service';
import { Category } from '../../core/models/category.models';
import { ProductDetail } from '../../core/models/product.models';
import { getStartingPrice } from '../../core/utils/pricing';

@Component({
  selector: 'app-products',
  imports: [RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);

  readonly getStartingPrice = getStartingPrice;

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly categoriesError = signal<string | null>(null);

  readonly products = signal<ProductDetail[]>([]);
  readonly productsLoading = signal(true);
  readonly productsError = signal<string | null>(null);

  // Ids of products whose imageUrl failed to load, so a broken URL falls back
  // to the placeholder instead of the browser's broken-image icon.
  readonly brokenImageIds = signal<Set<number>>(new Set());

  onImageError(productId: number): void {
    this.brokenImageIds.update((ids) => new Set(ids).add(productId));
  }

  readonly selectedCategoryId = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const raw = params.get('categoryId');
        const parsed = raw ? Number(raw) : null;
        return parsed != null && !Number.isNaN(parsed) ? parsed : null;
      }),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      this.loadProducts(this.selectedCategoryId());
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.categoriesError.set(this.extractErrorMessage(err));
        this.categoriesLoading.set(false);
      },
    });
  }

  private loadProducts(categoryId: number | null): void {
    this.productsLoading.set(true);
    this.productsError.set(null);
    this.brokenImageIds.set(new Set());

    this.productService.getAllDetailed(categoryId != null ? { categoryId } : undefined).subscribe({
      next: (products) => {
        this.products.set(products);
        this.productsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.productsError.set(this.extractErrorMessage(err));
        this.productsLoading.set(false);
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
