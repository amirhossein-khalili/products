import { Injectable, Inject } from '@nestjs/common';
import { pick } from 'lodash';

import {
  AggregateReconstructor,
  StateComparator,
  ReadRepository,
  ComparisonResult,
  Discrepancy,
} from '../../domain';
import { RecoServicePort } from '../ports/reco-service.port';
import { TO_COMPARABLE_STATE } from '../constants/tokens';

@Injectable()
export class RecoService implements RecoServicePort {
  /**
   * Creates an instance of the RecoService.
   * @param aggregateReconstructor The aggregate reconstructor service.
   * @param stateComparator The state comparator service.
   * @param readRepository The read repository.
   * @param toComparableState A function that converts an aggregate to a comparable state.
   */
  constructor(
    private readonly aggregateReconstructor: AggregateReconstructor<any>,
    private readonly stateComparator: StateComparator,
    private readonly readRepository: ReadRepository<any>,
    @Inject(TO_COMPARABLE_STATE)
    private readonly toComparableState: (aggregate: any) => any,
  ) {}

  /**
   * Gets the comparable fields of the reconciliation module.
   * @returns An array of comparable fields.
   */
  public getComparableFields(): string[] {
    const mockState = this.createMockState();
    return Object.keys(this.toComparableState(mockState));
  }

  /**
   * Checks a single entity.
   * @param id The ID of the entity to check.
   * @param fields The fields to check. If not provided, all fields will be checked.
   * @returns The result of the check.
   */
  public async checkSingleId(
    id: string,
    fields?: string[],
  ): Promise<{
    id: string;
    expectedState: any;
    actualState: any;
    comparison: ComparisonResult;
  }> {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    const fullExpectedState = this.toComparableState(aggregate);
    const fullActualState = await this.readRepository.findById(id);

    const fieldsToCheck = fields?.length
      ? fields
      : Object.keys(fullExpectedState);
    const expectedState = pick(fullExpectedState, fieldsToCheck);

    if (!fullActualState) {
      const discrepancy = Discrepancy.create(
        '_entity',
        'exists',
        'not found in read model',
      );
      const comparison = ComparisonResult.createMismatch(id, [discrepancy]);

      return {
        id,
        expectedState,
        actualState: null,
        comparison,
      };
    }

    const actualState = pick(fullActualState, fieldsToCheck);
    const comparison = this.stateComparator.compare(expectedState, actualState);

    return { id, expectedState, actualState, comparison };
  }

  /**
   * Fixes a single entity.
   * @param id The ID of the entity to fix.
   * @param fields The fields to fix. If not provided, all fields will be fixed.
   * @returns The result of the fix.
   */
  public async reconcileById(id: string, fields?: string[]): Promise<any> {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    const fullExpectedState = this.toComparableState(aggregate);

    const updateData = fields?.length
      ? pick(fullExpectedState, fields)
      : fullExpectedState;

    return this.readRepository.findByIdAndUpdate(id, updateData);
  }

  /**
   * Checks a batch of entities.
   * @param ids The IDs of the entities to check.
   * @param fields The fields to check. If not provided, all fields will be checked.
   * @returns The result of the check.
   */
  public async checkBatchIds(ids: string[], fields?: string[]): Promise<any[]> {
    const promises = ids.map((id) => this.checkSingleId(id, fields));
    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      const error = result.reason as Error;
      return {
        id: ids[index],
        error: error.message || 'An unknown error occurred',
      };
    });
  }

  /**
   * Fixes a batch of entities.
   * @param ids The IDs of the entities to fix.
   * @param fields The fields to fix. If not provided, all fields will be fixed.
   * @returns The result of the fix.
   */
  public async reconcileBatchByIds(
    ids: string[],
    fields?: string[],
  ): Promise<any[]> {
    const promises = ids.map((id) => this.reconcileById(id, fields));
    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      const error = result.reason as Error;
      return {
        id: ids[index],
        error: error.message || 'An unknown error occurred',
      };
    });
  }

  /**
   * Checks all entities.
   * @param filters The filters to apply.
   * @param fields The fields to check. If not provided, all fields will be checked.
   * @returns The result of the check.
   */
  public async checkAll(
    filters?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]> {
    const ids = await this._getIds(filters);
    return this.checkBatchIds(ids, fields);
  }

  /**
   * Fixes all entities.
   * @param filters The filters to apply.
   * @param fields The fields to fix. If not provided, all fields will be fixed.
   * @returns The result of the fix.
   */
  public async reconcileAll(
    filters?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]> {
    const ids = await this._getIds(filters);
    return this.reconcileBatchByIds(ids, fields);
  }

  private async _getIds(filters?: Record<string, any>): Promise<string[]> {
    const hasFilters = filters && Object.keys(filters).length > 0;
    return hasFilters
      ? this.readRepository.getIdsByFilter(filters)
      : this.readRepository.getAllIds();
  }

  /**
   * Creates a mock state object.
   * This is used to get the comparable fields of the reconciliation module.
   * The mock state object is a proxy that returns a mock value for any property that is accessed.
   * @returns A mock state object.
   */
  private createMockState(): any {
    return new Proxy(
      {},
      {
        get: (target, prop) => `mock_${String(prop)}`,
      },
    );
  }
}
