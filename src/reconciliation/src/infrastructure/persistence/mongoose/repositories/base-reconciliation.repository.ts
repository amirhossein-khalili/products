import { Document, Model } from 'mongoose';
import { ReadRepository } from '../../../../domain/repositories/read-repository.interface';

/**
 * A base repository for reconciliation.
 * This class provides the basic implementation for a read repository using Mongoose.
 * @template T The type of the Mongoose document.
 */
export abstract class BaseReconciliationRepository<T extends Document>
  implements ReadRepository<T>
{
  protected constructor(protected readonly model: Model<T>) {}

  /**
   * Finds an entity by its ID.
   * @param id The ID of the entity to find.
   * @returns The entity, or null if the entity is not found.
   */
  async findById(id: string): Promise<any> {
    return this.model
      .findById(id)
      .lean()
      .select('-createdAt -updatedAt -__v')
      .exec();
  }

  /**
   * Gets the IDs of all entities.
   * @returns An array of entity IDs.
   */
  async getAllIds(): Promise<string[]> {
    const documents = await this.model.find({}, '_id').lean().exec();
    return documents.map((doc) => doc._id.toString());
  }

  /**
   * Gets the IDs of all entities within a date range.
   * @param startDate The start date of the date range.
   * @param endDate The end date of the date range.
   * @returns An array of entity IDs.
   */
  async getIdsByDateRange(startDate: Date, endDate: Date): Promise<string[]> {
    const documents = await this.model
      .find({ updatedAt: { $gte: startDate, $lte: endDate } } as any, '_id')
      .lean()
      .exec();
    return documents.map((doc) => doc._id.toString());
  }

  /**
   * Gets the IDs of all entities that match a filter.
   * @param filters The filter to apply.
   * @returns An array of entity IDs.
   */
  async getIdsByFilter(filters: Record<string, any>): Promise<string[]> {
    const documents = await this.model.find(filters, '_id').lean().exec();
    return documents.map((doc) => doc._id.toString());
  }

  /**
   * Finds an entity by its ID and updates it.
   * @param id The ID of the entity to update.
   * @param updateData The data to update the entity with.
   * @returns The updated entity, or null if the entity is not found.
   */
  async findByIdAndUpdate(
    id: string,
    updateData: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }
}
