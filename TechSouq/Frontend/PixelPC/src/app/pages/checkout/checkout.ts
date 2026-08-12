import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { CartService } from '../../core/services/cart-service';
import { OrderService } from '../../core/services/order-service';
import { Cart as CartModel } from '../../core/models/cart.models';
import { CheckoutResponse } from '../../core/models/order.models';

const EMPTY_CART: CartModel = { createdAt: '', items: [] };

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);

  readonly cart = signal<CartModel | null>(null);
  readonly loadingCart = signal(true);
  readonly cartErrorMessage = signal<string | null>(null);

  readonly isSubmitting = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly checkoutResult = signal<CheckoutResponse | null>(null);

  readonly grandTotal = computed(() => {
    const items = this.cart()?.items ?? [];
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  readonly form = this.fb.nonNullable.group({
    shippingAddress: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    this.loadingCart.set(true);
    this.cartErrorMessage.set(null);

    this.cartService.getMyCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.cartService.syncCount(cart);
        this.loadingCart.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.cart.set(EMPTY_CART);
          this.cartService.resetCount();
          this.loadingCart.set(false);
          return;
        }

        this.cartErrorMessage.set(this.extractErrorMessage(err));
        this.loadingCart.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.checkoutError.set(null);
    this.isSubmitting.set(true);

    this.orderService.checkout(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.checkoutResult.set(result);
        this.cartService.resetCount();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.checkoutError.set(this.extractErrorMessage(err));
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
