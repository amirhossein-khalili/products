import { Schema } from 'mongoose';
import { Type } from '@nestjs/common';

export interface ReconciliationModuleOptions<T = any> {
  name: string;
  schema: Schema;
  path: string;
  toComparableState: (aggregate: T) => any;
  aggregateRoot: Type<T>;
  aggregateName: string;
  eventTransformers: Record<string, (event: any) => any>;
}
