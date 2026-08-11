import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Order, OrderStatus, OrderSummary } from '../models/order.models';

const BASE_URL = `${API_BASE_URL}/api/Orders`;

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${BASE_URL}/GetAllOrders`);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${BASE_URL}/GetOrderById`, { params: { id } });
  }

  updateStatus(id: number, status: OrderStatus): Observable<void> {
    return this.http.patch<void>(`${BASE_URL}/UpdateOrderStatus`, { status }, { params: { id } });
  }
}
