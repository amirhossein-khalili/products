import { Schema } from 'mongoose';

export interface RecoModuleOptions {
  name: string;
  schema: Schema;
  path: string;
}
