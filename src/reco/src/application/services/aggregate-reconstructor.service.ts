import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { AggregateReconstructor as AggregateReconstructorInterface } from '../../domain/services/aggregate-reconstructor.interface';
import {
  BaseAggregate,
  EventStoreService,
} from 'com.chargoon.cloud.svc.common';
import { AGGREGATE_ROOT, EVENT_TRANSFORMERS } from '../constants/tokens';

@Injectable()
export class AggregateReconstructor<T extends BaseAggregate>
  implements AggregateReconstructorInterface<T>
{
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly aggregateName: string,
    @Inject(AGGREGATE_ROOT) private readonly aggregateRoot: Type<T>,
    @Inject(EVENT_TRANSFORMERS)
    private readonly eventTransformers: Record<string, (event: any) => any>,
  ) {}

  async reconstruct(id: string): Promise<T> {
    // Construct the stream name based on convention (e.g., 'ProductAggregate-12345')
    const streamName = `${this.aggregateName}-${id}`;
    console.log('inja 1');
    console.log(streamName);

    this.logger.log(`Reconstructing aggregate from stream: ${streamName}`);

    const aggregate = new this.aggregateRoot();

    try {
      // Use the EventStoreService's async generator similar to old readEvents function
      const eventStream =
        await this.eventStoreService.readStreamFromStart(streamName);

      let eventCount = 0;
      for await (const event of eventStream) {
        // Skip system events (similar to old code logic)
        if (!event || event.eventType?.startsWith('$')) {
          continue;
        }

        // Transform the event using the same transformers as old code
        // The event is already converted by EventStoreService.convert(), but we need to apply transformers
        if (this.eventTransformers[event.eventType]) {
          const transformedEvent =
            this.eventTransformers[event.eventType](event);
          // Apply event to aggregate (same as old rehydrate function)
          aggregate.apply(transformedEvent);
          eventCount++;
        } else {
          this.logger.warn(
            `No transformer found for event type: ${event.eventType}`,
          );
        }
      }

      this.logger.log(`${eventCount} events loaded from ${streamName}`);

      if (eventCount === 0) {
        throw new NotFoundException(
          `Aggregate with id ${id} not found (or stream is empty).`,
        );
      }
    } catch (error) {
      this.logger.error(`Error reading stream ${streamName}: ${error.message}`);

      // Handle StreamNotFoundError similar to old code
      if (
        error.message?.includes('Stream not found') ||
        error instanceof NotFoundException
      ) {
        throw new NotFoundException(
          `Aggregate with id ${id} not found (stream does not exist).`,
        );
      }

      throw error;
    }

    return aggregate;
  }
}
