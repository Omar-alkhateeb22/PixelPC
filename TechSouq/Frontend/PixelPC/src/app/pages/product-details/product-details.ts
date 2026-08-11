import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { ProductService } from '../../core/services/product-service';
import { CartService } from '../../core/services/cart-service';
import { ProductDetail, ProductVariant } from '../../core/models/product.models';

interface VariantAttributes {
  ram: string;
  storage: string;
  color: string;
}

@Component({
  selector: 'app-product-details',
  imports: [],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  readonly product = signal<ProductDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedVariantId = signal<number | null>(null);
  readonly quantity = signal(1);

  readonly addingToCart = signal(false);
  readonly addToCartError = signal<string | null>(null);
  readonly addToCartSuccess = signal(false);

  // Whether the current product's imageUrl failed to load, so a broken URL
  // falls back to the placeholder instead of the browser's broken-image icon.
  readonly imageLoadError = signal(false);

  readonly selectedVariant = computed(
    () => this.product()?.variants.find((v) => v.id === this.selectedVariantId()) ?? null,
  );

  readonly canAddToCart = computed(() => {
    const variant = this.selectedVariant();
    return (
      !!variant &&
      variant.stockQuantity > 0 &&
      this.quantity() >= 1 &&
      this.quantity() <= variant.stockQuantity &&
      !this.addingToCart()
    );
  });

  private readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: NaN },
  );

  constructor() {
    effect(() => {
      const id = this.productId();
      if (!Number.isNaN(id)) {
        this.loadProduct(id);
      }
    });
  }

  selectVariant(variantId: number): void {
    this.selectedVariantId.set(variantId);
    this.quantity.set(1);
    this.addToCartError.set(null);
    this.addToCartSuccess.set(false);
  }

  onQuantityInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.quantity.set(Number.isFinite(value) && value > 0 ? Math.trunc(value) : 1);
  }

  variantAttributesLabel(variant: ProductVariant): string | null {
    const attrs = this.parseAttributes(variant.attributesJson);
    const parts: string[] = [];
    if (attrs.ram) parts.push(`RAM: ${attrs.ram}`);
    if (attrs.storage) parts.push(`التخزين: ${attrs.storage}`);
    if (attrs.color) parts.push(`اللون: ${attrs.color}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  addToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) {
      return;
    }

    this.addToCartError.set(null);
    this.addToCartSuccess.set(false);
    this.addingToCart.set(true);

    this.cartService.addToCart({ productVariantId: variant.id, quantity: this.quantity() }).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.addToCartSuccess.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.addingToCart.set(false);
        this.addToCartError.set(this.extractErrorMessage(err));
      },
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.selectedVariantId.set(null);
    this.quantity.set(1);
    this.addToCartError.set(null);
    this.addToCartSuccess.set(false);
    this.imageLoadError.set(false);

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private parseAttributes(json: string | null | undefined): VariantAttributes {
    try {
      const parsed = JSON.parse(json || '{}');
      return {
        ram: typeof parsed.ram === 'string' ? parsed.ram : '',
        storage: typeof parsed.storage === 'string' ? parsed.storage : '',
        color: typeof parsed.color === 'string' ? parsed.color : '',
      };
    } catch {
      return { ram: '', storage: '', color: '' };
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 401 || err.status === 403) {
      return 'يجب تسجيل الدخول كعميل لإضافة المنتج إلى السلة.';
    }

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return String((err.error as { message: unknown }).message);
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
