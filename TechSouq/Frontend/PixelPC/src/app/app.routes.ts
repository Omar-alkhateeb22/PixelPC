import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { customerGuard } from './core/guards/customer-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products').then((m) => m.Products),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details').then((m) => m.ProductDetails),
  },
  {
    path: 'cart',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./layout/admin-nav/admin-nav').then((m) => m.AdminNav),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/products/products').then((m) => m.Products),
      },
      {
        path: 'stock-movements',
        loadComponent: () =>
          import('./pages/admin/stock-movements/stock-movements').then((m) => m.StockMovements),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/orders/orders').then((m) => m.Orders),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
