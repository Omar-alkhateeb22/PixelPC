export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
}

export interface ProductRequest {
  name: string;
  brand: string;
  description: string;
  categoryId: number;
  imageUrl?: string;
}

export interface ProductFilters {
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  stockKeepingUnit: string;
  attributesJson: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
}

export interface VariantOption {
  id: number;
  label: string;
  productName: string;
  stockKeepingUnit: string;
}

export interface VariantRequest {
  stockKeepingUnit: string;
  attributesJson: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
}

export interface ProductImageUploadResponse {
  imageUrl: string;
}
