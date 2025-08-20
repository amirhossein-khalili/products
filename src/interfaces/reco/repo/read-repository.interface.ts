/**
 * Generic interface for read repositories.
 * Extended to support various ID selection modes for reconciliation.
 */
export interface ReadRepository<T> {
  /**
   * Get all IDs from the read model.
   */
  getAllIds(): Promise<string[]>;

  /**
   * Get a read model by ID.
   * @param id The ID.
   */
  findById(id: string): Promise<T>;

  /**
   * Get IDs within a date range (for DATE_RANGE_CHECK mode).
   * @param startDate Start of the range.
   * @param endDate End of the range.
   */
  getIdsByDateRange(startDate: Date, endDate: Date): Promise<string[]>;

  /**
   * Get IDs based on custom filters (for FILTERED_CHECK mode).
   * @param filters Map of field-value filters.
   */
  getIdsByFilter(filters: Record<string, any>): Promise<string[]>;

  /**
   * یک سند را با شناسه پیدا کرده و با داده‌های جدید به‌روزرسانی می‌کند.
   * @param id شناسه سند.
   * @param updateData داده‌هایی که باید جایگزین شوند.
   * @returns سند به‌روزرسانی‌شده.
   */
  findByIdAndUpdate(id: string, updateData: Partial<T>): Promise<T | null>;
}
