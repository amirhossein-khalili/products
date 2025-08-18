import { IMetadata } from 'com.chargoon.cloud.svc.common';
import { Product } from '../entities/product.aggregate-root';

export interface IProductWriteRepository {
  save(product: Product): Promise<void>;
  findOneById(id: string, meta?: IMetadata): Promise<Product | null>;
  delete(id: string): Promise<void>;
}
