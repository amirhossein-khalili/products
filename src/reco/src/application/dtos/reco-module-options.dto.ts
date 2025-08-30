import { Schema } from 'mongoose';

export interface RecoModuleOptions<T = any> {
  name: string;
  schema: Schema;
  path: string;
  toComparableState: (aggregate: T) => any;
  aggregateRoot: new () => T;
  aggregateName: string;
  eventTransformers: Record<string, (event: any) => any>;
}
