import { Schema } from 'mongoose';
import { Type } from '@nestjs/common';
import { WriteRepository } from '../../domain/repositories/write-repository.interface';

export interface RecoModuleOptions<T = any> {
  name: string;
  schema: Schema;
  path: string;
  toComparableState: (aggregate: T) => any;
  aggregateRoot: Type<T>;
  eventTransformers?: Record<string, (event: any) => any>;
}
