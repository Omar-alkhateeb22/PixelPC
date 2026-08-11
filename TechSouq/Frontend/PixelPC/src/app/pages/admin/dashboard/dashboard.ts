import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../core/services/category-service';
import { ProductService } from '../../../core/services/product-service';
import { StockMovementService } from '../../../core/services/stock-movement-service';
import { OrderService } from '../../../core/services/order-service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly orderService = inject(OrderService);

  readonly categoryCount = signal<number | null>(null);
  readonly productCount = signal<number | null>(null);
  readonly movementCount = signal<number | null>(null);
  readonly orderCount = signal<number | null>(null);

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (items) => this.categoryCount.set(items.length),
      error: () => this.categoryCount.set(null),
    });

    this.productService.getAll().subscribe({
      next: (items) => this.productCount.set(items.length),
      error: () => this.productCount.set(null),
    });

    this.stockMovementService.getAll().subscribe({
      next: (items) => this.movementCount.set(items.length),
      error: () => this.movementCount.set(null),
    });

    this.orderService.getAll().subscribe({
      next: (items) => this.orderCount.set(items.length),
      error: () => this.orderCount.set(null),
    });
  }
}
