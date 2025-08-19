// apps/products/src/infrastructure/mapper/product.mapper.ts
import { Product } from '../../domain/entities/product.aggregate-root';
import { ProductDocument } from '../schemas/product.schema';
import { PriceVO } from '../../domain/value-objects/price.vo';

export class ProductMapper {
  public static toPersistence(product: Product): Partial<ProductDocument> {
    return {
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: product.price,
      status: product.status,
    };
  }

  public static toDomain(productDoc: ProductDocument): Product {
    return Product.rehydrate({
      id: productDoc.id.toString(),
      name: productDoc.name,
      price: productDoc.price,
      stock: productDoc.stock,
      status: productDoc.status,
    });
  }
}
