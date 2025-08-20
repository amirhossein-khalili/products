import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AggregateReconstructor } from './reco/services/aggregate-reconstructor.service';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { ProductRecoRepository } from './reco/repo/products/product-reco.repository';
import { StateComparator } from './reco/services/state-comparator.service';
import { ProductDocument } from 'src/infrastructure/schemas/product.schema';

export function toComparableState(aggregate: Product) {
  return {
    _id: aggregate.id,
    name: aggregate.name,
    price: aggregate.price,
    stock: aggregate.stock,
    status: aggregate.status,
  };
}

@Injectable()
export class RecoService {
  constructor(
    @Inject() private readonly aggregateReconstructor: AggregateReconstructor,
    @Inject() private readonly readRepository: ProductRecoRepository,

    private readonly stateComparator: StateComparator,
  ) {}

  public async checkSingleId(id) {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);

    const expectedState = toComparableState(aggregate);

    const actualState = await this.readRepository.findById(id);

    const comparison = this.stateComparator.compare(expectedState, actualState);

    return { expectedState, actualState, comparison };
  }

  /**
   * Reconciles a single product's state by updating the read model
   * to match the state derived from the event store.
   * @param id The ID of the product to reconcile.
   * @returns The updated document from the read database.
   */
  public async reconcileById(id: string): Promise<ProductDocument> {
    // 1. Get the source of truth from the event store
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    if (!aggregate) {
      throw new NotFoundException(
        `Aggregate with ID ${id} could not be reconstructed.`,
      );
    }

    const expectedState = toComparableState(aggregate);

    // 2. Update the read model with the correct state
    // The 'findByIdAndUpdate' method needs to be implemented in ProductRecoRepository
    const updatedDocument = await this.readRepository.findByIdAndUpdate(
      id,
      expectedState,
    );

    if (!updatedDocument) {
      throw new NotFoundException(
        `Product with ID ${id} not found in the read database for update.`,
      );
    }

    return updatedDocument;
  }
}
