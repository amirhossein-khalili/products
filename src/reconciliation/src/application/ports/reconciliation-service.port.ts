import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';

/**
 * Defines the port for the reconciliation service.
 * This interface is used by the application layer to interact with the reconciliation service.
 */
export interface ReconciliationServicePort {
  /**
   * Gets the list of fields that can be compared.
   */
  getComparableFields(): string[];

  /**
   * Checks a single entity by its ID.
   * @param id The ID of the entity to check.
   * @param fields The fields to compare. If not provided, all comparable fields are used.
   */
  checkSingleId(
    id: string,
    fields?: string[],
  ): Promise<{
    id: string;
    expectedState: any;
    actualState: any;
    comparison: ComparisonResult;
  }>;

  /**
   * Reconciles a single entity by its ID.
   * @param id The ID of the entity to reconcile.
   * @param fields The fields to reconcile. If not provided, all comparable fields are used.
   */
  reconcileById(id: string, fields?: string[]): Promise<any>;

  /**
   * Checks a batch of entities by their IDs.
   * @param ids The IDs of the entities to check.
   * @param fields The fields to compare. If not provided, all comparable fields are used.
   */
  checkBatchIds(ids: string[], fields?: string[]): Promise<any[]>;

  /**
   * Reconciles a batch of entities by their IDs.
   * @param ids The IDs of the entities to reconcile.
   * @param fields The fields to reconcile. If not provided, all comparable fields are used.
   */
  reconcileBatchByIds(ids: string[], fields?: string[]): Promise<any[]>;

  /**
   * Checks all entities that match the given filters.
   * @param filters The filters to apply.
   * @param fields The fields to compare. If not provided, all comparable fields are used.
   */
  checkAll(filters?: Record<string, any>, fields?: string[]): Promise<any[]>;

  /**
   * Reconciles all entities that match the given filters.
   * @param filters The filters to apply.
   * @param fields The fields to reconcile. If not provided, all comparable fields are used.
   */
  reconcileAll(
    filters?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]>;
}
