import { Injectable, inject } from '@angular/core';
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
