import { Provider, Type } from '@nestjs/common';
import { BaseAggregate } from 'com.chargoon.cloud.svc.common';

export class AggregateConfig {
  constructor(
    public readonly aggregateModule: any,
    public readonly aggregateClass: Type<BaseAggregate>,
    public readonly transformers: any,
    // public readonly schemaClass: Type<any>,
    public readonly readRepositoryToken: any,
    /**
     * A transformer function that takes an aggregate instance
     * and returns a plain object for comparison.
     * This is the key to our non-invasive solution.
     */
    public readonly toComparableState: (
      aggregate: BaseAggregate,
    ) => Record<string, any>,
  ) {}
}
