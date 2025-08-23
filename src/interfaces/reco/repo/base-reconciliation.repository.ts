import { Document, Model } from 'mongoose';
import { ReadRepository } from './read-repository.interface';

/**
 * An abstract base for reconciliation repositories.
 * It extends the generic BaseRepository and implements the ReadRepository interface,
 * providing default implementations for the reconciliation-specific methods.
 */
export abstract class BaseReconciliationRepository<T extends Document>
  implements ReadRepository<T>
{
  protected constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<any> {
    return this.model
      .findById(id)
      .lean()
      .select('-createdAt -updatedAt -__v')
      .exec();
  }

  async getAllIds(): Promise<string[]> {
    const documents = await this.model.find({}, '_id').lean().exec();
    return documents.map((doc) => doc._id.toString());
  }

  async getIdsByDateRange(startDate: Date, endDate: Date): Promise<string[]> {
    const documents = await this.model
      .find({ updatedAt: { $gte: startDate, $lte: endDate } } as any, '_id')
      .lean()
      .exec();
    return documents.map((doc) => doc._id.toString());
  }

  async getIdsByFilter(filters: Record<string, any>): Promise<string[]> {
    const documents = await this.model.find(filters, '_id').lean().exec();
    return documents.map((doc) => doc._id.toString());
  }

  async findByIdAndUpdate(
    id: string,
    updateData: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }
}
