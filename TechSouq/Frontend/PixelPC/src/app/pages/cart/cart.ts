import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CartService } from '../../core/services/cart-service';
import { Cart as CartModel, CartItem } from '../../core/models/cart.models';

const EMPTY_CART: CartModel = { createdAt: '', items: [] };

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private readonly cartService = inject(CartService);

  readonly cart = signal<CartModel | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Pending quantity edits, keyed by cart item id, until "تحديث" is clicked.
  readonly quantityDrafts = signal<Partial<Record<number, number>>>({});
  readonly updatingItemIds = signal<Set<number>>(new Set());
  readonly removingItemIds = signal<Set<number>>(new Set());

  readonly grandTotal = computed(() => {
    const items = this.cart()?.items ?? [];
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.cartService.getMyCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.quantityDrafts.set(Object.fromEntries(cart.items.map((item) => [item.id, item.quantity])));
        this.cartService.syncCount(cart);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.cart.set(EMPTY_CART);
          this.cartService.resetCount();
          this.loading.set(false);
          return;
        }

        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  onQuantityInput(itemId: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.quantityDrafts.update((drafts) => ({
      ...drafts,
      [itemId]: Number.isFinite(value) && value > 0 ? Math.trunc(value) : 1,
    }));
  }

  updateQuantity(item: CartItem): void {
    const newQuantity = this.quantityDrafts()[item.id] ?? item.quantity;
    if (newQuantity === item.quantity) {
      return;
    }

    this.errorMessage.set(null);
    this.updatingItemIds.update((ids) => new Set(ids).add(item.id));

    this.cartService.updateCartItem(item.id, { quantity: newQuantity }).subscribe({
      next: () => {
        this.updatingItemIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingItemIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  removeItem(item: CartItem): void {
    if (!confirm(`هل أنت متأكد من حذف "${item.productName}" من السلة؟`)) {
      return;
    }

    this.errorMessage.set(null);
    this.removingItemIds.update((ids) => new Set(ids).add(item.id));

    this.cartService.removeCartItem(item.id).subscribe({
      next: () => {
        this.removingItemIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.removingItemIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return String((err.error as { message: unknown }).message);
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
