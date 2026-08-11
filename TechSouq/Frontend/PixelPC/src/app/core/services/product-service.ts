import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { API_BASE_URL } from '../config/api.config';
import {
  Product,
  ProductDetail,
  ProductFilters,
  ProductImageUploadResponse,
  ProductRequest,
  ProductVariant,
  VariantOption,
  VariantRequest,
} from '../models/product.models';

const BASE_URL = `${API_BASE_URL}/api/Products`;

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  getAll(filters?: ProductFilters): Observable<Product[]> {
    const params: Record<string, number | string> = {};
    if (filters?.categoryId != null) params['CategoryId'] = filters.categoryId;
    if (filters?.brand) params['Brand'] = filters.brand;
    if (filters?.minPrice != null) params['MinPrice'] = filters.minPrice;
    if (filters?.maxPrice != null) params['MaxPrice'] = filters.maxPrice;

    return this.http.get<Product[]>(`${BASE_URL}/GetAllProducts`, { params });
  }

  getById(id: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${BASE_URL}/GetProductByID`, { params: { id } });
  }

  /**
   * There is no flat "get all products with variants" endpoint, so this fetches
   * every matching product then fetches each product's detail (which carries its
   * variants) in parallel.
   */
  getAllDetailed(filters?: ProductFilters): Observable<ProductDetail[]> {
    return this.getAll(filters).pipe(
      switchMap((products) => {
        if (products.length === 0) return of<ProductDetail[]>([]);
        return forkJoin(products.map((product) => this.getById(product.id)));
      }),
    );
  }

  getAllVariants(): Observable<VariantOption[]> {
    return this.getAllDetailed().pipe(
      map((details) =>
        details.flatMap((detail) =>
          detail.variants.map((variant) => ({
            id: variant.id,
            label: `${detail.name} — ${variant.stockKeepingUnit}`,
            productName: detail.name,
            stockKeepingUnit: variant.stockKeepingUnit,
          })),
        ),
      ),
    );
  }

  create(data: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${BASE_URL}/CreateProduct`, data);
  }

  update(id: number, data: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${BASE_URL}/UpdateProduct`, data, { params: { id } });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/DeleteProduct`, { params: { id } });
  }

  uploadImage(id: number, file: File): Observable<ProductImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ProductImageUploadResponse>(`${BASE_URL}/UploadImage`, formData, {
      params: { id },
    });
  }

  createVariant(productId: number, data: VariantRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${BASE_URL}/CreateVariant`, data, {
      params: { id: productId },
    });
  }

  updateVariant(variantId: number, data: VariantRequest): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${BASE_URL}/UpdateVariant`, data, {
      params: { id: variantId },
    });
  }

  deleteVariant(variantId: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/DeleteVariant`, { params: { id: variantId } });
  }
}
