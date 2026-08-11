import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { OrderService } from '../../../core/services/order-service';
import { Order, OrderStatus, OrderSummary } from '../../../core/models/order.models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'قيد الانتظار',
  Confirmed: 'تم التأكيد',
  Shipped: 'تم الشحن',
  Cancelled: 'ملغي',
};

@Component({
  selector: 'app-orders',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);

  readonly orders = signal<OrderSummary[]>([]);
  readonly loadingList = signal(true);
  readonly loadingDetail = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedOrder = signal<Order | null>(null);
  readonly isSavingStatus = signal(false);
  readonly statusSaved = signal(false);

  readonly statusForm = this.fb.nonNullable.group({
    status: this.fb.nonNullable.control<OrderStatus>('Pending', Validators.required),
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  loadOrders(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);

    this.orderService.getAll().subscribe({
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

  selectOrder(summary: OrderSummary): void {
    this.loadingDetail.set(true);
    this.errorMessage.set(null);
    this.statusSaved.set(false);
    this.selectedOrder.set(null);

    this.orderService.getById(summary.id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.statusForm.setValue({ status: order.status });
        this.loadingDetail.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loadingDetail.set(false);
      },
    });
  }

  closeDetail(): void {
    this.selectedOrder.set(null);
  }

  saveStatus(): void {
    const order = this.selectedOrder();
    if (!order || this.statusForm.invalid) {
      return;
    }

    this.isSavingStatus.set(true);
    this.errorMessage.set(null);
    this.statusSaved.set(false);

    const status = this.statusForm.getRawValue().status;

    this.orderService.updateStatus(order.id, status).subscribe({
      next: () => {
        this.isSavingStatus.set(false);
        this.statusSaved.set(true);
        this.selectedOrder.set({ ...order, status });
        this.orders.update((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingStatus.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
}
