import { PriceVO } from '../value-objects/price.vo';

export class ProductCreatedDto {
  public id: string;

  public name: string;

  public price: PriceVO;

  public stock: number = 0;

  public status: string;
}
