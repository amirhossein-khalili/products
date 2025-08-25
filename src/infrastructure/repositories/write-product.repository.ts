import { Injectable, Logger } from '@nestjs/common';
import {
  EventStoreService,
  IMetadata,
  rehydrateAndMakeSnapshotIfPossible,
  InjectRedis,
} from 'com.chargoon.cloud.svc.common';
import Redis from 'ioredis';
import { ProductSnapshotCreated } from '../../domain/events';
import { IProductWriteRepository } from 'src/domain/repositories/write-product.irepository';
import { Product } from 'src/domain/entities/product.aggregate-root';

@Injectable()
export class ProductWriteRepository implements IProductWriteRepository {
  constructor(
    private eventStore: EventStoreService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  protected readonly logger = new Logger(ProductWriteRepository.name);

  public save(product: Product): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public findOneById(id: string, meta?: IMetadata): Promise<Product | null> {
    const product = new Product();

    return rehydrateAndMakeSnapshotIfPossible(
      product,
      'corr_products',
      this.eventStore,
      this.redis,
      id,
      ProductSnapshotCreated,
      this.logger,
      meta,
      true,
    ) as Promise<Product>;
  }

  public delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
