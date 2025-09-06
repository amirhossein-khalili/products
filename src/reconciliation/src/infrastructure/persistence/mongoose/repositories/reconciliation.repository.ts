import { Model, Document } from 'mongoose';
import { BaseReconciliationRepository } from './base-reconciliation.repository';

/**
 * A concrete implementation of the `BaseReconciliationRepository`.
 * This class can be used as a provider in a NestJS module.
 * @template T The type of the Mongoose document.
 */
export class ReconciliationRepository<
  T extends Document,
> extends BaseReconciliationRepository<T> {
  constructor(model: Model<T>) {
    super(model);
  }
}
