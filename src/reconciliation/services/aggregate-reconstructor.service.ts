import { Injectable, Logger } from '@nestjs/common';
import {
  BaseAggregate,
  EventStoreService,
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
   * @param streamId The aggregate ID.
   * @param aggregateName The unique name of the aggregate as registered in ConfigRegistry.
   * @param meta Optional metadata for event sourcing.
   * @returns The reconstructed aggregate instance.
   */
  async reconstruct<T extends BaseAggregate>(
    streamId: string,
    aggregateName: string,
    meta?: IMetadata,
  ): Promise<T> {
    const aggregateConfig = this.configRegistry.getConfig(aggregateName);

    if (!aggregateConfig) {
      throw new Error(
        `Configuration for aggregate "${aggregateName}" not found.`,
      );
    }
    const rehydratedAggregate = new aggregateConfig.aggregateClass();

    await this.rehydrate(
      streamId,
      rehydratedAggregate,
      aggregateConfig.transformers,
    );

    return rehydratedAggregate as T;
  }

  async rehydrate(streamId: string, model: BaseAggregate, transformers: any) {
    console.log('inja 6');
    console.log(
      await this.eventStoreService.readStreamFromStart(streamId).next(),
    );
    for await (const convertedEvent of this.eventStoreService.readStreamFromStart(
      streamId,
    )) {
      console.log('inja 5');

      if (convertedEvent.eventStreamId.startsWith('$')) {
        continue;
      }

      const transform = transformers[convertedEvent.eventType];

      if (transform) {
        const finalEvent = transform(convertedEvent);
        model.apply(finalEvent);
      }
    }
  }
}
