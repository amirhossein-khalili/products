import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';

export interface StateComparator {
  compare(expected: any, actual: any): ComparisonResult;
}
