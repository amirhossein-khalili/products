import { Document } from 'mongoose';

export interface IAggregateReconstructor<A> {
  reconstruct(id: string): Promise<A>;
}

export interface IReadRepository<D extends Document> {
  findById(id: string): Promise<D | null>;
  getAllIds(): Promise<string[]>;
  getIdsByFilter(filters: Record<string, any>): Promise<string[]>;
  findByIdAndUpdate(id: string, updateData: Partial<D>): Promise<D | null>;
}

export interface RecoModuleOptions<> {}

export const RECO_CONFIG_OPTIONS = 'RECO_CONFIG_OPTIONS';
