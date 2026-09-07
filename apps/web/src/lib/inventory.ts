import type { Product } from "@localito/shared";

export type PurchaseProposalLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
};

export function suggestedReplenishment(product: Product) {
  return Math.max(1, product.minimumStock * 2 - product.stock);
}
