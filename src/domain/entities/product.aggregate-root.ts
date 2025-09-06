import {
  BaseAggregate,
  DuplicateIdException,
  IMetadata,
} from 'com.chargoon.cloud.svc.common';
import { Logger } from '@nestjs/common';
import { CreateProductDto, FinilizeCreateProductDto } from '../dtos';
import { ProductCreatedEvent, CreateProductInitilizedEvent } from '../events';

/**
 * Represents a parsed product snapshot.
 */
export type ParsedProductSnapshot = Partial<BaseAggregate> & {
  id: string;
  versionHistory: Record<number, IMetadata>;
  numberOfEvents: number;
};

/**
 * Represents a Product aggregate root.
 *
 * This class is responsible for managing the state of a product and applying business rules.
 */
export class Product extends BaseAggregate {
  protected readonly logger = new Logger(Product.name);

  public override id: string;
  public name: string;
  public price: number;
  public stock: number = 0;
  public status: string;

  constructor() {
    super();
  }

  /**
   * Initializes the creation of a new product.
   *
   * @param data - The data for creating the product.
   * @param meta - The metadata associated with the creation.
   * @throws {DuplicateIdException} If the product ID already exists.
   */
  public create(data: CreateProductDto, meta: IMetadata) {
    this.logger.verbose('Product:create');

    if (this.id) {
      throw new DuplicateIdException(this.id);
    }

    this.apply(
      new CreateProductInitilizedEvent(
        { ...data, status: 'pending' },
        this.getVersionedMeta(meta),
      ),
    );
  }

  /**
   * Finalizes the creation of a product.
   *
   * @param data - The data for finalizing the product creation.
   * @param meta - The metadata associated with the finalization.
   */
  public finalizeCreate(data: FinilizeCreateProductDto, meta: IMetadata) {
    this.logger.verbose('products:finalizeCreate');
    try {
      this.apply(
        new ProductCreatedEvent(
          { ...data, status: 'finalize' },
          this.getVersionedMeta(meta),
        ),
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Handles the `CreateProductInitilizedEvent`.
   *
   * @param event - The `CreateProductInitilizedEvent` instance.
   */
  private onCreateProductInitilizedEvent(event: CreateProductInitilizedEvent) {
    const { data } = event;
    this.id = data.id;
    this.name = data.name;
    this.price = data.price;
    this.stock = data.stock;
    this.status = data.status;
  }

  private onProductCreatedEvent(event: ProductCreatedEvent) {
    this.id = event.data.id;
    this.status = event.data.status;
  }

  // =============================================================================
  //                                 Sncapshot
  // =============================================================================
  override applySnapshot(snapshot: ParsedProductSnapshot): void {
    throw new Error('Method not implemented.');
  }

  public static rehydrate(plainData: {
    id: string;
    name: string;
    price: number;
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
}
