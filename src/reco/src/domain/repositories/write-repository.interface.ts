import { AggregateRoot } from '@nestjs/cqrs';

export interface WriteRepository<T extends AggregateRoot> {
  findOneById(
    id: string,
    eventTransformers: Record<string, (event: any) => any>,
  ): Promise<T>;
}
