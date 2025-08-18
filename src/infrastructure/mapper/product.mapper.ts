// apps/products/src/infrastructure/mapper/product.mapper.ts
import { Product } from '../../domain/entities/product.aggregate-root';
import { ProductDocument } from '../schemas/product.schema';
import { PriceVO } from '../../domain/value-objects/price.vo';

export class ProductMapper {
  public static toPersistence(product: Product): Partial<ProductDocument> {
    // The 'status' property was missing here.
    return {
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: {
        amount: product.price.amount,
        currency: product.price.currency,
      },
      status: product.status,
    };
  }

  public static toDomain(productDoc: ProductDocument): Product {
    const price = PriceVO.create(
      productDoc.price.amount,
      productDoc.price.currency,
    );

    // FIXED: Removed the incorrect line `const product = Product.rehydrate();`
    // The static rehydrate method should be called only once with the data object.
    return Product.rehydrate({
      id: productDoc.id.toString(),
      name: productDoc.name,
      price: price,
      stock: productDoc.stock,
      status: productDoc.status, // This line requires 'status' to exist on ProductDocument
    });
  }
}
