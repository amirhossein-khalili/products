import { Injectable, Type, Logger } from '@nestjs/common';
import {
  BaseAggregate,
  EventStoreService,
  rehydrateAndMakeSnapshotIfPossible,
  IMetadata,
  InjectRedis,
} from 'com.chargoon.cloud.svc.common';
import { Redis } from 'ioredis';
import { ConfigRegistry } from '../config';

@Injectable()
export class AggregateReconstructor {
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly configRegistry: ConfigRegistry,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Reconstructs an aggregate from its events.
   * @param id The aggregate ID.
   * @param aggregateName The unique name of the aggregate as registered in ConfigRegistry.
   * @param meta Optional metadata for event sourcing.
   * @returns The reconstructed aggregate instance.
   */
  async reconstruct<T extends BaseAggregate>(
    id: string,
    aggregateName: string,
    meta?: IMetadata,
  ): Promise<T> {
    const aggregateConfig = this.configRegistry.getConfig(aggregateName);
    if (!aggregateConfig) {
      throw new Error(
        `Configuration for aggregate "${aggregateName}" not found.`,
      );
    }

    const aggregate = new aggregateConfig.aggregateClass() as T;

    // TODO: The snapshot event needs to be dynamically retrieved or configured.
    // For now, let's assume it's null or handled inside the function.
    // A better approach is to add `snapshotEvent` to the AggregateConfig.
    const SnapshotEvent = null;

    const rehydratedAggregate = await rehydrateAndMakeSnapshotIfPossible(
      aggregate,
      aggregateName,
      this.eventStoreService,
      this.redis,
      id,
      SnapshotEvent,
      this.logger,
      meta,
      { skipSnapshot: true },
    );

    return rehydratedAggregate as T;
  }
}
