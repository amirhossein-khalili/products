/**
 * An interface for a read repository.
 * A read repository is used to query the read model.
 */
export interface ReadRepository<T> {
  /**
   * Finds an entity by its ID.
   * @param id The ID of the entity to find.
   * @returns The entity, or null if the entity is not found.
   */
  findById(id: string): Promise<T | null>;

  /**
   * Gets the IDs of all entities.
   * @returns An array of entity IDs.
   */
  getAllIds(): Promise<string[]>;

  /**
   * Gets the IDs of all entities within a date range.
   * @param startDate The start date of the date range.
   * @param endDate The end date of the date range.
   * @returns An array of entity IDs.
   */
  getIdsByDateRange(startDate: Date, endDate: Date): Promise<string[]>;

  /**
   * Gets the IDs of all entities that match a filter.
   * @param filters The filter to apply.
   * @returns An array of entity IDs.
   */
  getIdsByFilter(filters: Record<string, any>): Promise<string[]>;

  /**
   * Finds an entity by its ID and updates it.
   * @param id The ID of the entity to update.
   * @param updateData The data to update the entity with.
   * @returns The updated entity, or null if the entity is not found.
   */
  findByIdAndUpdate(id: string, updateData: Partial<T>): Promise<T | null>;
}
