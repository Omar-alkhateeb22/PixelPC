import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Category, CategoryRequest } from '../models/category.models';

const BASE_URL = `${API_BASE_URL}/api/Categories`;

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${BASE_URL}/GetAllCategories`);
  }

  create(data: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${BASE_URL}/CreateCategory`, data);
  }

  update(id: number, data: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${BASE_URL}/UpdateCategory`, data, { params: { id } });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/DeleteCategory`, { params: { id } });
  }
}
