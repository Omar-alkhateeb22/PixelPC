export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled';

export interface OrderItem {
  // GetOrderById's item projection never actually selects these two —
  // don't rely on them being present.
  id?: number;
  productVariantId?: number;
  stockKeepingUnit: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderSummary {
  id: number;
  // Only GetAllOrders (admin) returns this; GetMyOrders (customer) omits it.
  userId?: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}

export interface CheckoutRequest {
  shippingAddress: string;
}

export interface CheckoutResponse {
  message: string;
  orderId: number;
  invoiceNumber: string;
  totalAmount: number;
}
