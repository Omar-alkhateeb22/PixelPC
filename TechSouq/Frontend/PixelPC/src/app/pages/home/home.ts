import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CategoryService } from '../../core/services/category-service';
import { ProductService } from '../../core/services/product-service';
import { Category } from '../../core/models/category.models';
import { Product } from '../../core/models/product.models';
import { buildImageUrl } from '../../core/utils/image';

const FEATURED_COUNT = 8;

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly categoriesError = signal<string | null>(null);

  readonly featuredProducts = signal<Product[]>([]);
  readonly featuredLoading = signal(true);
  readonly featuredError = signal<string | null>(null);

  readonly buildImageUrl = buildImageUrl;

  // Ids of products whose imageUrl failed to load, so a broken URL falls back
  // to the placeholder instead of the browser's broken-image icon.
  readonly brokenImageIds = signal<Set<number>>(new Set());

  onImageError(productId: number): void {
    this.brokenImageIds.update((ids) => new Set(ids).add(productId));
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeaturedProducts();
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

  private loadFeaturedProducts(): void {
    this.brokenImageIds.set(new Set());

    this.productService.getAll().subscribe({
      next: (products) => {
        this.featuredProducts.set(products.slice(0, FEATURED_COUNT));
        this.featuredLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.featuredError.set(this.extractErrorMessage(err));
        this.featuredLoading.set(false);
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
