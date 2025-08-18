export class ProductNotFoundException extends Error {
  constructor(productId: string) {
    super(`Product with ID '${productId}' was not found.`);
  }
}
