import { BaseAggregate } from 'com.chargoon.cloud.svc.common';

/**
 * Defines the contract for a repository used by the reconciliation process.
 * Any repository (generic or custom) must implement this interface.
 */
export interface IReconciliationRepository<T extends BaseAggregate> {
  /**
   * Finds a single aggregate instance by its ID.
   * @param id The ID of the aggregate.
   * @returns A promise that resolves to the aggregate instance or null if not found.
   */
  findById(id: string): Promise<T | null>;

  /**
   * Streams all aggregate IDs from the read source based on optional filters.
   * This is memory-efficient for large datasets.
   * @param filters Optional filters to apply to the query.
   * @returns An async generator that yields arrays of IDs.
   */
  streamIds(filters: Record<string, any>): AsyncGenerator<string[]>;
}
