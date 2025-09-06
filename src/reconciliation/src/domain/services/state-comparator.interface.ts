import { ComparisonResult } from '../aggregates/comparison-result.aggregate';

/**
 * An interface for a state comparator.
 * A state comparator is used to compare two states and return the result of the comparison.
 */
export interface StateComparator {
  /**
   * Compares an expected state with an actual state.
   * @param expected The expected state.
   * @param actual The actual state.
   * @returns A `ComparisonResult` object that represents the result of the comparison.
   */
  compare(expected: any, actual: any): ComparisonResult;
}
