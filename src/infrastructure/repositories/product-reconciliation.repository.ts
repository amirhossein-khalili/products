import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenericMongooseRepository } from '../../reconciliation/persistance/generic-mongoose.repository'; // Adjust path
import { ProductDocument, ProductSchema } from '../schemas/product.schema'; // Adjust path
import { IReconciliationRepository } from '../../reconciliation/persistance/reconciliation-repository.interface'; // Adjust path

@Injectable()
export class ProductReconciliationRepository
  extends GenericMongooseRepository<ProductDocument>
  implements IReconciliationRepository<ProductDocument>
{
  constructor(
    @InjectModel(ProductSchema.name, 'read_db')
    private readonly productModel: Model<ProductDocument>,
  ) {
    super(productModel);
  }

}
