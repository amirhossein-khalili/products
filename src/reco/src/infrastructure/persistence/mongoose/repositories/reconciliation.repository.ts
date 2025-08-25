import { Model, Document } from 'mongoose';
import { BaseReconciliationRepository } from './base-reconciliation.repository';

export class ReconciliationRepository<T extends Document> 
  extends BaseReconciliationRepository<T> 
{
  constructor(model: Model<T>) {
    super(model);
  }
}
