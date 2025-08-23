import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AggregateReconstructor } from './services/aggregate-reconstructor.service';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { ProductRecoRepository } from './repo/products/product-reco.repository';
import { StateComparator } from './services/state-comparator.service';
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

  public async checkSingleId(id: string) {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);

    const expectedState = toComparableState(aggregate);

    const actualState = await this.readRepository.findById(id);

    const comparison = this.stateComparator.compare(expectedState, actualState);

    return { id, expectedState, actualState, comparison };
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

  /**
   * Checks a batch of products for discrepancies between the write and read models.
   * @param ids An array of product IDs to check.
   * @returns A promise that resolves to an array of comparison results.
   */
  public async checkBatchIds(ids: string[]) {
    // Use Promise.all to run checks concurrently for better performance.
    // If a single check fails, it won't stop the others.
    const results = await Promise.all(
      ids.map((id) =>
        this.checkSingleId(id).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
    return results;
  }

  /**
   * Reconciles a batch of products' states by updating the read models
   * to match the state derived from the event store.
   * @param ids An array of product IDs to reconcile.
   * @returns A promise that resolves to an array of the updated documents or errors.
   */
  public async reconcileBatchByIds(ids: string[]): Promise<any[]> {
    // Use Promise.all to run reconciliations concurrently.
    const results = await Promise.all(
      ids.map((id) =>
        this.reconcileById(id).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
    return results;
  }

  /**
   * Checks all products for discrepancies by fetching all IDs from the read model.
   * @returns A promise that resolves to an array of comparison results for all entities.
   */
  public async checkAll() {
    const allIds = await this.readRepository.getAllIds();
    return this.checkBatchIds(allIds);
  }

  /**
   * Reconciles all products by fetching all IDs from the read model.
   * @returns A promise that resolves to an array of updated documents or errors for all entities.
   */
  public async reconcileAll() {
    const allIds = await this.readRepository.getAllIds();
    return this.reconcileBatchByIds(allIds);
  }
}
