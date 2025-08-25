import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';

export interface RecoServicePort {
  getComparableFields(): string[];
  checkSingleId(id: string, fields?: string[]): Promise<{
    id: string;
    expectedState: any;
    actualState: any;
    comparison: ComparisonResult;
  }>;
  reconcileById(id: string, fields?: string[]): Promise<any>;
  checkBatchIds(ids: string[], fields?: string[]): Promise<any[]>;
  reconcileBatchByIds(ids: string[], fields?: string[]): Promise<any[]>;
  checkAll(filters?: Record<string, any>, fields?: string[]): Promise<any[]>;
  reconcileAll(filters?: Record<string, any>, fields?: string[]): Promise<any[]>;
}
