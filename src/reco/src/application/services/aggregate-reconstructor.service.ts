import { AggregateReconstructor as AggregateReconstructorInterface } from '../../domain';
import {
  BaseAggregate,
  EventStoreService,
} from 'com.chargoon.cloud.svc.common';

export class AggregateReconstructor<T extends BaseAggregate>
  implements AggregateReconstructorInterface<T>
{
  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly aggregateName: string,
    private readonly aggregateRoot: new () => T,
    private readonly eventTransformers: Record<string, (event: any) => any>,
  ) {}

  async reconstruct(id: string): Promise<T> {
    const streamName = `${this.aggregateName}-${id}`;
    console.log('Reconstructing aggregate from stream:', streamName);

    const aggregate = new this.aggregateRoot();

    try {
      const eventStream =
        await this.eventStoreService.readStreamFromStart(streamName);

      let eventCount = 0;
      for await (const event of eventStream) {
        if (!event || event.eventType?.startsWith('$')) {
          continue;
        }

        if (this.eventTransformers[event.eventType]) {
          const transformedEvent =
            this.eventTransformers[event.eventType](event);
          aggregate.apply(transformedEvent);
          eventCount++;
        } else {
          console.warn(
            `No transformer found for event type: ${event.eventType}`,
          );
        }
      }

      console.log(`${eventCount} events loaded from ${streamName}`);

      if (eventCount === 0) {
        throw new Error(
          `Aggregate with id ${id} not found (or stream is empty).`,
        );
      }
    } catch (error) {
      console.error(`Error reading stream ${streamName}: ${error.message}`);

      if (error.message?.includes('Stream not found')) {
        throw new Error(
          `Aggregate with id ${id} not found (stream does not exist).`,
        );
      }

      throw error;
    }

    return aggregate;
  }
}
