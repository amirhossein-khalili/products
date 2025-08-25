import { Injectable, Logger, NotFoundException , Inject } from '@nestjs/common';
import { IWriteRepository } from '../repositories/write-repository.interface';

@Injectable()
export class AggregateReconstructor<T> {
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    @Inject('WRITE_REPOSITORY')
    private readonly writeRepository: IWriteRepository<T>,
  ) {}

  /**
   * Reconstructs an aggregate from its events.
   * @param streamId The aggregate ID.
   * @param aggregateName The unique name of the aggregate as registered in ConfigRegistry.
   * @param meta Optional metadata for event sourcing.
   * @returns The reconstructed aggregate instance.
   */
  // async reconstruct<T extends BaseAggregate>(streamId: string): Promise<T> {
  async reconstruct(streamId: string): Promise<T> {
    const Aggregate = await this.writeRepository.findOneById(streamId);

    if (!Aggregate) {
      this.logger.warn(`Aggregate with streamId: ${streamId} not found.`);
      throw new NotFoundException(`Aggregate with id ${streamId} not found.`);
    }

    return Aggregate;
  }
}
