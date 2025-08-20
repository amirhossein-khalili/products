import { Document, Model } from 'mongoose';
import { IReconciliationRepository } from './reconciliation-repository.interface';
import { BaseAggregate } from 'com.chargoon.cloud.svc.common';

/**
 * A generic repository implementation for Mongoose to be used with the reconciliation module.
 * It provides a standard way to fetch data without needing a custom repository for each aggregate.
 */
export class GenericMongooseRepository<T extends Document>
  implements IReconciliationRepository<T>
{
  constructor(private readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async *streamIds(filters: Record<string, any>): AsyncGenerator<string[]> {
    const cursor = this.model.find(filters).select('_id').lean().cursor();
    let batch = [];
    // Define a default batch size
    const BATCH_SIZE = 100;
    for await (const doc of cursor) {
      batch.push(doc._id.toString());
      if (batch.length >= BATCH_SIZE) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length > 0) {
      yield batch;
    }
  }
}
