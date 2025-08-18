import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PriceSchema } from './price.schema';

export type ProductDocument = ProductSchema & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
})
export class ProductSchema {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  name: string;

  @Prop({ type: PriceSchema, required: true, id: false })
  price: PriceSchema;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: String })
  status: string;
}

export const ProductSchemaFactory = SchemaFactory.createForClass(ProductSchema);
