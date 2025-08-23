import { Injectable } from '@nestjs/common';
import { Document } from 'mongoose';
import { ReconciliationRepository } from './repositories/reconciliation.repository';

@Injectable()
export class RecoService<T extends Document> {
  constructor(private readonly repository: ReconciliationRepository<T>) {}

  public async findAllIds(): Promise<string[]> {
    return this.repository.getAllIds();
  }

  public async findById(id: string): Promise<T | null> {
    return this.repository.findById(id) as Promise<T | null>;
  }
}
