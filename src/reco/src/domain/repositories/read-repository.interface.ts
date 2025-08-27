export interface ReadRepository<T> {
  findById(id: string): Promise<T>;
  getAllIds(): Promise<string[]>;
  getIdsByDateRange(startDate: Date, endDate: Date): Promise<string[]>;
  getIdsByFilter(filters: Record<string, any>): Promise<string[]>;
  findByIdAndUpdate(id: string, updateData: Partial<T>): Promise<T | null>;
}
