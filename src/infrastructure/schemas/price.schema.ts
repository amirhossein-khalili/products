import { Prop } from '@nestjs/mongoose';

export class PriceSchema {
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  currency: string;
}
