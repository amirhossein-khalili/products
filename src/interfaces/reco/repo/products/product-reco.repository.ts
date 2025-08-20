import { BaseReconciliationRepository } from '../base-reconciliation.repository';
import { InjectModel } from '@nestjs/mongoose';
import {
  ProductDocument,
  ProductSchema,
} from 'src/infrastructure/schemas/product.schema';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductRecoRepository extends BaseReconciliationRepository<ProductDocument> {
  constructor(
    @InjectModel(ProductSchema.name, 'read_db')
    productModel: Model<ProductDocument>,
  ) {
    super(productModel);
  }
}
