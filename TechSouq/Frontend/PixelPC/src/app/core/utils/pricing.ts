import { ProductVariant } from '../models/product.models';

export function getStartingPrice(variants: ProductVariant[]): number | null {
  if (variants.length === 0) {
    return null;
  }

  return Math.min(...variants.map((variant) => variant.price));
}
