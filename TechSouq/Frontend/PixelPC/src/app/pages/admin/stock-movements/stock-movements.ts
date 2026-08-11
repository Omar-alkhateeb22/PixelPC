import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { StockMovementService } from '../../../core/services/stock-movement-service';
import { StockMovement } from '../../../core/models/stock-movement.models';
import { ProductService } from '../../../core/services/product-service';
import { VariantOption } from '../../../core/models/product.models';
import { VariantSelect } from './variant-select/variant-select';

@Component({
  selector: 'app-stock-movements',
  imports: [ReactiveFormsModule, DatePipe, VariantSelect],
  templateUrl: './stock-movements.html',
  styleUrl: './stock-movements.css',
})
export class StockMovements implements OnInit {
  private readonly stockMovementService = inject(StockMovementService);
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  readonly movements = signal<StockMovement[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly variantOptions = signal<VariantOption[]>([]);
  readonly variantsLoading = signal(true);

  readonly filterForm = this.fb.group({
    productVariantId: this.fb.control<number | null>(null),
    orderId: this.fb.control<number | null>(null),
  });

  readonly adjustForm = this.fb.group({
    productVariantId: this.fb.control<number | null>(null, Validators.required),
    movementType: this.fb.nonNullable.control<'In' | 'Out'>('In', Validators.required),
    quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    reason: this.fb.nonNullable.control('', Validators.required),
  });

  ngOnInit(): void {
    this.load();
    this.loadVariantOptions();
  }

  private loadVariantOptions(): void {
    this.variantsLoading.set(true);
    this.productService.getAllVariants().subscribe({
      next: (options) => {
        this.variantOptions.set(options);
        this.variantsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.variantsLoading.set(false);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const raw = this.filterForm.getRawValue();
    const filters = {
      productVariantId: raw.productVariantId ?? undefined,
      orderId: raw.orderId ?? undefined,
    };

    this.stockMovementService.getAll(filters).subscribe({
      next: (movements) => {
        this.movements.set(movements);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ productVariantId: null, orderId: null });
    this.load();
  }

  submitAdjust(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.adjustForm.getRawValue();
    const data = {
      productVariantId: raw.productVariantId!,
      movementType: raw.movementType,
      quantity: raw.quantity,
      reason: raw.reason,
    };

    this.stockMovementService.adjust(data).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.adjustForm.reset({ productVariantId: null, movementType: 'In', quantity: 1, reason: '' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
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
