import { Inject, Injectable } from '@nestjs/common';
import { Document } from 'mongoose';
import { ReconciliationRepository } from './repositories/reconciliation.repository';
import { IWriteRepository } from './repositories/write-repository.interface';
import { IMetadata } from 'com.chargoon.cloud.svc.common';

@Injectable()
export class RecoService<T extends Document> {
  constructor(
    private readonly repository: ReconciliationRepository<T>,
    @Inject('WRITE_REPOSITORY')
    private readonly writeRepository: IWriteRepository<T>,
  ) {}

  public async findAllIds(): Promise<string[]> {
    return this.repository.getAllIds();
  }

  public async findById(id: string): Promise<T | null> {
    return this.repository.findById(id) as Promise<T | null>;
  }

  public async findOneByIdFromWrite(
    id: string,
    meta?: IMetadata,
  ): Promise<T | null> {
    if (!this.writeRepository) {
      throw new Error('Write repository is not available for this entity');
    }
    return this.writeRepository.findOneById(id, meta);
  }
}
