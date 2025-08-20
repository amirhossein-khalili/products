import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BaseAggregate } from 'com.chargoon.cloud.svc.common';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { PRODUCT_WRITE_REPOSITORY } from 'src/domain/repositories/injection-tokens';
import { ProductWriteRepository } from 'src/infrastructure/repositories/write-product.repository';

@Injectable()
export class AggregateReconstructor {
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    @Inject(PRODUCT_WRITE_REPOSITORY)
    private readonly productWriteRepository: ProductWriteRepository,
  ) {}

  /**
   * Reconstructs an aggregate from its events.
   * @param streamId The aggregate ID.
   * @param aggregateName The unique name of the aggregate as registered in ConfigRegistry.
   * @param meta Optional metadata for event sourcing.
   * @returns The reconstructed aggregate instance.
   */
  // async reconstruct<T extends BaseAggregate>(streamId: string): Promise<T> {
  async reconstruct(streamId: string): Promise<Product> {
    const product = await this.productWriteRepository.findOneById(streamId);

    if (!product) {
      this.logger.warn(`Aggregate with streamId: ${streamId} not found.`);
      throw new NotFoundException(`Product with id ${streamId} not found.`);
    }

    return product;
  }
}


           

