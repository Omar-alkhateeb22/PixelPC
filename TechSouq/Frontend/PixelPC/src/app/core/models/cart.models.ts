export interface CartItem {
  id: number;
  productName: string;
  stockKeepingUnit: string;
  price: number;
  quantity: number;
}

export interface Cart {
  createdAt: string;
  items: CartItem[];
}

export interface AddCartItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
