export type MovementType = 'In' | 'Out';

export interface StockMovement {
  id: number;
  productVariantId: number;
  stockKeepingUnit: string;
  orderId: number | null;
  movementType: MovementType;
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface StockMovementFilters {
  productVariantId?: number;
  orderId?: number;
}

export interface StockAdjustRequest {
  productVariantId: number;
  movementType: MovementType;
  quantity: number;
  reason: string;
}
