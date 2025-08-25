import { Injectable, Inject } from '@nestjs/common';
import { pick } from 'lodash';

import {
  AggregateReconstructor,
  StateComparator,
  ReadRepository,
  ComparisonResult,
} from '../../domain';
import { RecoServicePort } from '../ports/reco-service.port';
import { TO_COMPARABLE_STATE } from '../constants/tokens';

@Injectable()
export class RecoService implements RecoServicePort {
  constructor(
    private readonly aggregateReconstructor: AggregateReconstructor<any>,
    private readonly stateComparator: StateComparator,
    private readonly readRepository: ReadRepository<any>,
    @Inject(TO_COMPARABLE_STATE)
    private readonly toComparableState: (aggregate: any) => any,
  ) {}

  public getComparableFields(): string[] {
    const mockState = this.createMockState();
    return Object.keys(this.toComparableState(mockState));
  }

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
    const actualState = pick(fullActualState, fieldsToCheck);

    const comparison = this.stateComparator.compare(expectedState, actualState);

    return { id, expectedState, actualState, comparison };
  }

  public async reconcileById(id: string, fields?: string[]): Promise<any> {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    const fullExpectedState = this.toComparableState(aggregate);

    const updateData = fields?.length
      ? pick(fullExpectedState, fields)
      : fullExpectedState;

    return this.readRepository.findByIdAndUpdate(id, updateData);
  }

  public async checkBatchIds(ids: string[], fields?: string[]): Promise<any[]> {
    return Promise.all(
      ids.map((id) =>
        this.checkSingleId(id, fields).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
  }

  public async reconcileBatchByIds(
    ids: string[],
    fields?: string[],
  ): Promise<any[]> {
    return Promise.all(
      ids.map((id) =>
        this.reconcileById(id, fields).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
  }

  public async checkAll(
    filters?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]> {
    const ids = await this._getIds(filters);
    return this.checkBatchIds(ids, fields);
  }

  public async reconcileAll(
    filters?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]> {
    const ids = await this._getIds(filters);
    return this.reconcileBatchByIds(ids, fields);
  }

  /**
   * Fetches entity IDs, either all or based on a filter.
   * @param filters - Optional filters to apply.
   * @returns A promise that resolves to an array of entity IDs.
   */
  private async _getIds(filters?: Record<string, any>): Promise<string[]> {
    const hasFilters = filters && Object.keys(filters).length > 0;
    return hasFilters
      ? this.readRepository.getIdsByFilter(filters)
      : this.readRepository.getAllIds();
  }

  private createMockState(): any {
    return new Proxy(
      {},
      {
        get: (target, prop) => `mock_${String(prop)}`,
      },
    );
  }
}
