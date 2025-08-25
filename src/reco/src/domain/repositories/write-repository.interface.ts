export interface WriteRepository<T> {
  findOneById(id: string): Promise<T>;
}
