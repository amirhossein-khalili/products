import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { WriteRepository } from '../../domain/repositories/write-repository.interface';
import { AggregateReconstructor as AggregateReconstructorInterface } from '../../domain/services/aggregate-reconstructor.interface';
import { EVENT_TRANSFORMERS, WRITE_REPOSITORY } from '../constants/tokens';
import { AggregateRoot } from '@nestjs/cqrs';

@Injectable()
export class AggregateReconstructor<T extends AggregateRoot>
  implements AggregateReconstructorInterface<T>
{
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    @Inject(WRITE_REPOSITORY)
    private readonly writeRepository: WriteRepository<T>,
    @Inject(EVENT_TRANSFORMERS)
    private readonly eventTransformers: Record<string, (event: any) => any>,
  ) {}

  async reconstruct(id: string): Promise<T> {
    const aggregate = await this.writeRepository.findOneById(
      id,
      this.eventTransformers,
    );

    if (!aggregate) {
      this.logger.warn(`Aggregate with id: ${id} not found.`);
      throw new NotFoundException(`Aggregate with id ${id} not found.`);
    }

    return aggregate;
  }
}
