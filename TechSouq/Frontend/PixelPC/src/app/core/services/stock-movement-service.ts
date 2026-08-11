import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  StockAdjustRequest,
  StockMovement,
  StockMovementFilters,
} from '../models/stock-movement.models';

const BASE_URL = `${API_BASE_URL}/api/StockMovements`;

@Injectable({
  providedIn: 'root',
})
export class StockMovementService {
  private readonly http = inject(HttpClient);

  getAll(filters?: StockMovementFilters): Observable<StockMovement[]> {
    const params: Record<string, number> = {};
    if (filters?.productVariantId != null) params['productVariantId'] = filters.productVariantId;
    if (filters?.orderId != null) params['orderId'] = filters.orderId;

    return this.http.get<StockMovement[]>(`${BASE_URL}/GetAllStockMovements`, { params });
  }

  adjust(data: StockAdjustRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${BASE_URL}/adjust`, data);
  }
}
