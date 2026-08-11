export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled';

export interface OrderItem {
  id: number;
  productVariantId: number;
  stockKeepingUnit: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderSummary {
  id: number;
  userId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}
