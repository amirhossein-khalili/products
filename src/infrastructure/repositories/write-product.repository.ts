import { Injectable, Logger } from '@nestjs/common';
import {
  EventStoreService,
  rehydrateAndMakeSnapshotIfPossible,
  InjectRedis,
} from 'com.chargoon.cloud.svc.common';
import Redis from 'ioredis';
import { ProductSnapshotCreated } from '../../domain/events';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { WriteRepository } from 'src/reco/src/domain';

@Injectable()
export class ProductWriteRepository implements WriteRepository<Product> {
  constructor(
    private eventStore: EventStoreService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  protected readonly logger = new Logger(ProductWriteRepository.name);

  public save(product: Product): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public findOneById(
    id: string,
    eventTransformers: Record<string, (event: any) => any>,
  ): Promise<Product | null> {
    const product = new Product();

    return rehydrateAndMakeSnapshotIfPossible(
      product,
      'corr_products',
      this.eventStore,
      this.redis,
      id,
      ProductSnapshotCreated,
      this.logger,
      null, // meta
      true,
      eventTransformers,
    ) as Promise<Product>;
  }

  public delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
