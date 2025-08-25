import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductSchema, ProductDocument } from '../schemas/product.schema';
import { productToReadModel } from '../utils/product-to-read-model';
import { IProductReadRepository } from 'src/domain/repositories/read-product.irepository';
import { PaginationParamsDto, ProductReadModelDto } from 'src/domain/dtos';

@Injectable()
export class ProductReadRepository implements IProductReadRepository {
  constructor(
    @InjectModel(ProductSchema.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findById(
    id: string,
  ): Promise<Omit<ProductReadModelDto, 'status'> | null> {
    const productDoc = await this.productModel.findById(id).exec();
    return productToReadModel(productDoc);
  }

  async findAll(
    params: PaginationParamsDto,
  ): Promise<Omit<ProductReadModelDto, 'status'>[]> {
    const productDocs = await this.productModel
      .find()
      .limit(params.limit)
      .skip((params.page - 1) * params.limit)
      .exec();
    return productDocs.map(productToReadModel);
  }

  async findByName(
    name: string,
  ): Promise<Omit<ProductReadModelDto, 'status'> | null> {
    const productDoc = await this.productModel.findOne({ name }).exec();
    return productToReadModel(productDoc);
  }

  async search(name: string): Promise<Omit<ProductReadModelDto, 'status'>[]> {
    const productDocs = await this.productModel
      .find({ name: { $regex: name, $options: 'i' } })
      .exec();
    return productDocs.map(productToReadModel);
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async save(product: Partial<ProductReadModelDto>): Promise<void> {
    const { id, ...dataToUpdate } = product;
    await this.productModel.findOneAndUpdate(
      { _id: id },
      { $set: dataToUpdate },
      { upsert: true, new: true },
    );
  }

  async getAllIds(): Promise<string[]> {
    const products = await this.productModel.find({}, 'id').exec();
    return products.map((p) => p.id);
  }
}
