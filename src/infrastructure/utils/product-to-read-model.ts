import { ProductReadModelDto } from 'src/domain/dtos';
import { ProductDocument } from '../schemas/product.schema';

export const productToReadModel = (
  doc: ProductDocument,
): Omit<ProductReadModelDto, 'status'> => {
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    stock: doc.stock,
    price: {
      amount: doc.price.amount,
      currency: doc.price.currency,
    },
  };
};
