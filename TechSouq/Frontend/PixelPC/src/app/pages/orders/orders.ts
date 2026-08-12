import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { OrderService } from '../../core/services/order-service';
import { Order, OrderStatus, OrderSummary } from '../../core/models/order.models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'قيد الانتظار',
  Confirmed: 'تم التأكيد',
  Shipped: 'تم الشحن',
  Cancelled: 'ملغي',
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  Pending: 'text-bg-warning',
  Confirmed: 'text-bg-info',
  Shipped: 'text-bg-primary',
  Cancelled: 'text-bg-danger',
};

@Component({
  selector: 'app-orders',
  imports: [DatePipe, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly orders = signal<OrderSummary[]>([]);
  readonly loadingList = signal(true);
  readonly loadingDetail = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly expandedOrderId = signal<number | null>(null);
  readonly expandedOrder = signal<Order | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  statusBadgeClass(status: OrderStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  loadOrders(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loadingList.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loadingList.set(false);
      },
    });
  }

  toggleOrder(order: OrderSummary): void {
    if (this.expandedOrderId() === order.id) {
      this.expandedOrderId.set(null);
      this.expandedOrder.set(null);
      return;
    }

    this.expandedOrderId.set(order.id);
    this.expandedOrder.set(null);
    this.loadingDetail.set(true);
    this.errorMessage.set(null);

    this.orderService.getById(order.id).subscribe({
      next: (detail) => {
        this.expandedOrder.set(detail);
        this.loadingDetail.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loadingDetail.set(false);
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return String((err.error as { message: unknown }).message);
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
