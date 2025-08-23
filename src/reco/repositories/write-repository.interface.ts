import { IMetadata } from 'com.chargoon.cloud.svc.common';

export interface IWriteRepository<T> {
  /**
   * Get a write model by ID.
   * @param id The ID.
   */
  findOneById(id: string, meta?: IMetadata): Promise<T>;
}
