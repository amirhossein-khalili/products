import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Document } from 'mongoose';
import { IMetadata } from 'com.chargoon.cloud.svc.common';
import { pick } from 'lodash';
import { ReconciliationRepository } from './repositories/reconciliation.repository';
import { IWriteRepository } from './repositories/write-repository.interface';
import { AggregateReconstructor } from './services/aggregate-reconstructor.service';
import { StateComparator } from './services/state-comparator.service';

function createMock<T extends object>(): T {
  return new Proxy({} as T, {
    get(target, prop) {
      return `mock_${String(prop)}`;
    },
  });
}

@Injectable()
export class RecoService<T extends Document> {
  constructor(
    @Inject()
    private readonly aggregateReconstructor: AggregateReconstructor<T>,
    private readonly stateComparator: StateComparator,
    private readonly readRepository: ReconciliationRepository<T>,
    // @Inject('WRITE_REPOSITORY')
    // private readonly writeRepository: IWriteRepository<T>,
    @Inject('TO_COMPARABLE_STATE')
    private readonly toComparableState: (aggregate: any) => any,
  ) {}

  /**
   * Returns the list of fields available for comparison.
   * @returns An array of field names.
   */
  public getComparableFields(): string[] {
    const genericMock = createMock();
    const fields = Object.keys(this.toComparableState(genericMock as any));
    return fields;
  }

  /**
   * Checks a single aggregate ID for discrepancies, with optional field selection.
   * @param id The ID of the aggregate to check.
   * @param fields Optional array of field names to compare. If not provided, all fields are compared.
   * @returns A detailed comparison result.
   */
  public async checkSingleId(id: string, fields?: string[]) {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    const fullExpectedState = this.toComparableState(aggregate);
    const fullActualState = await this.readRepository.findById(id);

    // Determine which fields to check
    const fieldsToCheck =
      fields && fields.length > 0 ? fields : Object.keys(fullExpectedState);

    // Pick only the specified fields for comparison
    const expectedState = pick(fullExpectedState, fieldsToCheck);
    const actualState = pick(fullActualState, fieldsToCheck);

    const comparison = this.stateComparator.compare(expectedState, actualState);

    // The 'fieldsChecked' property has been removed from the response as requested.
    return { id, expectedState, actualState, comparison };
  }

  /**
   * Reconciles a single aggregate's state, with optional partial updates.
   * @param id The ID of the aggregate to reconcile.
   * @param fields Optional array of field names to fix. If not provided, the entire document is updated.
   * @returns The updated document from the read database.
   */
  public async reconcileById(id: string, fields?: string[]): Promise<T> {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);
    if (!aggregate) {
      throw new NotFoundException(
        `Aggregate with ID ${id} could not be reconstructed.`,
      );
    }

    const fullExpectedState = this.toComparableState(aggregate);

    const updateData =
      fields && fields.length > 0
        ? pick(fullExpectedState, fields)
        : fullExpectedState;

    const updatedDocument = await this.readRepository.findByIdAndUpdate(
      id,
      updateData,
    );

    if (!updatedDocument) {
      throw new NotFoundException(
        `aggregate with ID ${id} not found in the read database for update.`,
      );
    }

    return updatedDocument;
  }

  /**
   * Checks a batch of products for discrepancies, with optional field selection.
   * @param ids An array of product IDs to check.
   * @param fields Optional array of field names to compare.
   * @returns A promise that resolves to an array of comparison results.
   */
  public async checkBatchIds(ids: string[], fields?: string[]) {
    const results = await Promise.all(
      ids.map((id) =>
        this.checkSingleId(id, fields).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
    return results;
  }

  /**
   * Reconciles a batch of products' states, with optional partial updates.
   * @param ids An array of product IDs to reconcile.
   * @param fields Optional array of field names to fix.
   * @returns A promise that resolves to an array of the updated documents or errors.
   */
  public async reconcileBatchByIds(
    ids: string[],
    fields?: string[],
  ): Promise<any[]> {
    const results = await Promise.all(
      ids.map((id) =>
        this.reconcileById(id, fields).catch((error) => ({
          id,
          error: error.message,
        })),
      ),
    );
    return results;
  }

  /**
   * Checks products for discrepancies, with optional filters and field selection.
   * @param filters An optional MongoDB query object to filter which documents to check.
   * @param fields Optional array of field names to compare.
   * @returns A promise that resolves to an array of comparison results.
   */
  public async checkAll(filters?: Record<string, any>, fields?: string[]) {
    const ids =
      filters && Object.keys(filters).length > 0
        ? await this.readRepository.getIdsByFilter(filters)
        : await this.readRepository.getAllIds();
    return this.checkBatchIds(ids, fields);
  }

  /**
   * Reconciles products, with optional filters and field selection.
   * @param filters An optional MongoDB query object to filter which documents to reconcile.
   * @param fields Optional array of field names to fix.
   * @returns A promise that resolves to an array of updated documents or errors.
   */
  public async reconcileAll(filters?: Record<string, any>, fields?: string[]) {
    const ids =
      filters && Object.keys(filters).length > 0
        ? await this.readRepository.getIdsByFilter(filters)
        : await this.readRepository.getAllIds();
    return this.reconcileBatchByIds(ids, fields);
  }
}
