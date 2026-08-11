import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../models/auth.models';
import { decodeJwtPayload, extractRoleClaim } from '../utils/jwt';

const TOKEN_KEY = 'pixelpc_token';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly loggedIn = signal(this.hasToken());
  readonly isLoggedIn = this.loggedIn.asReadonly();

  private readonly roleSig = signal(this.decodeRole(this.getToken()));
  readonly role = this.roleSig.asReadonly();
  readonly isAdmin = computed(() => this.roleSig() === 'Admin');

  register(data: RegisterRequest): Observable<RegisterResponse> {
    // The backend's RegisterDto still requires a Role field ("Admin" | "Customer").
    // Public self-registration is always a Customer; this is never exposed in the UI.
    return this.http.post<RegisterResponse>(`${API_BASE_URL}/api/auth/register`, {
      ...data,
      role: 'Customer',
    });
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, data)
      .pipe(tap((response) => this.setToken(response.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.loggedIn.set(false);
    this.roleSig.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.loggedIn.set(true);
    this.roleSig.set(this.decodeRole(token));
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  private decodeRole(token: string | null): string | null {
    if (!token) {
      return null;
    }

    return extractRoleClaim(decodeJwtPayload(token));
  }
}
