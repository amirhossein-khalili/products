import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigRegistry, ReconciliationConfig } from '../config';
import { ReconciliationResult } from '../dtos';
import { AggregateReconstructor } from './aggregate-reconstructor.service';
import { StateComparator } from './state-comparator.service';
import { ReadRepository } from '../persistance/read-repository.interface';

/**
 * Service that performs reconciliation for a single ID.
 * Updated to return detailed ReconciliationResult.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reconstructor: AggregateReconstructor,
    private readonly comparator: StateComparator,
  ) {}

  /**
   * Reconcile a single ID based on config.
   * @param id The aggregate ID.
   * @param reconConfig The reconciliation config.
   * @returns ReconciliationResult.
   */
  async reconcileId(
    id: string,
    reconConfig: ReconciliationConfig,
  ): Promise<ReconciliationResult> {
    const startTime = Date.now();
    const aggregateConfig = this.moduleRef
      .get<ConfigRegistry>(ConfigRegistry)
      .getConfig(reconConfig.aggregateName);
    if (!aggregateConfig) {
      throw new Error(`No config for aggregate: ${reconConfig.aggregateName}`);
    }

    const readRepository = this.moduleRef.get<ReadRepository<any>>(
      aggregateConfig.readRepositoryToken,
      { strict: false },
    );

    const aggregate = await this.reconstructor.reconstruct(
      id,
      aggregateConfig.aggregateClass.name,
    );
    const expectedState = aggregateConfig.toComparableState(aggregate);

    const actualState = await readRepository.findById(id);

    const comparison = this.comparator.compare(expectedState, actualState);

    const result = new ReconciliationResult(
      id,
      new Date(),
      comparison.isMatch,
      comparison.discrepancies,
      Date.now() - startTime,
      reconConfig.aggregateName,
    );

    return result;
  }
}
