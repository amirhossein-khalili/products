import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { WriteRepository } from '../../domain/repositories/write-repository.interface';
import { AggregateReconstructor as AggregateReconstructorInterface } from '../../domain/services/aggregate-reconstructor.interface';
import { WRITE_REPOSITORY } from '../constants/tokens';

@Injectable()
export class AggregateReconstructor<T>
  implements AggregateReconstructorInterface<T>
{
  private readonly logger = new Logger(AggregateReconstructor.name);

  constructor(
    @Inject(WRITE_REPOSITORY)
    private readonly writeRepository: WriteRepository<T>,
  ) {}

  async reconstruct(id: string): Promise<T> {
    const aggregate = await this.writeRepository.findOneById(id);

    if (!aggregate) {
      this.logger.warn(`Aggregate with id: ${id} not found.`);
      throw new NotFoundException(`Aggregate with id ${id} not found.`);
    }

    return aggregate;
  }
}
