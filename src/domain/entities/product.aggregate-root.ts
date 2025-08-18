import { CreateProductFailed, ProductCreatedEvent } from '../events';
import { PriceVO } from '../value-objects/price.vo';
import {
  BaseAggregate,
  DuplicateIdException,
  IMetadata,
} from 'com.chargoon.cloud.svc.common';
import { Logger } from '@nestjs/common';
import { CreateProductDto } from '../dtos';

export type ParsedProductSnapshot = Partial<BaseAggregate> & {
  id: string;
  versionHistory: Record<number, IMetadata>;
  numberOfEvents: number;
};

export class Product extends BaseAggregate {
  protected readonly logger = new Logger(Product.name);

  public override id: string;

  public name: string;

  public price: PriceVO;

  public stock: number = 0;

  public status: string;

  constructor() {
    super();
  }

  // =============================================================================
  //                                 Factory methods
  // =============================================================================
  public create(data: CreateProductDto, meta: IMetadata) {
    let event;

    try {
      this.logger.verbose('Product:create');

      if (this.id) {
        throw new DuplicateIdException(this.id);
      }

      event = new ProductCreatedEvent(
        {
          id: data.id,
          name: data.name,
          price: data.price,
          stock: data.stock,
          status: 'created',
        },
        this.getVersionedMeta(meta),
      );
    } catch (error) {
      this.logger.warn(error);
      event = new CreateProductFailed(
        { id: this.id, error: error },
        this.getVersionedMeta(meta),
      );
    }

    this.apply(event);
  }

  public static rehydrate(plainData: {
    id: string;
    name: string;
    price: PriceVO;
    stock: number;
    status: string;
  }): Product {
    const product = new Product();
    product.id = plainData.id;
    product.name = plainData.name;
    product.price = plainData.price;
    product.stock = plainData.stock;
    product.status = plainData.status;
    return product;
  }

  // =============================================================================
  //                                 Event handlers
  // =============================================================================

  private onProductCreatedEvent(event: ProductCreatedEvent): void {
    this.logger.verbose('onProductCreatedEvent');

    this.id = event.data.id;
    this.name = event.data.name;
    this.price = event.data.price;
    this.stock = event.data.stock;

    this.versionHistory[event.meta.version] = event.meta;
  }

  // =============================================================================
  //                                 Sncapshot
  // =============================================================================
  override applySnapshot(snapshot: ParsedProductSnapshot): void {
    throw new Error('Method not implemented.');
  }
}
