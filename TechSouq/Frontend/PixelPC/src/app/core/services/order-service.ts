import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { CheckoutRequest, CheckoutResponse, Order, OrderStatus, OrderSummary } from '../models/order.models';

const BASE_URL = `${API_BASE_URL}/api/Orders`;

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${BASE_URL}/GetAllOrders`);
  }

  getMyOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${BASE_URL}/GetMyOrders`);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${BASE_URL}/GetOrderById`, { params: { id } });
  }

  updateStatus(id: number, status: OrderStatus): Observable<string> {
    // UpdateOrderStatus returns a raw text/plain string ("Order status updated:X"),
    // not JSON — request responseType: 'text' so Angular doesn't try to JSON.parse
    // it and turn an otherwise-successful 200 into an HttpErrorResponse.
    return this.http.patch(
      `${BASE_URL}/UpdateOrderStatus`,
      { status },
      { params: { id }, responseType: 'text' },
    );
  }

  checkout(data: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${BASE_URL}/checkout`, data);
  }
}
