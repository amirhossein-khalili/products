export class ProductAlreadyExistsException extends Error {
  constructor(name: string) {
    super(`A product with the name '${name}' already exists.`);
    this.name = 'ProductAlreadyExistsException';
  }
}
