import { Schema } from 'mongoose';
import { Type } from '@nestjs/common';
import { IWriteRepository } from '../repositories/write-repository.interface';

export interface RecoModuleOptions<T = any> {
  name: string;
  schema: Schema;
  path: string;
  writeRepository?: Type<IWriteRepository<any>>;
  writeRepoToken?: string;
  toComparableState: (aggregate: T) => any;
  aggregateRoot: any;
}
