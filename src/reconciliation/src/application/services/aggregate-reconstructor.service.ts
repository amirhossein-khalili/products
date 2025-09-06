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

  /**
   * Reconstructs an aggregate from its event stream.
   * @param id The ID of the aggregate to reconstruct.
   * @returns The reconstructed aggregate.
   * @throws {NotFoundException} If the aggregate with the given ID is not found.
   */
  async reconstruct(id: string): Promise<T> {
    const streamName = `${this.aggregateName}-${id}`;
    this.logger.log(`Reconstructing aggregate from stream: ${streamName}`);

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
