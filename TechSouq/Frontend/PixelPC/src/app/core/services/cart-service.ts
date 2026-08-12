import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AddCartItemRequest, Cart, UpdateCartItemRequest } from '../models/cart.models';

const BASE_URL = `${API_BASE_URL}/api/Carts`;

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);

  // Lightweight header-badge count, kept in sync opportunistically by whichever
  // page last fetched or mutated the cart — not a live multi-tab subscription.
  private readonly itemCountSignal = signal(0);
  readonly itemCount = this.itemCountSignal.asReadonly();

  refreshCount(): void {
    this.getMyCart().subscribe({
      next: (cart) => this.syncCount(cart),
      error: () => this.itemCountSignal.set(0),
    });
  }

  syncCount(cart: Cart): void {
    this.itemCountSignal.set(cart.items.reduce((sum, item) => sum + item.quantity, 0));
  }

  resetCount(): void {
    this.itemCountSignal.set(0);
  }

  getMyCart(): Observable<Cart> {
    return this.http.get<Cart>(`${BASE_URL}/GetMyCart`);
  }

  addToCart(data: AddCartItemRequest): Observable<void> {
    return this.http.post<void>(`${BASE_URL}/AddToCart`, data);
  }

  updateCartItem(id: number, data: UpdateCartItemRequest): Observable<void> {
    return this.http.put<void>(`${BASE_URL}/UpdateCartItem`, data, { params: { id } });
  }

  removeCartItem(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/RemoveCartItem`, { params: { id } });
  }
}
